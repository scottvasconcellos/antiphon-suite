import cors from "cors";
import express, { type Request, type Response } from "express";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

type AuthorityState = {
  session: HubSession | null;
  entitlements: EntitledApp[];
  offlineCache: OfflineCacheState;
};

const OFFLINE_MAX_DAYS = 21;
const __dirname = dirname(fileURLToPath(import.meta.url));
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
    offlineCache: hydrateOfflineCache(parsed.offlineCache)
  };
}

function writeState(state: AuthorityState): AuthorityState {
  const hydrated = {
    ...state,
    offlineCache: hydrateOfflineCache(state.offlineCache)
  };
  writeFileSync(statePath, `${JSON.stringify(hydrated, null, 2)}\n`, "utf-8");
  return hydrated;
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

app.post("/installs/:appId", (req: Request, res: Response) => {
  const state = readState();
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
    res.status(403).json({ message: `App ${appId} is not owned by this identity.` });
    return;
  }

  const installed: EntitledApp = {
    ...target,
    installedVersion: target.version,
    installState: "installed",
    updateAvailable: false
  };

  const next = writeState({
    ...state,
    entitlements: state.entitlements.map((candidate) => (candidate.id === appId ? installed : candidate))
  });

  const saved = findApp(next, appId);
  res.json(saved);
});

app.post("/updates/:appId", (req: Request, res: Response) => {
  const state = readState();
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
    res.status(403).json({ message: `App ${appId} is not owned by this identity.` });
    return;
  }

  const updated: EntitledApp = {
    ...target,
    installedVersion: target.version,
    installState: "installed",
    updateAvailable: false
  };

  const next = writeState({
    ...state,
    entitlements: state.entitlements.map((candidate) => (candidate.id === appId ? updated : candidate))
  });

  const saved = findApp(next, appId);
  res.json(saved);
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`[layer0-authority] listening on http://localhost:${port}`);
});
