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

  // If bootstrap failed with "Authentication required" (401), that's expected before sign-in
  // The Authority is reachable, user just needs to sign in
  if (errorMessage.includes("Authentication required") || errorMessage.includes("401")) {
    return {
      snapshot,
      status: {
        mode: "ready",
        message: "Ready. Sign in to view entitlements.",
        code: "ok_bootstrap_requires_auth"
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
