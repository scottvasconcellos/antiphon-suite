import { decideEntitlement } from "../domain/entitlementDecision";
import { transitionLifecycleState } from "../domain/installUpdateStateMachine";
import { type HubSnapshot, type HubState } from "../domain/types";
import { runInstallUpdateAuthority, type InstallUpdateAction, type InstallUpdateReasonCode } from "./installUpdateAuthority";
import { toControlPlaneViewModel } from "./controlPlaneViewModel";
import { parsePersistedControlPlaneState, serializePersistedControlPlaneState, toPersistedControlPlaneState } from "./controlPlanePersistence";

export type HappyPathScenarioResult = {
  entitlement: ReturnType<typeof decideEntitlement>;
  installReasonCode: string;
  updateReasonCode: string;
  projection: ReturnType<typeof toControlPlaneViewModel>;
};

export async function runHappyPathScenario(seed: HubSnapshot): Promise<HappyPathScenarioResult> {
  const target = seed.entitlements[0];
  if (!target) {
    throw new Error("happy_path_missing_app");
  }
  const entitlement = decideEntitlement({
    identity: { authenticated: seed.session !== null },
    license: { owned: seed.entitlements.some((app) => app.owned), revoked: false },
    offlineCache: {
      cacheState: seed.offlineCache.cacheState,
      offlineDaysRemaining: seed.offlineCache.offlineDaysRemaining
    }
  });

  const install = await runInstallUpdateAuthority(seed, "install", target.id, async (_action, _appId) => ({
    ok: true,
    app: {
      ...target,
      installedVersion: target.version,
      installState: "installed",
      updateAvailable: true
    }
  }));

  const update = await runInstallUpdateAuthority(install.snapshot, "update", target.id, async (_action, _appId) => ({
    ok: true,
    app: {
      ...install.snapshot.entitlements[0],
      installedVersion: install.snapshot.entitlements[0].version,
      installState: "installed",
      updateAvailable: false
    }
  }));

  const finalState: HubState = {
    snapshot: update.snapshot,
    status: {
      mode: "ready",
      message: "Update transaction completed.",
      code: update.result.reasonCode
    }
  };

  return {
    entitlement,
    installReasonCode: install.result.reasonCode,
    updateReasonCode: update.result.reasonCode,
    projection: toControlPlaneViewModel(finalState)
  };
}

export async function runFailureScenario(
  seed: HubSnapshot,
  action: InstallUpdateAction,
  reasonCode: InstallUpdateReasonCode
): Promise<{ reasonCode: string; lifecycleTo: string; recoveryTo: string }> {
  const target = seed.entitlements[0];
  if (!target) {
    throw new Error("failure_path_missing_app");
  }
  const failed = await runInstallUpdateAuthority(seed, action, target.id, async () => ({
    ok: false,
    reasonCode: reasonCode as "failed_download_step" | "failed_install_step" | "failed_update_step" | "failed_gateway"
  }));

  const recovery = transitionLifecycleState(
    failed.result.lifecycle.to,
    "AcknowledgeFailure"
  );

  return {
    reasonCode: failed.result.reasonCode,
    lifecycleTo: failed.result.lifecycle.to,
    recoveryTo: recovery.to
  };
}

export function runAntiGatingScenario(seed: HubSnapshot): {
  onlineOutcome: string;
  offlineOutcome: string;
  durableTrustArtifact: boolean;
  offlineRunnableWithoutHub: boolean;
} {
  const online = decideEntitlement({
    identity: { authenticated: seed.session !== null },
    license: { owned: seed.entitlements.some((app) => app.owned), revoked: false },
    offlineCache: {
      cacheState: seed.offlineCache.cacheState,
      offlineDaysRemaining: seed.offlineCache.offlineDaysRemaining
    }
  });

  const persisted = toPersistedControlPlaneState(seed, {
    input: {
      identity: { authenticated: seed.session !== null },
      license: { owned: seed.entitlements.some((app) => app.owned), revoked: false },
      offlineCache: {
        cacheState: seed.offlineCache.cacheState,
        offlineDaysRemaining: seed.offlineCache.offlineDaysRemaining
      }
    },
    outcome: online,
    evaluatedAt: seed.offlineCache.lastValidatedAt ?? "2026-02-13T00:00:00.000Z"
  });
  const durableTrustArtifact = parsePersistedControlPlaneState(serializePersistedControlPlaneState(persisted)) !== null;

  const offlineSnapshot: HubSnapshot = {
    ...seed,
    session: null
  };
  const offlineProjection = toControlPlaneViewModel({
    snapshot: offlineSnapshot,
    status: {
      mode: "ready",
      message: "offline mode",
      code: "ok_bootstrap_offline_cache"
    }
  });

  return {
    onlineOutcome: online.outcome,
    offlineOutcome: offlineProjection.entitlement.outcome,
    durableTrustArtifact,
    offlineRunnableWithoutHub: offlineProjection.launchReadiness.some((entry) => entry.ready)
  };
}
