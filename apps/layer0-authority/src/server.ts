import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env") });
import cors from "cors";
import express, { type Request, type Response } from "express";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { verifyFirebaseIdToken } from "./firebaseAuth.js";
import { getDb } from "./db.js";
import * as dbService from "./dbService.js";
import { redeemRateLimiter } from "./rateLimiter.js";
import * as fraudDetection from "./fraudDetection.js";
import * as paymentService from "./paymentService.js";
import { normalizeSerial, validateChecksum } from "./cryptoSerial.js";
import * as catalog from "./catalog.js";
import Stripe from "stripe";

type InstallState = "not-installed" | "installing" | "installed" | "error";

type HubSession = {
  userId: string;
  email: string;
  displayName: string;
  signedInAt: string;
};

type EntitledApp = {
  id: string;
  name: string;
  version: string;
  installedVersion: string | null;
  owned: boolean;
  installState: InstallState;
  updateAvailable: boolean;
};

type OfflineCacheState = {
  lastValidatedAt: string | null;
  maxOfflineDays: number;
  offlineDaysRemaining: number;
  cacheState: "empty" | "valid" | "stale";
};

type InstallTransaction = {
  id: string;
  appId: string;
  appName: string;
  action: "install" | "update";
  status: "succeeded" | "failed";
  message: string;
  occurredAt: string;
};

type AuthorityState = {
  session: HubSession | null;
  entitlements: EntitledApp[];
  offlineCache: OfflineCacheState;
  transactions: InstallTransaction[];
};

const OFFLINE_MAX_DAYS = 21;
const MAX_TRANSACTIONS = 50;
const statePath = join(__dirname, "../data/state.json");

function nowIso(): string {
  return new Date().toISOString();
}

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
}

function hydrateOfflineCache(offlineCache: OfflineCacheState): OfflineCacheState {
  if (!offlineCache.lastValidatedAt) {
    return {
      ...offlineCache,
      offlineDaysRemaining: 0,
      cacheState: "empty"
    };
  }

  const elapsed = daysBetween(offlineCache.lastValidatedAt, nowIso());
  const remaining = Math.max(0, OFFLINE_MAX_DAYS - elapsed);

  return {
    ...offlineCache,
    maxOfflineDays: OFFLINE_MAX_DAYS,
    offlineDaysRemaining: remaining,
    cacheState: remaining > 0 ? "valid" : "stale"
  };
}

function readState(): AuthorityState {
  if (!existsSync(statePath)) {
    throw new Error(`State file missing at ${statePath}`);
  }
  const parsed = JSON.parse(readFileSync(statePath, "utf-8")) as AuthorityState;
  return {
    ...parsed,
    transactions: parsed.transactions ?? [],
    offlineCache: hydrateOfflineCache(parsed.offlineCache)
  };
}

function writeState(state: AuthorityState): AuthorityState {
  // Transactions are newest-first; keep the newest MAX_TRANSACTIONS (same as appendTransaction).
  const hydrated = {
    ...state,
    transactions: (state.transactions ?? []).slice(0, MAX_TRANSACTIONS),
    offlineCache: hydrateOfflineCache(state.offlineCache)
  };
  writeFileSync(statePath, `${JSON.stringify(hydrated, null, 2)}\n`, "utf-8");
  return hydrated;
}

function appendTransaction(
  state: AuthorityState,
  action: InstallTransaction["action"],
  status: InstallTransaction["status"],
  app: EntitledApp,
  message: string
): AuthorityState {
  const entry: InstallTransaction = {
    id: `tx_${Math.random().toString(36).slice(2, 10)}`,
    appId: app.id,
    appName: app.name,
    action,
    status,
    message,
    occurredAt: nowIso()
  };

  return {
    ...state,
    transactions: [entry, ...(state.transactions ?? [])].slice(0, MAX_TRANSACTIONS)
  };
}

function requireSession(state: AuthorityState, response: Response): HubSession | null {
  if (!state.session) {
    response.status(401).json({ message: "Authentication required." });
    return null;
  }
  return state.session;
}

function findApp(state: AuthorityState, appId: string): EntitledApp | null {
  return state.entitlements.find((candidate) => candidate.id === appId) ?? null;
}

function toDisplayName(email: string): string {
  const local = email.split("@")[0] ?? "producer";
  return (
    local
      .split(/[._-]/g)
      .filter(Boolean)
      .map((token) => token[0].toUpperCase() + token.slice(1))
      .join(" ") || "Antiphon User"
  );
}

const app = express();
app.use(cors());
app.use(express.json());

// Trust proxy for accurate IP addresses (important for rate limiting and fraud detection)
app.set("trust proxy", 1);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.post("/auth/session", (req: Request, res: Response) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    res.status(400).json({ message: "Valid email is required." });
    return;
  }

  const state = readState();
  const session: HubSession = {
    userId: `usr_${Math.random().toString(36).slice(2, 10)}`,
    email,
    displayName: toDisplayName(email),
    signedInAt: nowIso()
  };

  const next = writeState({
    ...state,
    session,
    offlineCache: {
      ...state.offlineCache,
      lastValidatedAt: nowIso(),
      maxOfflineDays: OFFLINE_MAX_DAYS,
      offlineDaysRemaining: OFFLINE_MAX_DAYS,
      cacheState: "valid"
    }
  });

  res.json(next.session);
});

app.delete("/auth/session", (_req: Request, res: Response) => {
  const state = readState();
  const next = writeState({
    ...state,
    session: null
  });
  res.json({ ok: true, session: next.session });
});

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

app.post("/auth/firebase", async (req: Request, res: Response) => {
  const idToken = typeof req.body?.idToken === "string" ? req.body.idToken.trim() : "";
  if (!idToken) {
    res.status(400).json({ message: "idToken is required." });
    return;
  }
  if (!FIREBASE_PROJECT_ID) {
    res.status(503).json({ message: "Firebase auth not configured (FIREBASE_PROJECT_ID)." });
    return;
  }
  try {
    const payload = await verifyFirebaseIdToken(FIREBASE_PROJECT_ID, idToken);
    const email = (payload.email ?? "").toString().trim().toLowerCase();
    const name = typeof payload.name === "string" ? payload.name.trim() : null;
    const displayName =
      name && name.length > 0 ? name : (email ? toDisplayName(email) : "Antiphon User");
    const state = readState();
    const session: HubSession = {
      userId: payload.sub ?? `usr_${Math.random().toString(36).slice(2, 10)}`,
      email: email || "firebase-user@antiphon.audio",
      displayName,
      signedInAt: nowIso()
    };
    const next = writeState({
      ...state,
      session,
      offlineCache: {
        ...state.offlineCache,
        lastValidatedAt: nowIso(),
        maxOfflineDays: OFFLINE_MAX_DAYS,
        offlineDaysRemaining: OFFLINE_MAX_DAYS,
        cacheState: "valid"
      }
    });
    res.json(next.session);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid token.";
    res.status(401).json({ message: `Firebase token verification failed: ${message}` });
  }
});

app.get("/entitlements", (_req: Request, res: Response) => {
  const state = readState();
  if (!requireSession(state, res)) {
    return;
  }
  res.json(state.entitlements);
});

app.post("/entitlements/refresh", (_req: Request, res: Response) => {
  const state = readState();
  if (!requireSession(state, res)) {
    return;
  }

  const next = writeState({
    ...state,
    offlineCache: {
      ...state.offlineCache,
      lastValidatedAt: nowIso(),
      maxOfflineDays: OFFLINE_MAX_DAYS,
      offlineDaysRemaining: OFFLINE_MAX_DAYS,
      cacheState: "valid"
    }
  });

  res.json(next.offlineCache);
});

app.get("/offline-cache/status", (_req: Request, res: Response) => {
  const state = readState();
  res.json(state.offlineCache);
});

app.get("/transactions", (_req: Request, res: Response) => {
  const state = readState();
  if (!requireSession(state, res)) {
    return;
  }
  res.json(state.transactions);
});

app.post("/installs/:appId", (req: Request, res: Response) => {
  let state = readState();
  if (!requireSession(state, res)) {
    return;
  }

  const appId = req.params.appId;
  const target = findApp(state, appId);
  if (!target) {
    res.status(404).json({ message: `App ${appId} not found.` });
    return;
  }
  if (!target.owned) {
    state = appendTransaction(state, "install", "failed", target, "Install blocked: app not owned.");
    writeState(state);
    res.status(403).json({ message: `App ${appId} is not owned by this identity.` });
    return;
  }

  const installed: EntitledApp = {
    ...target,
    installedVersion: target.version,
    installState: "installed",
    updateAvailable: false
  };

  state = {
    ...state,
    entitlements: state.entitlements.map((candidate) => (candidate.id === appId ? installed : candidate))
  };
  state = appendTransaction(state, "install", "succeeded", installed, `Installed ${installed.version}.`);

  const next = writeState(state);
  const saved = findApp(next, appId);
  res.json(saved);
});

app.post("/updates/:appId", (req: Request, res: Response) => {
  let state = readState();
  if (!requireSession(state, res)) {
    return;
  }

  const appId = req.params.appId;
  const target = findApp(state, appId);
  if (!target) {
    res.status(404).json({ message: `App ${appId} not found.` });
    return;
  }
  if (!target.owned) {
    state = appendTransaction(state, "update", "failed", target, "Update blocked: app not owned.");
    writeState(state);
    res.status(403).json({ message: `App ${appId} is not owned by this identity.` });
    return;
  }
  if (!target.installedVersion) {
    state = appendTransaction(state, "update", "failed", target, "Update blocked: app not installed yet.");
    writeState(state);
    res.status(409).json({ message: `App ${appId} must be installed before updating.` });
    return;
  }

  const updated: EntitledApp = {
    ...target,
    installedVersion: target.version,
    installState: "installed",
    updateAvailable: false
  };

  state = {
    ...state,
    entitlements: state.entitlements.map((candidate) => (candidate.id === appId ? updated : candidate))
  };
  state = appendTransaction(state, "update", "succeeded", updated, `Updated to ${updated.version}.`);

  const next = writeState(state);
  const saved = findApp(next, appId);
  res.json(saved);
});

// Serial redemption endpoint with rate limiting and fraud detection
app.post("/redeem", redeemRateLimiter, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const state = readState();
    const session = requireSession(state, res);
    if (!session) {
      return;
    }

    const serial = String(req.body?.serial ?? "").trim();
    if (!serial) {
      res.status(400).json({ message: "Serial is required." });
      return;
    }

    // Get client IP for fraud detection
    const ipAddress = fraudDetection.getClientIp(req);

    // Check fraud threshold
    const fraudCheck = fraudDetection.checkFraudThreshold(db, session.userId, ipAddress);
    if (fraudCheck.exceeded) {
      fraudDetection.logFraud(db, {
        user_id: session.userId,
        ip_address: ipAddress,
        action: "rate_limit_exceeded",
        reason: `Fraud threshold exceeded: ${fraudCheck.count} fraud entries in last hour`
      });
      res.status(429).json({
        message: "Too many failed attempts. Please contact support or try again later."
      });
      return;
    }

    // Detect rapid redeems
    if (fraudDetection.detectRapidRedeems(db, ipAddress)) {
      res.status(429).json({
        message: "Too many redemption attempts from this location. Please try again later."
      });
      return;
    }

    // Normalize serial and validate checksum
    const normalized = normalizeSerial(serial);
    if (!validateChecksum(serial)) {
      fraudDetection.logFraud(db, {
        user_id: session.userId,
        ip_address: ipAddress,
        action: "invalid_pattern",
        reason: `Invalid checksum for serial: ${serial.substring(0, 20)}...`
      });
      res.status(400).json({ message: "Invalid serial format or checksum." });
      return;
    }

    // Check for duplicate serial attempts
    if (fraudDetection.detectDuplicateSerialAttempt(db, normalized, session.userId, ipAddress)) {
      res.status(400).json({ message: "This serial has already been redeemed by another user." });
      return;
    }

    // Log redeem attempt
    fraudDetection.logFraud(db, {
      user_id: session.userId,
      ip_address: ipAddress,
      action: "redeem_attempt",
      reason: `Redeem attempt for serial: ${normalized.substring(0, 20)}...`
    });

    // Attempt redemption
    const result = dbService.redeemSerial(db, session.userId, normalized);
    if (!result.success) {
      res.status(400).json({ message: result.reason });
      return;
    }

    // Return updated entitlements
    const entitlements = dbService.getUserEntitlements(db, session.userId);
    res.json({
      success: true,
      productId: result.productId,
      productName: result.productName,
      entitlements
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Redeem failed";
    res.status(500).json({ message });
  }
});

// Stripe webhook endpoint
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      console.warn("[stripe-webhook] Stripe not configured (STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET missing)");
      res.status(503).json({ message: "Stripe webhook not configured" });
      return;
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const sig = req.headers["stripe-signature"] as string;

    if (!sig) {
      res.status(400).json({ message: "Missing stripe-signature header" });
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Webhook signature verification failed";
      console.error("[stripe-webhook] Signature verification failed:", message);
      res.status(400).json({ message });
      return;
    }

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_email || session.customer_details?.email;

      if (!customerEmail) {
        console.error("[stripe-webhook] No customer email in session", session.id);
        res.status(400).json({ message: "No customer email" });
        return;
      }

      // Get line items to determine which product was purchased
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

      if (lineItems.data.length === 0) {
        console.error("[stripe-webhook] No line items in session", session.id);
        res.status(400).json({ message: "No line items" });
        return;
      }

      const db = getDb();

      // Process each line item
      for (const item of lineItems.data) {
        // Map Stripe product ID to our product ID
        // Option 1: Use metadata.productId if you set it in Stripe
        // Option 2: Use a mapping table
        // Option 3: Use Stripe product name/ID mapping
        const stripePriceId = item.price?.id as string;
        const metadataProductId =
          item.price?.metadata?.productId || item.price?.metadata?.antiphon_product_id;

        let productId: string | null = null;

        if (metadataProductId) {
          // Product ID stored in Stripe price metadata
          productId = metadataProductId;
        } else if (stripePriceId) {
          // Try to find product by Stripe price ID
          const product = catalog.getProductByStripePriceId(stripePriceId);
          if (product) {
            productId = product.id;
          }
        }

        if (!productId) {
          console.warn(
            `[stripe-webhook] No productId metadata for Stripe price ${stripePriceId}. Set metadata.productId when creating Stripe prices.`
          );
          continue;
        }

        // Check payment deduplication
        const paymentCheck = paymentService.checkPaymentExists(db, session.id, "stripe");
        if (paymentCheck.exists && paymentCheck.alreadyGranted) {
          console.log(`[stripe-webhook] Payment ${session.id} already granted entitlement for ${productId}`);
          continue;
        }

        // Get or create user by email
        const normalizedEmail = customerEmail.trim().toLowerCase();
        let userId: string;

        const existingUser = db
          .prepare("SELECT user_id FROM sessions WHERE email = ?")
          .get(normalizedEmail) as { user_id: string } | undefined;

        if (existingUser) {
          userId = existingUser.user_id;
        } else {
          // Create new user
          userId = `usr_${Math.random().toString(36).slice(2, 10)}`;
          const displayName = toDisplayName(normalizedEmail);
          dbService.getOrCreateSession(db, userId, normalizedEmail, displayName);
        }

        // Record payment
        paymentService.recordPayment(
          db,
          {
            payment_id: session.id,
            payment_provider: "stripe",
            customer_email: normalizedEmail,
            product_id: productId,
            amount: item.amount_total ? item.amount_total / 100 : undefined, // Convert cents to dollars
            currency: item.currency?.toUpperCase()
          },
          "completed"
        );

        // Grant entitlement
        const grantResult = paymentService.grantEntitlementFromPayment(
          db,
          session.id,
          "stripe",
          userId,
          productId
        );

        if (grantResult.success) {
          console.log(
            `[stripe-webhook] Granted entitlement: ${productId} to ${normalizedEmail} (${userId})`
          );
        } else {
          console.error(`[stripe-webhook] Failed to grant entitlement: ${grantResult.reason}`);
        }
      }

      res.json({ received: true });
      return;
    }

    // Other event types - just acknowledge
    res.json({ received: true });
  }
);

// Coinbase Commerce webhook endpoint
const COINBASE_COMMERCE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY;
const COINBASE_COMMERCE_WEBHOOK_SECRET = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;

app.post("/webhooks/coinbase", express.json(), async (req: Request, res: Response) => {
  if (!COINBASE_COMMERCE_WEBHOOK_SECRET) {
    console.warn("[coinbase-webhook] Coinbase Commerce not configured (COINBASE_COMMERCE_WEBHOOK_SECRET missing)");
    res.status(503).json({ message: "Coinbase Commerce webhook not configured" });
    return;
  }

  try {
    const signature = req.headers["x-cc-webhook-signature"] as string;
    if (!signature) {
      res.status(400).json({ message: "Missing x-cc-webhook-signature header" });
      return;
    }

    // Verify webhook signature (HMAC-SHA256)
    const crypto = await import("node:crypto");
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", COINBASE_COMMERCE_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("[coinbase-webhook] Signature verification failed");
      res.status(400).json({ message: "Invalid webhook signature" });
      return;
    }

    const event = req.body;

    // Handle charge:confirmed event
    if (event.type === "charge:confirmed") {
      const charge = event.data;
      const customerEmail = charge.metadata?.customer_email || charge.pricing?.local?.amount;

      if (!customerEmail) {
        console.error("[coinbase-webhook] No customer email in charge", charge.code);
        res.status(400).json({ message: "No customer email" });
        return;
      }

      // Get product ID from metadata
      const productId =
        charge.metadata?.productId ||
        charge.metadata?.antiphon_product_id ||
        charge.description;

      if (!productId) {
        console.error("[coinbase-webhook] No productId in charge metadata", charge.code);
        res.status(400).json({ message: "No productId in charge metadata" });
        return;
      }

      const db = getDb();

      // Check payment deduplication
      const paymentCheck = paymentService.checkPaymentExists(db, charge.code, "coinbase");
      if (paymentCheck.exists && paymentCheck.alreadyGranted) {
        console.log(`[coinbase-webhook] Payment ${charge.code} already granted entitlement for ${productId}`);
        res.json({ received: true });
        return;
      }

      // Get or create user by email
      const normalizedEmail = typeof customerEmail === "string" ? customerEmail.trim().toLowerCase() : null;
      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        res.status(400).json({ message: "Invalid customer email" });
        return;
      }

      let userId: string;
      const existingUser = db
        .prepare("SELECT user_id FROM sessions WHERE email = ?")
        .get(normalizedEmail) as { user_id: string } | undefined;

      if (existingUser) {
        userId = existingUser.user_id;
      } else {
        // Create new user
        userId = `usr_${Math.random().toString(36).slice(2, 10)}`;
        const displayName = toDisplayName(normalizedEmail);
        dbService.getOrCreateSession(db, userId, normalizedEmail, displayName);
      }

      // Record payment
      const pricing = charge.pricing;
      paymentService.recordPayment(
        db,
        {
          payment_id: charge.code,
          payment_provider: "coinbase",
          customer_email: normalizedEmail,
          product_id: productId,
          amount: pricing?.local?.amount ? parseFloat(pricing.local.amount) : undefined,
          currency: pricing?.local?.currency || "USD"
        },
        "completed"
      );

      // Grant entitlement
      const grantResult = paymentService.grantEntitlementFromPayment(
        db,
        charge.code,
        "coinbase",
        userId,
        productId
      );

      if (grantResult.success) {
        console.log(
          `[coinbase-webhook] Granted entitlement: ${productId} to ${normalizedEmail} (${userId})`
        );
      } else {
        console.error(`[coinbase-webhook] Failed to grant entitlement: ${grantResult.reason}`);
      }

      res.json({ received: true });
      return;
    }

    // Other event types - just acknowledge
    res.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    console.error("[coinbase-webhook] Error:", message);
    res.status(500).json({ message });
  }
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`[layer0-authority] listening on http://localhost:${port}`);
});
