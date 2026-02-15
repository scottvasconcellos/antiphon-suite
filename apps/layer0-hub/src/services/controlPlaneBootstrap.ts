import { type HubSnapshot, type HubState } from "../domain/types";

export function resolveBootstrapFailure(snapshot: HubSnapshot, errorMessage: string): HubState {
  const canUseOfflineCache =
    snapshot.offlineCache.cacheState === "valid" && snapshot.offlineCache.offlineDaysRemaining > 0;

  if (canUseOfflineCache) {
    return {
      snapshot,
      status: {
        mode: "ready",
        message: "Authority unreachable. Running from offline cache.",
        code: "ok_bootstrap_offline_cache"
      }
    };
  }

  return {
    snapshot,
    status: {
      mode: "runtime-error",
      message: errorMessage,
      code: "runtime_bootstrap_failed"
    }
  };
}
