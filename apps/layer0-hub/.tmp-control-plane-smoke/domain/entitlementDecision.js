export function decideEntitlement(input) {
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
