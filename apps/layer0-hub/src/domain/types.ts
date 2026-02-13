export type InstallState = "not-installed" | "installing" | "installed" | "error";

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
  installState: InstallState;
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

export type HubConfig = {
  apiBaseUrl: string;
};

export type HubRuntimeStatus = {
  mode: "ready" | "configuration-error" | "runtime-error";
  message: string;
};

export type HubState = {
  snapshot: HubSnapshot;
  status: HubRuntimeStatus;
};
