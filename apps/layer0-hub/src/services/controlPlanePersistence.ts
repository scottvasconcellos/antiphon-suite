import { type EntitlementDecision, type EntitlementDecisionInput } from "../domain/entitlementDecision";
import { type HubSnapshot, type OfflineCacheState, type InstallState } from "../domain/types";
import { normalizeAppCatalog, type AppCatalogEntry } from "./appCatalog";

export const CONTROL_PLANE_CACHE_SCHEMA = "antiphon.control-plane-cache";
export const CONTROL_PLANE_CACHE_VERSION = 1;

export type PersistedInstallState = {
  appId: string;
  installedVersion: string | null;
  installState: InstallState;
  updateAvailable: boolean;
};

export type PersistedEntitlementDecision = {
  input: EntitlementDecisionInput;
  outcome: EntitlementDecision;
  evaluatedAt: string;
};

export type PersistedControlPlaneState = {
  schema: typeof CONTROL_PLANE_CACHE_SCHEMA;
  version: typeof CONTROL_PLANE_CACHE_VERSION;
  offlineCache: OfflineCacheState;
  installState: PersistedInstallState[];
  appCatalog?: AppCatalogEntry[];
  entitlementDecision: PersistedEntitlementDecision | null;
};

function stableSortInstallState(state: PersistedInstallState[]): PersistedInstallState[] {
  return [...state].sort((a, b) => a.appId.localeCompare(b.appId));
}

export function toPersistedControlPlaneState(
  snapshot: HubSnapshot,
  entitlementDecision: PersistedEntitlementDecision | null,
  appCatalog: AppCatalogEntry[] = []
): PersistedControlPlaneState {
  return {
    schema: CONTROL_PLANE_CACHE_SCHEMA,
    version: CONTROL_PLANE_CACHE_VERSION,
    offlineCache: { ...snapshot.offlineCache },
    installState: stableSortInstallState(
      snapshot.entitlements.map((app) => ({
        appId: app.id,
        installedVersion: app.installedVersion,
        installState: app.installState,
        updateAvailable: app.updateAvailable
      }))
    ),
    ...(appCatalog.length > 0 ? { appCatalog: normalizeAppCatalog(appCatalog) } : {}),
    entitlementDecision
  };
}

export function serializePersistedControlPlaneState(state: PersistedControlPlaneState): string {
  const normalizedCatalog = state.appCatalog ? normalizeAppCatalog(state.appCatalog) : undefined;
  return JSON.stringify(
    {
      ...state,
      installState: stableSortInstallState(state.installState),
      ...(normalizedCatalog && normalizedCatalog.length > 0 ? { appCatalog: normalizedCatalog } : {})
    },
    null,
    2
  );
}

function isValidOfflineCacheState(value: unknown): value is OfflineCacheState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const state = candidate.cacheState;
  return (
    (candidate.lastValidatedAt === null || typeof candidate.lastValidatedAt === "string") &&
    typeof candidate.maxOfflineDays === "number" &&
    typeof candidate.offlineDaysRemaining === "number" &&
    (state === "empty" || state === "valid" || state === "stale")
  );
}

function isValidInstallState(value: unknown): value is PersistedInstallState[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return false;
    }
    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.appId === "string" &&
      (candidate.installedVersion === null || typeof candidate.installedVersion === "string") &&
      (candidate.installState === "not-installed" ||
        candidate.installState === "installing" ||
        candidate.installState === "installed" ||
        candidate.installState === "error") &&
      typeof candidate.updateAvailable === "boolean"
    );
  });
}

function isValidEntitlementDecision(value: unknown): value is PersistedEntitlementDecision | null {
  if (value === null) {
    return true;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (!candidate.input || !candidate.outcome || typeof candidate.evaluatedAt !== "string") {
    return false;
  }

  return true;
}

function isValidAppCatalog(value: unknown): value is AppCatalogEntry[] | undefined {
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
    const candidate = entry as Record<string, unknown>;
    return (
      typeof candidate.appId === "string" &&
      typeof candidate.version === "string" &&
      (candidate.channel === "stable" || candidate.channel === "beta") &&
      (candidate.installedVersion === null || typeof candidate.installedVersion === "string") &&
      typeof candidate.availableVersion === "string" &&
      Array.isArray(candidate.requiredEntitlements) &&
      candidate.requiredEntitlements.every((flag) => typeof flag === "string")
    );
  });
}

export function parsePersistedControlPlaneState(raw: string): PersistedControlPlaneState | null {
  return parsePersistedControlPlaneStateWithReport(raw).state;
}

export type PersistenceParseReport = {
  state: PersistedControlPlaneState | null;
  reasonCode:
    | "ok_cache_loaded"
    | "invalid_json"
    | "invalid_root_shape"
    | "unsupported_schema_or_version"
    | "invalid_offline_cache"
    | "invalid_install_state"
    | "invalid_entitlement_decision"
    | "stale_timestamp";
  remediation:
    | "none"
    | "rebuild_cache"
    | "upgrade_or_downgrade_cache_version"
    | "refresh_online_session";
};

export const PERSISTENCE_REASON_CODES = [
  "ok_cache_loaded",
  "invalid_json",
  "invalid_root_shape",
  "unsupported_schema_or_version",
  "invalid_offline_cache",
  "invalid_install_state",
  "invalid_entitlement_decision",
  "stale_timestamp"
] as const;

export function parsePersistedControlPlaneStateWithReport(
  raw: string,
  options?: { nowIso?: string; maxSkewSeconds?: number }
): PersistenceParseReport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { state: null, reasonCode: "invalid_json", remediation: "rebuild_cache" };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { state: null, reasonCode: "invalid_root_shape", remediation: "rebuild_cache" };
  }

  const candidate = parsed as Record<string, unknown>;
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

  if (
    options?.nowIso &&
    typeof candidate.offlineCache === "object" &&
    candidate.offlineCache &&
    "lastValidatedAt" in candidate.offlineCache
  ) {
    const lastValidatedAt = (candidate.offlineCache as OfflineCacheState).lastValidatedAt;
    if (typeof lastValidatedAt === "string") {
      const now = Math.floor(new Date(options.nowIso).getTime() / 1000);
      const ts = Math.floor(new Date(lastValidatedAt).getTime() / 1000);
      const skew = Math.abs(now - ts);
      const maxSkew = options.maxSkewSeconds ?? 60 * 60 * 24 * 365;
      if (Number.isFinite(skew) && skew > maxSkew) {
        return { state: null, reasonCode: "stale_timestamp", remediation: "refresh_online_session" };
      }
    }
  }

  const state: PersistedControlPlaneState = {
    schema: CONTROL_PLANE_CACHE_SCHEMA,
    version: CONTROL_PLANE_CACHE_VERSION,
    offlineCache: candidate.offlineCache,
    installState: stableSortInstallState(candidate.installState),
    ...(candidate.appCatalog ? { appCatalog: normalizeAppCatalog(candidate.appCatalog) } : {}),
    entitlementDecision: candidate.entitlementDecision
  };
  return {
    state,
    reasonCode: "ok_cache_loaded",
    remediation: "none"
  };
}

export type AtomicPersistSimulation = {
  current: string | null;
  next: string;
  temp: string | null;
};

export type AtomicPersistMode =
  | "success"
  | "power_loss_before_rename"
  | "concurrent_write_detected"
  | "corrupted_temp_file";

export type AtomicPersistReport = {
  stored: string | null;
  temp: string | null;
  reasonCode:
    | "ok_atomic_write"
    | "atomic_write_power_loss"
    | "atomic_write_conflict"
    | "atomic_write_corrupt_temp";
  remediation: "none" | "retry_atomic_write" | "rebuild_cache";
};

export function simulateAtomicPersist(state: AtomicPersistSimulation, mode: AtomicPersistMode): AtomicPersistReport {
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
