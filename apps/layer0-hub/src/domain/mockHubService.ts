import { type EntitledApp, type HubSession, type HubSnapshot } from "./types";

const STORAGE_KEY = "antiphon.layer0.hub.snapshot";
const OFFLINE_MAX_DAYS = 21;

const DEFAULT_ENTITLEMENTS: EntitledApp[] = [
  {
    id: "hub-synth",
    name: "Antiphon Synth",
    version: "3.2.0",
    installedVersion: null,
    owned: true,
    installState: "not-installed",
    updateAvailable: false
  },
  {
    id: "hub-delay",
    name: "Antiphon Delay",
    version: "1.4.0",
    installedVersion: "1.2.0",
    owned: true,
    installState: "installed",
    updateAvailable: true
  },
  {
    id: "hub-chorus",
    name: "Antiphon Chorus",
    version: "1.1.3",
    installedVersion: "1.1.3",
    owned: true,
    installState: "installed",
    updateAvailable: false
  }
];

function nowIso(): string {
  return new Date().toISOString();
}

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
}

function createBaseSnapshot(): HubSnapshot {
  return {
    session: null,
    entitlements: DEFAULT_ENTITLEMENTS,
    offlineCache: {
      lastValidatedAt: null,
      maxOfflineDays: OFFLINE_MAX_DAYS,
      offlineDaysRemaining: 0,
      cacheState: "empty"
    }
  };
}

function withComputedOfflineState(snapshot: HubSnapshot): HubSnapshot {
  const lastValidatedAt = snapshot.offlineCache.lastValidatedAt;

  if (!lastValidatedAt) {
    return {
      ...snapshot,
      offlineCache: {
        ...snapshot.offlineCache,
        offlineDaysRemaining: 0,
        cacheState: "empty"
      }
    };
  }

  const elapsedDays = daysBetween(lastValidatedAt, nowIso());
  const remaining = Math.max(0, OFFLINE_MAX_DAYS - elapsedDays);

  return {
    ...snapshot,
    offlineCache: {
      ...snapshot.offlineCache,
      offlineDaysRemaining: remaining,
      cacheState: remaining > 0 ? "valid" : "stale"
    }
  };
}

function persist(snapshot: HubSnapshot): HubSnapshot {
  const next = withComputedOfflineState(snapshot);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function simulateLatency(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function buildSession(email: string): HubSession {
  const localPart = email.split("@")[0] ?? "producer";
  const displayName = localPart
    .split(/[._-]/g)
    .filter(Boolean)
    .map((token) => token[0].toUpperCase() + token.slice(1))
    .join(" ");

  return {
    userId: `usr_${Math.random().toString(36).slice(2, 10)}`,
    email,
    displayName: displayName || "Antiphon User",
    signedInAt: nowIso()
  };
}

export const mockHubService = {
  async load(): Promise<HubSnapshot> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createBaseSnapshot();
    }

    try {
      const parsed = JSON.parse(raw) as HubSnapshot;
      return withComputedOfflineState(parsed);
    } catch {
      return createBaseSnapshot();
    }
  },

  async signIn(email: string): Promise<HubSnapshot> {
    await simulateLatency(280);
    const current = await this.load();
    return persist({
      ...current,
      session: buildSession(email),
      offlineCache: {
        ...current.offlineCache,
        lastValidatedAt: nowIso(),
        maxOfflineDays: OFFLINE_MAX_DAYS,
        offlineDaysRemaining: OFFLINE_MAX_DAYS,
        cacheState: "valid"
      }
    });
  },

  async signOut(): Promise<HubSnapshot> {
    await simulateLatency(120);
    const current = await this.load();
    return persist({
      ...current,
      session: null,
      offlineCache: {
        ...current.offlineCache,
        cacheState: current.offlineCache.lastValidatedAt ? "valid" : "empty"
      }
    });
  },

  async refreshEntitlements(): Promise<HubSnapshot> {
    await simulateLatency(180);
    const current = await this.load();
    return persist({
      ...current,
      offlineCache: {
        ...current.offlineCache,
        lastValidatedAt: nowIso(),
        maxOfflineDays: OFFLINE_MAX_DAYS,
        offlineDaysRemaining: OFFLINE_MAX_DAYS,
        cacheState: "valid"
      }
    });
  },

  async installApp(appId: string): Promise<HubSnapshot> {
    const current = await this.load();
    const installing = current.entitlements.map((app) =>
      app.id === appId ? { ...app, installState: "installing" as const } : app
    );
    persist({ ...current, entitlements: installing });

    await simulateLatency(620);

    const latest = await this.load();
    const installed = latest.entitlements.map((app) =>
      app.id === appId
        ? {
            ...app,
            installState: "installed" as const,
            installedVersion: app.version,
            updateAvailable: false
          }
        : app
    );

    return persist({ ...latest, entitlements: installed });
  },

  async applyUpdate(appId: string): Promise<HubSnapshot> {
    return this.installApp(appId);
  }
};
