import { type HubSnapshot } from "./types";

export const DEFAULT_HUB_SNAPSHOT: HubSnapshot = {
  session: null,
  entitlements: [],
  offlineCache: {
    lastValidatedAt: null,
    maxOfflineDays: 21,
    offlineDaysRemaining: 0,
    cacheState: "empty"
  }
};
