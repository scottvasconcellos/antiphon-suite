import Database from "better-sqlite3";
import { getDb } from "./db.js";
import { seedProducts, CANONICAL_PRODUCTS } from "./catalog.js";

// Types matching server.ts
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
  installState: "not-installed" | "installing" | "installed" | "error";
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

const OFFLINE_MAX_DAYS = 21;

function nowIso(): string {
  return new Date().toISOString();
}

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
}

/**
 * Get or create session for user.
 */
export function getOrCreateSession(
  db: Database.Database,
  userId: string,
  email: string,
  displayName: string
): HubSession {
  const existing = db.prepare("SELECT * FROM sessions WHERE user_id = ?").get(userId) as
    | { user_id: string; email: string; display_name: string; signed_in_at: string }
    | undefined;

  if (existing) {
    // Update signed_in_at
    db.prepare("UPDATE sessions SET signed_in_at = ? WHERE user_id = ?").run(nowIso(), userId);
    return {
      userId: existing.user_id,
      email: existing.email,
      displayName: existing.display_name,
      signedInAt: existing.signed_in_at
    };
  }

  const signedInAt = nowIso();
  db.prepare("INSERT INTO sessions (user_id, email, display_name, signed_in_at) VALUES (?, ?, ?, ?)").run(
    userId,
    email,
    displayName,
    signedInAt
  );

  // Initialize offline cache
  db.prepare(
    "INSERT OR IGNORE INTO offline_cache (user_id, last_validated_at, max_offline_days) VALUES (?, ?, ?)"
  ).run(userId, signedInAt, OFFLINE_MAX_DAYS);

  return { userId, email, displayName, signedInAt };
}

/**
 * Get entitlements for user: merge catalog with user's owned products.
 */
export function getUserEntitlements(db: Database.Database, userId: string): EntitledApp[] {
  seedProducts(db);

  const ownedProducts = db
    .prepare("SELECT product_id FROM entitlements WHERE user_id = ?")
    .all(userId) as Array<{ product_id: string }>;

  const ownedSet = new Set(ownedProducts.map((p) => p.product_id));

  const products = db.prepare("SELECT * FROM products").all() as Array<{
    id: string;
    name: string;
    version: string;
    channel: string;
  }>;

  // Get installed versions from transactions
  const installedVersions = new Map<string, string>();
  const installTransactions = db
    .prepare(
      "SELECT product_id, message FROM transactions WHERE user_id = ? AND action = 'install' AND status = 'succeeded' ORDER BY occurred_at DESC"
    )
    .all(userId) as Array<{ product_id: string; message: string }>;

  for (const tx of installTransactions) {
    if (!installedVersions.has(tx.product_id)) {
      // Extract version from message like "Installed 1.0.0."
      const match = tx.message.match(/Installed\s+([\d.]+)/);
      if (match) {
        installedVersions.set(tx.product_id, match[1]);
      }
    }
  }

  return products.map((product) => {
    const owned = ownedSet.has(product.id);
    const installedVersion = installedVersions.get(product.id) || null;
    const currentVersion = product.version;

    return {
      id: product.id,
      name: product.name,
      version: currentVersion,
      installedVersion,
      owned,
      installState: installedVersion ? "installed" : "not-installed",
      updateAvailable: Boolean(owned && installedVersion && installedVersion !== currentVersion)
    };
  });
}

/**
 * Redeem a serial and grant entitlement.
 * Uses database transaction to prevent race conditions.
 */
export function redeemSerial(
  db: Database.Database,
  userId: string,
  serial: string
): { success: true; productId: string; productName: string } | { success: false; reason: string } {
  seedProducts(db);

  // Normalize serial: remove spaces, convert to uppercase
  const normalized = serial.trim().replace(/\s+/g, "-").toUpperCase();

  // Use transaction to ensure atomicity (prevents race conditions)
  const transaction = db.transaction((): { success: true; productId: string; productName: string } | { success: false; reason: string } => {
    // Check serial exists and get product_id (with lock to prevent concurrent redemption)
    const serialRow = db
      .prepare("SELECT * FROM serials WHERE serial = ?")
      .get(normalized) as
      | { serial: string; product_id: string; redeemed_at: string | null; redeemed_by_user_id: string | null }
      | undefined;

    if (!serialRow) {
      return { success: false, reason: "Serial not found" };
    }

    if (serialRow.redeemed_at) {
      return { success: false, reason: "Serial already redeemed" };
    }

    // Mark serial as redeemed (atomic update)
    db.prepare("UPDATE serials SET redeemed_at = ?, redeemed_by_user_id = ? WHERE serial = ? AND redeemed_at IS NULL").run(
      nowIso(),
      userId,
      normalized
    );

    // Check if update actually happened (another process might have redeemed it)
    const checkRedeemed = db
      .prepare("SELECT redeemed_at FROM serials WHERE serial = ?")
      .get(normalized) as { redeemed_at: string | null } | undefined;

    if (!checkRedeemed || !checkRedeemed.redeemed_at) {
      return { success: false, reason: "Serial redemption failed (concurrent redemption detected)" };
    }

    // Grant entitlement
    db.prepare(
      "INSERT OR IGNORE INTO entitlements (user_id, product_id, granted_at, granted_via) VALUES (?, ?, ?, ?)"
    ).run(userId, serialRow.product_id, nowIso(), "serial");

    const product = db.prepare("SELECT name FROM products WHERE id = ?").get(serialRow.product_id) as
      | { name: string }
      | undefined;

    return {
      success: true,
      productId: serialRow.product_id,
      productName: product?.name || serialRow.product_id
    };
  });

  return transaction();
}

/**
 * Get offline cache state for user.
 */
export function getOfflineCache(db: Database.Database, userId: string): OfflineCacheState {
  const row = db
    .prepare("SELECT * FROM offline_cache WHERE user_id = ?")
    .get(userId) as
    | { user_id: string; last_validated_at: string | null; max_offline_days: number }
    | undefined;

  if (!row || !row.last_validated_at) {
    return {
      lastValidatedAt: null,
      maxOfflineDays: OFFLINE_MAX_DAYS,
      offlineDaysRemaining: 0,
      cacheState: "empty"
    };
  }

  const elapsed = daysBetween(row.last_validated_at, nowIso());
  const remaining = Math.max(0, OFFLINE_MAX_DAYS - elapsed);

  return {
    lastValidatedAt: row.last_validated_at,
    maxOfflineDays: OFFLINE_MAX_DAYS,
    offlineDaysRemaining: remaining,
    cacheState: remaining > 0 ? "valid" : "stale"
  };
}

/**
 * Update offline cache validation timestamp.
 */
export function refreshOfflineCache(db: Database.Database, userId: string): OfflineCacheState {
  const now = nowIso();
  db.prepare("UPDATE offline_cache SET last_validated_at = ? WHERE user_id = ?").run(now, userId);
  return getOfflineCache(db, userId);
}

/**
 * Get transactions for user.
 */
export function getUserTransactions(db: Database.Database, userId: string): InstallTransaction[] {
  const rows = db
    .prepare(
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY occurred_at DESC LIMIT 50"
    )
    .all(userId) as Array<{
    id: string;
    user_id: string;
    product_id: string;
    action: string;
    status: string;
    message: string;
    occurred_at: string;
  }>;

  const products = new Map(
    (db.prepare("SELECT id, name FROM products").all() as Array<{ id: string; name: string }>).map(
      (p) => [p.id, p.name]
    )
  );

  return rows.map((row) => ({
    id: row.id,
    appId: row.product_id,
    appName: products.get(row.product_id) || row.product_id,
    action: row.action as "install" | "update",
    status: row.status as "succeeded" | "failed",
    message: row.message,
    occurredAt: row.occurred_at
  }));
}

/**
 * Record a transaction.
 */
export function recordTransaction(
  db: Database.Database,
  userId: string,
  productId: string,
  action: "install" | "update",
  status: "succeeded" | "failed",
  message: string
): void {
  const id = `tx_${Math.random().toString(36).slice(2, 10)}`;
  db.prepare(
    "INSERT INTO transactions (id, user_id, product_id, action, status, message, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, userId, productId, action, status, message, nowIso());
}
