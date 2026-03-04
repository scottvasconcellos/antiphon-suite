import { normalizeAppCatalog } from "./appCatalog.js";
import { PERSISTED_CACHE_MAX_SKEW_SECONDS, toEpochSeconds } from "./timeControl.js";
export const CONTROL_PLANE_CACHE_SCHEMA = "antiphon.control-plane-cache";
export const CONTROL_PLANE_CACHE_VERSION = 1;
function stableSortInstallState(state) {
    return [...state].sort((a, b) => a.appId.localeCompare(b.appId));
}
export function toPersistedControlPlaneState(snapshot, entitlementDecision, appCatalog = [], rollbackMetadata = []) {
    return {
        schema: CONTROL_PLANE_CACHE_SCHEMA,
        version: CONTROL_PLANE_CACHE_VERSION,
        offlineCache: { ...snapshot.offlineCache },
        installState: stableSortInstallState(snapshot.entitlements.map((app) => ({
            appId: app.id,
            installedVersion: app.installedVersion,
            installState: app.installState,
            updateAvailable: app.updateAvailable
        }))),
        ...(appCatalog.length > 0 ? { appCatalog: normalizeAppCatalog(appCatalog) } : {}),
        ...(rollbackMetadata.length > 0
            ? {
                rollbackMetadata: [...rollbackMetadata].sort((a, b) => a.appId.localeCompare(b.appId))
            }
            : {}),
        entitlementDecision
    };
}
export function serializePersistedControlPlaneState(state) {
    const normalizedCatalog = state.appCatalog ? normalizeAppCatalog(state.appCatalog) : undefined;
    return JSON.stringify({
        ...state,
        installState: stableSortInstallState(state.installState),
        ...(normalizedCatalog && normalizedCatalog.length > 0 ? { appCatalog: normalizedCatalog } : {})
    }, null, 2);
}
function isValidOfflineCacheState(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }
    const candidate = value;
    const state = candidate.cacheState;
    return ((candidate.lastValidatedAt === null || typeof candidate.lastValidatedAt === "string") &&
        typeof candidate.maxOfflineDays === "number" &&
        typeof candidate.offlineDaysRemaining === "number" &&
        (state === "empty" || state === "valid" || state === "stale"));
}
function isValidInstallState(value) {
    if (!Array.isArray(value)) {
        return false;
    }
    return value.every((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            return false;
        }
        const candidate = item;
        return (typeof candidate.appId === "string" &&
            (candidate.installedVersion === null || typeof candidate.installedVersion === "string") &&
            (candidate.installState === "not-installed" ||
                candidate.installState === "installing" ||
                candidate.installState === "installed" ||
                candidate.installState === "error") &&
            typeof candidate.updateAvailable === "boolean");
    });
}
function isValidEntitlementDecision(value) {
    if (value === null) {
        return true;
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }
    const candidate = value;
    if (!candidate.input || !candidate.outcome || typeof candidate.evaluatedAt !== "string") {
        return false;
    }
    return true;
}
function isValidAppCatalog(value) {
    if (value === undefined) {
        return true;
    }
    if (!Array.isArray(value)) {
        return false;
    }
    return value.every((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            return false;
        }
        const candidate = entry;
        return (typeof candidate.appId === "string" &&
            typeof candidate.version === "string" &&
            (candidate.channel === "stable" || candidate.channel === "beta") &&
            (candidate.installedVersion === null || typeof candidate.installedVersion === "string") &&
            typeof candidate.availableVersion === "string" &&
            Array.isArray(candidate.requiredEntitlements) &&
            candidate.requiredEntitlements.every((flag) => typeof flag === "string"));
    });
}
function isValidRollbackMetadata(value) {
    if (value === undefined) {
        return true;
    }
    if (!Array.isArray(value)) {
        return false;
    }
    return value.every((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            return false;
        }
        const candidate = entry;
        return (typeof candidate.appId === "string" &&
            typeof candidate.previousTargetHash === "string" &&
            typeof candidate.manifestVersion === "string" &&
            typeof candidate.rollbackPrepared === "boolean");
    });
}
export function parsePersistedControlPlaneState(raw) {
    return parsePersistedControlPlaneStateWithReport(raw).state;
}
export const PERSISTENCE_REASON_CODES = [
    "ok_cache_loaded",
    "invalid_json",
    "invalid_root_shape",
    "unsupported_schema_or_version",
    "invalid_offline_cache",
    "invalid_install_state",
    "invalid_entitlement_decision",
    "stale_timestamp"
];
export function parsePersistedControlPlaneStateWithReport(raw, options) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        return { state: null, reasonCode: "invalid_json", remediation: "rebuild_cache" };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { state: null, reasonCode: "invalid_root_shape", remediation: "rebuild_cache" };
    }
    const candidate = parsed;
    if (candidate.schema !== CONTROL_PLANE_CACHE_SCHEMA || candidate.version !== CONTROL_PLANE_CACHE_VERSION) {
        return { state: null, reasonCode: "unsupported_schema_or_version", remediation: "upgrade_or_downgrade_cache_version" };
    }
    if (!isValidOfflineCacheState(candidate.offlineCache)) {
        return { state: null, reasonCode: "invalid_offline_cache", remediation: "rebuild_cache" };
    }
    if (!isValidInstallState(candidate.installState)) {
        return { state: null, reasonCode: "invalid_install_state", remediation: "rebuild_cache" };
    }
    if (!isValidEntitlementDecision(candidate.entitlementDecision)) {
        return { state: null, reasonCode: "invalid_entitlement_decision", remediation: "rebuild_cache" };
    }
    if (!isValidAppCatalog(candidate.appCatalog)) {
        return { state: null, reasonCode: "invalid_root_shape", remediation: "rebuild_cache" };
    }
    if (!isValidRollbackMetadata(candidate.rollbackMetadata)) {
        return { state: null, reasonCode: "invalid_root_shape", remediation: "rebuild_cache" };
    }
    if (options?.nowIso &&
        typeof candidate.offlineCache === "object" &&
        candidate.offlineCache &&
        "lastValidatedAt" in candidate.offlineCache) {
        const lastValidatedAt = candidate.offlineCache.lastValidatedAt;
        if (typeof lastValidatedAt === "string") {
            const now = toEpochSeconds(options.nowIso);
            const ts = toEpochSeconds(lastValidatedAt);
            const skew = Math.abs(now - ts);
            const maxSkew = options.maxSkewSeconds ?? PERSISTED_CACHE_MAX_SKEW_SECONDS;
            if (Number.isFinite(skew) && skew > maxSkew) {
                return { state: null, reasonCode: "stale_timestamp", remediation: "refresh_online_session" };
            }
        }
    }
    const state = {
        schema: CONTROL_PLANE_CACHE_SCHEMA,
        version: CONTROL_PLANE_CACHE_VERSION,
        offlineCache: candidate.offlineCache,
        installState: stableSortInstallState(candidate.installState),
        ...(candidate.appCatalog ? { appCatalog: normalizeAppCatalog(candidate.appCatalog) } : {}),
        ...(candidate.rollbackMetadata
            ? {
                rollbackMetadata: [...candidate.rollbackMetadata].sort((a, b) => a.appId.localeCompare(b.appId))
            }
            : {}),
        entitlementDecision: candidate.entitlementDecision
    };
    return {
        state,
        reasonCode: "ok_cache_loaded",
        remediation: "none"
    };
}
export function simulateAtomicPersist(state, mode) {
    if (mode === "success") {
        return {
            stored: state.next,
            temp: null,
            reasonCode: "ok_atomic_write",
            remediation: "none"
        };
    }
    if (mode === "power_loss_before_rename") {
        return {
            stored: state.current,
            temp: state.next,
            reasonCode: "atomic_write_power_loss",
            remediation: "retry_atomic_write"
        };
    }
    if (mode === "concurrent_write_detected") {
        return {
            stored: state.current,
            temp: state.temp,
            reasonCode: "atomic_write_conflict",
            remediation: "retry_atomic_write"
        };
    }
    return {
        stored: state.current,
        temp: "{corrupt",
        reasonCode: "atomic_write_corrupt_temp",
        remediation: "rebuild_cache"
    };
}
