export type HubSession = {
  userId: string;
  email: string;
  displayName: string;
  signedInAt: string;
};

export type EntitledApp = {
  id: string;
  name: string;
  version: string;
  installedVersion: string | null;
  owned: boolean;
  installState: "not-installed" | "installing" | "installed" | "error";
  updateAvailable: boolean;
};

export type OfflineCacheState = {
  lastValidatedAt: string | null;
  maxOfflineDays: number;
  offlineDaysRemaining: number;
  cacheState: "empty" | "valid" | "stale";
};

export type HubSnapshot = {
  session: HubSession | null;
  entitlements: EntitledApp[];
  offlineCache: OfflineCacheState;
};
