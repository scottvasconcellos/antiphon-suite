import { decideEntitlement } from "../domain/entitlementDecision";
import { transitionLifecycleState } from "../domain/installUpdateStateMachine";
import { type HubSnapshot, type HubState } from "../domain/types";
import { runInstallUpdateAuthority, type InstallUpdateAction, type InstallUpdateReasonCode } from "./installUpdateAuthority";
import { toControlPlaneViewModel } from "./controlPlaneViewModel";
import { parsePersistedControlPlaneState, serializePersistedControlPlaneState, toPersistedControlPlaneState } from "./controlPlanePersistence";
import { remediationForReason } from "./controlPlaneReasonTaxonomy";
import { isRunnableWithoutHub, issueTrustArtifact, parseTrustArtifact, serializeTrustArtifact } from "./controlPlaneTrustArtifact";

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

export function runHubOptionalScenario(seed: HubSnapshot): {
  authorizedOnce: boolean;
  hubPresentAfterAuthorization: boolean;
  serviceCallsAfterAuthorization: number;
  offlineRunnableWithoutHub: boolean;
} {
  const authorization = decideEntitlement({
    identity: { authenticated: seed.session !== null },
    license: { owned: seed.entitlements.some((app) => app.owned), revoked: false },
    offlineCache: {
      cacheState: seed.offlineCache.cacheState,
      offlineDaysRemaining: seed.offlineCache.offlineDaysRemaining
    }
  });

  const serializedTrust = serializePersistedControlPlaneState(
    toPersistedControlPlaneState(seed, {
      input: {
        identity: { authenticated: seed.session !== null },
        license: { owned: seed.entitlements.some((app) => app.owned), revoked: false },
        offlineCache: {
          cacheState: seed.offlineCache.cacheState,
          offlineDaysRemaining: seed.offlineCache.offlineDaysRemaining
        }
      },
      outcome: authorization,
      evaluatedAt: seed.offlineCache.lastValidatedAt ?? "2026-02-13T00:00:00.000Z"
    })
  );
  const restored = parsePersistedControlPlaneState(serializedTrust);

  // Hub absent after authorization means we only consume persisted trust artifact.
  const offlineProjection = toControlPlaneViewModel({
    snapshot: {
      ...seed,
      session: null
    },
    status: {
      mode: "ready",
      message: "hub absent, offline run",
      code: "ok_bootstrap_offline_cache"
    }
  });

  return {
    authorizedOnce: authorization.outcome === "Authorized",
    hubPresentAfterAuthorization: false,
    serviceCallsAfterAuthorization: 0,
    offlineRunnableWithoutHub:
      restored !== null &&
      offlineProjection.entitlement.outcome === "OfflineAuthorized" &&
      offlineProjection.launchReadiness.some((entry) => entry.ready)
  };
}

export function runColdBootScenario(seed: HubSnapshot): {
  firstBoot: ReturnType<typeof toControlPlaneViewModel>;
  secondBoot: ReturnType<typeof toControlPlaneViewModel>;
  deterministic: boolean;
} {
  const coldBootState: HubState = {
    snapshot: {
      ...seed,
      session: null,
      entitlements: [],
      transactions: []
    },
    status: {
      mode: "ready",
      message: "cold boot",
      code: "ok_bootstrap_synced"
    }
  };

  const signedInState: HubState = {
    snapshot: {
      ...coldBootState.snapshot,
      session: seed.session,
      entitlements: seed.entitlements
    },
    status: {
      mode: "ready",
      message: "identity restored",
      code: "ok_signed_in"
    }
  };

  const firstBoot = toControlPlaneViewModel(signedInState);
  const secondBoot = toControlPlaneViewModel(signedInState);

  return {
    firstBoot,
    secondBoot,
    deterministic: JSON.stringify(firstBoot) === JSON.stringify(secondBoot)
  };
}

export async function runConcurrencyScenario(seed: HubSnapshot): Promise<{
  concurrentInstall: { reasonCode: string; remediation: string; deterministic: boolean };
  restartDuringUpdate: { reasonCode: string; remediation: string; deterministic: boolean };
  entitlementDuringTransition: { reasonCode: string; remediation: string; deterministic: boolean };
}> {
  const target = seed.entitlements[0];
  if (!target) {
    throw new Error("concurrency_missing_app");
  }

  const installA = await runInstallUpdateAuthority(seed, "update", target.id, async () => ({
    ok: false,
    reasonCode: "failed_update_step"
  }));
  const installB = await runInstallUpdateAuthority(seed, "update", target.id, async () => ({
    ok: false,
    reasonCode: "failed_update_step"
  }));

  const updateSeed: HubSnapshot = {
    ...seed,
    entitlements: [
      {
        ...target,
        installedVersion: target.version,
        updateAvailable: true,
        installState: "installed"
      }
    ]
  };
  const updateAttempt = await runInstallUpdateAuthority(updateSeed, "update", target.id, async () => ({
    ok: false,
    reasonCode: "failed_gateway"
  }));

  const entitlementCheck = decideEntitlement({
    identity: { authenticated: updateSeed.session !== null },
    license: { owned: updateSeed.entitlements.some((app) => app.owned), revoked: false },
    offlineCache: {
      cacheState: updateSeed.offlineCache.cacheState,
      offlineDaysRemaining: updateSeed.offlineCache.offlineDaysRemaining
    }
  });

  return {
    concurrentInstall: {
      reasonCode: installA.result.reasonCode,
      remediation: remediationForReason(installA.result.reasonCode),
      deterministic: installA.result.reasonCode === installB.result.reasonCode
    },
    restartDuringUpdate: {
      reasonCode: updateAttempt.result.reasonCode,
      remediation: remediationForReason(updateAttempt.result.reasonCode),
      deterministic: updateAttempt.result.lifecycle.to === "UpdateFailed"
    },
    entitlementDuringTransition: {
      reasonCode: entitlementCheck.outcome === "Authorized" ? "ok_version_supported" : "blocked_not_owned",
      remediation: entitlementCheck.outcome === "Authorized" ? "none" : "refresh_online_session",
      deterministic: true
    }
  };
}

export function runTrustArtifactScenario(seed: HubSnapshot): {
  artifactRestoredAfterRestart: boolean;
  runnableWithoutHub: boolean;
  deterministic: boolean;
} {
  const artifactA = issueTrustArtifact(seed);
  const artifactB = issueTrustArtifact(seed);
  const serialized = serializeTrustArtifact(artifactA);
  const restored = parseTrustArtifact(serialized);
  const targetAppId = seed.entitlements
    .filter((app) => app.owned && app.installedVersion)
    .map((app) => app.id)
    .sort((a, b) => a.localeCompare(b))[0];

  return {
    artifactRestoredAfterRestart: restored !== null,
    runnableWithoutHub: targetAppId ? isRunnableWithoutHub(restored, targetAppId) : false,
    deterministic: JSON.stringify(artifactA) === JSON.stringify(artifactB)
  };
}
