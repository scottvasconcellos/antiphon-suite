import { decideEntitlement } from "../domain/entitlementDecision";
import { issueLaunchToken, verifyLaunchToken } from "../domain/launchTokenBoundary";
import { parsePersistedControlPlaneState, toPersistedControlPlaneState } from "./controlPlanePersistence";
import { toLaunchReadinessMatrix } from "./launchReadinessMatrix";
import { toTrustEnvelopeView } from "./controlPlaneTrustEnvelope";
import { toEpochSeconds } from "./timeControl";
const TOKEN_SECRET = "antiphon.layer1.launch";
const TOKEN_LIFETIME_SECONDS = 3600;
function toInstallUpdateProjection(status) {
    return {
        state: status.mode === "runtime-error" ? "blocked" : "ready",
        reasonCode: status.code
    };
}
function toLaunchTokenProjection(snapshot, entitlement) {
    if (!(entitlement.outcome === "Authorized" || entitlement.outcome === "OfflineAuthorized")) {
        return {
            ready: false,
            status: "not_issued",
            reason: entitlement.reason
        };
    }
    const issuedAt = toEpochSeconds(new Date().toISOString());
    const claims = {
        appId: "antiphon.hub",
        userId: snapshot.session?.userId ?? "offline-user",
        entitlementOutcome: entitlement.outcome,
        issuedAt,
        expiresAt: issuedAt + TOKEN_LIFETIME_SECONDS
    };
    const token = issueLaunchToken(claims, TOKEN_SECRET);
    const verification = verifyLaunchToken(token, TOKEN_SECRET, issuedAt);
    return {
        ready: verification.valid,
        status: verification.valid ? "issued_verified" : "not_issued",
        reason: verification.reason
    };
}
export function toControlPlaneViewModel(hubState) {
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
