import { decideEntitlement } from "../domain/entitlementDecision";
import { issueLaunchToken, verifyLaunchToken } from "../domain/launchTokenBoundary";
import { type HubSnapshot, type HubState } from "../domain/types";
import { parsePersistedControlPlaneState, toPersistedControlPlaneState } from "./controlPlanePersistence";
import { toLaunchReadinessMatrix, type LaunchReadinessEntry } from "./launchReadinessMatrix";
import { toTrustEnvelopeView, type TrustEnvelopeView } from "./controlPlaneTrustEnvelope";

const TOKEN_SECRET = "antiphon.layer1.launch";
const TOKEN_LIFETIME_SECONDS = 3600;

export type ControlPlaneViewModel = {
  entitlement: {
    outcome: "Authorized" | "Unauthorized" | "OfflineAuthorized" | "OfflineDenied";
    reason: string;
  };
  installUpdate: {
    state: "ready" | "blocked";
    reasonCode: string;
  };
  launchToken: {
    ready: boolean;
    status: "issued_verified" | "not_issued";
    reason: string;
  };
  persistedCache: {
    schema: string;
    version: number;
    restorable: boolean;
  };
  launchReadiness: LaunchReadinessEntry[];
  trustEnvelope: TrustEnvelopeView[];
};

function toDeterministicEpoch(snapshot: HubSnapshot): number {
  const source = snapshot.offlineCache.lastValidatedAt ?? snapshot.session?.signedInAt ?? "2026-02-13T00:00:00.000Z";
  return Math.floor(new Date(source).getTime() / 1000);
}

function toInstallUpdateProjection(status: HubState["status"]): ControlPlaneViewModel["installUpdate"] {
  return {
    state: status.mode === "runtime-error" ? "blocked" : "ready",
    reasonCode: status.code
  };
}

function toLaunchTokenProjection(snapshot: HubSnapshot, entitlement: ControlPlaneViewModel["entitlement"]): ControlPlaneViewModel["launchToken"] {
  if (!(entitlement.outcome === "Authorized" || entitlement.outcome === "OfflineAuthorized")) {
    return {
      ready: false,
      status: "not_issued",
      reason: entitlement.reason
    };
  }

  const issuedAt = toDeterministicEpoch(snapshot);
  const claims = {
    appId: "antiphon.hub",
    userId: snapshot.session?.userId ?? "offline-user",
    entitlementOutcome: entitlement.outcome,
    issuedAt,
    expiresAt: issuedAt + TOKEN_LIFETIME_SECONDS
  } as const;
  const token = issueLaunchToken(claims, TOKEN_SECRET);
  const verification = verifyLaunchToken(token, TOKEN_SECRET, issuedAt);
  return {
    ready: verification.valid,
    status: verification.valid ? "issued_verified" : "not_issued",
    reason: verification.reason
  };
}

export function toControlPlaneViewModel(hubState: HubState): ControlPlaneViewModel {
  const snapshot = hubState.snapshot;
  const owned = snapshot.entitlements.filter((app) => app.owned).length > 0;
  const entitlement = decideEntitlement({
    identity: { authenticated: snapshot.session !== null },
    license: { owned, revoked: false },
    offlineCache: {
      cacheState: snapshot.offlineCache.cacheState,
      offlineDaysRemaining: snapshot.offlineCache.offlineDaysRemaining
    }
  });

  const persistedState = toPersistedControlPlaneState(snapshot, {
    input: {
      identity: { authenticated: snapshot.session !== null },
      license: { owned, revoked: false },
      offlineCache: {
        cacheState: snapshot.offlineCache.cacheState,
        offlineDaysRemaining: snapshot.offlineCache.offlineDaysRemaining
      }
    },
    outcome: entitlement,
    evaluatedAt: snapshot.offlineCache.lastValidatedAt ?? "2026-02-13T00:00:00.000Z"
  });
  const restorable = parsePersistedControlPlaneState(JSON.stringify(persistedState)) !== null;

  return {
    entitlement: {
      outcome: entitlement.outcome,
      reason: entitlement.reason
    },
    installUpdate: toInstallUpdateProjection(hubState.status),
    launchToken: toLaunchTokenProjection(snapshot, {
      outcome: entitlement.outcome,
      reason: entitlement.reason
    }),
    persistedCache: {
      schema: persistedState.schema,
      version: persistedState.version,
      restorable
    },
    launchReadiness: toLaunchReadinessMatrix(snapshot),
    trustEnvelope: toTrustEnvelopeView()
  };
}
