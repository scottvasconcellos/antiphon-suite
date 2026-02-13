import { type EntitlementDecision, type EntitlementDecisionInput } from "../domain/entitlementDecision";
import { type HubSnapshot, type OfflineCacheState, type InstallState } from "../domain/types";

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
  entitlementDecision: PersistedEntitlementDecision | null;
};

function stableSortInstallState(state: PersistedInstallState[]): PersistedInstallState[] {
  return [...state].sort((a, b) => a.appId.localeCompare(b.appId));
}

export function toPersistedControlPlaneState(
  snapshot: HubSnapshot,
  entitlementDecision: PersistedEntitlementDecision | null
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
    entitlementDecision
  };
}

export function serializePersistedControlPlaneState(state: PersistedControlPlaneState): string {
  return JSON.stringify(
    {
      ...state,
      installState: stableSortInstallState(state.installState)
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

export function parsePersistedControlPlaneState(raw: string): PersistedControlPlaneState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;
  if (
    candidate.schema !== CONTROL_PLANE_CACHE_SCHEMA ||
    candidate.version !== CONTROL_PLANE_CACHE_VERSION ||
    !isValidOfflineCacheState(candidate.offlineCache) ||
    !isValidInstallState(candidate.installState) ||
    !isValidEntitlementDecision(candidate.entitlementDecision)
  ) {
    return null;
  }

  return {
    schema: CONTROL_PLANE_CACHE_SCHEMA,
    version: CONTROL_PLANE_CACHE_VERSION,
    offlineCache: candidate.offlineCache,
    installState: stableSortInstallState(candidate.installState),
    entitlementDecision: candidate.entitlementDecision
  };
}
