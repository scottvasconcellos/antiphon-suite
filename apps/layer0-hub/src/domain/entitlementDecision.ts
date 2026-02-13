export type EntitlementIdentityInput = {
  authenticated: boolean;
};

export type EntitlementLicenseInput = {
  owned: boolean;
  revoked: boolean;
};

export type EntitlementOfflineCacheInput = {
  cacheState: "empty" | "valid" | "stale";
  offlineDaysRemaining: number;
};

export type EntitlementDecisionInput = {
  identity: EntitlementIdentityInput;
  license: EntitlementLicenseInput;
  offlineCache: EntitlementOfflineCacheInput;
};

export type EntitlementDecision =
  | { outcome: "Authorized"; reason: "owned_active_identity" }
  | { outcome: "Unauthorized"; reason: "identity_required" | "license_not_owned" | "license_revoked" }
  | { outcome: "OfflineAuthorized"; reason: "offline_cache_valid" }
  | { outcome: "OfflineDenied"; reason: "offline_cache_invalid" | "offline_cache_stale" };

export function decideEntitlement(input: EntitlementDecisionInput): EntitlementDecision {
  if (input.license.revoked) {
    return { outcome: "Unauthorized", reason: "license_revoked" };
  }

  if (input.identity.authenticated) {
    if (!input.license.owned) {
      return { outcome: "Unauthorized", reason: "license_not_owned" };
    }
    return { outcome: "Authorized", reason: "owned_active_identity" };
  }

  if (input.offlineCache.cacheState === "valid" && input.offlineCache.offlineDaysRemaining > 0) {
    return { outcome: "OfflineAuthorized", reason: "offline_cache_valid" };
  }

  if (input.offlineCache.cacheState === "stale") {
    return { outcome: "OfflineDenied", reason: "offline_cache_stale" };
  }

  return { outcome: "OfflineDenied", reason: "offline_cache_invalid" };
}
