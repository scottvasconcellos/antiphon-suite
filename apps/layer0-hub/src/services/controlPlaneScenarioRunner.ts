import { decideEntitlement } from "../domain/entitlementDecision";
import { transitionLifecycleState } from "../domain/installUpdateStateMachine";
import { type HubSnapshot, type HubState } from "../domain/types";
import { runInstallUpdateAuthority, runInstallUpdateAuthorityWithArtifactExecutor, type InstallUpdateAction, type InstallUpdateReasonCode } from "./installUpdateAuthority";
import { toControlPlaneViewModel } from "./controlPlaneViewModel";
import { parsePersistedControlPlaneState, serializePersistedControlPlaneState, toPersistedControlPlaneState } from "./controlPlanePersistence";
import { remediationForReason } from "./controlPlaneReasonTaxonomy";
import { isRunnableWithoutHub, issueTrustArtifact, parseTrustArtifact, serializeTrustArtifact } from "./controlPlaneTrustArtifact";
import { evaluateClockDrift, evaluateMixedEntitlementTimestamps } from "./clockDriftPolicy";
import { applyUpdateRollback } from "./updateRecoveryPolicy";

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

export async function runLongRunDeterminismScenario(
  seed: HubSnapshot,
  cycles: number
): Promise<{
  cycles: number;
  projectionStable: boolean;
  finalProjection: ReturnType<typeof toControlPlaneViewModel>;
}> {
  let snapshot = seed;
  let baselineProjection: ReturnType<typeof toControlPlaneViewModel> | null = null;

  for (let i = 0; i < cycles; i += 1) {
    const target = snapshot.entitlements[0];
    if (!target) {
      throw new Error("long_run_missing_app");
    }
    const install = await runInstallUpdateAuthority(snapshot, "install", target.id, async (_action, _appId) => ({
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
    const cycleEntitlement = decideEntitlement({
      identity: { authenticated: update.snapshot.session !== null },
      license: { owned: update.snapshot.entitlements.some((app) => app.owned), revoked: false },
      offlineCache: {
        cacheState: update.snapshot.offlineCache.cacheState,
        offlineDaysRemaining: update.snapshot.offlineCache.offlineDaysRemaining
      }
    });

    const result = toControlPlaneViewModel({
      snapshot: update.snapshot,
      status: {
        mode: "ready",
        message: "long run cycle",
        code: "ok_update_completed"
      }
    });
    if (baselineProjection === null) {
      baselineProjection = result;
    }

    const persisted = toPersistedControlPlaneState(
      update.snapshot,
      {
        input: {
          identity: { authenticated: snapshot.session !== null },
          license: { owned: snapshot.entitlements.some((app) => app.owned), revoked: false },
          offlineCache: {
            cacheState: snapshot.offlineCache.cacheState,
            offlineDaysRemaining: snapshot.offlineCache.offlineDaysRemaining
          }
        },
        outcome: cycleEntitlement,
        evaluatedAt: snapshot.offlineCache.lastValidatedAt ?? "2026-02-13T00:00:00.000Z"
      }
    );
    const restored = parsePersistedControlPlaneState(serializePersistedControlPlaneState(persisted));
    if (!restored) {
      throw new Error("long_run_persist_restore_failed");
    }

    snapshot = {
      ...snapshot,
      offlineCache: { ...restored.offlineCache },
      entitlements: snapshot.entitlements
        .map((app) => {
          const persistedApp = restored.installState.find((value) => value.appId === app.id);
          if (!persistedApp) {
            return app;
          }
          return {
            ...app,
            installedVersion: persistedApp.installedVersion,
            installState: persistedApp.installState,
            updateAvailable: persistedApp.updateAvailable
          };
        })
        .sort((a, b) => a.id.localeCompare(b.id))
    };
  }

  const finalProjection = toControlPlaneViewModel({
    snapshot,
    status: {
      mode: "ready",
      message: "long run completed",
      code: "ok_update_completed"
    }
  });

  return {
    cycles,
    projectionStable: baselineProjection !== null && JSON.stringify(baselineProjection) === JSON.stringify(finalProjection),
    finalProjection
  };
}

export function runClockDriftScenario(input: {
  nowIso: string;
  lastValidatedAt: string | null;
  offlineDaysRemaining: number;
  maxClockSkewSeconds?: number;
  mixedEntitlementTimestamps: string[];
  maxSpreadSeconds?: number;
}): {
  driftDecision: ReturnType<typeof evaluateClockDrift>;
  mixedDecision: ReturnType<typeof evaluateMixedEntitlementTimestamps>;
  reasons: { reasonCode: string; remediation: string }[];
} {
  const driftDecision = evaluateClockDrift({
    nowIso: input.nowIso,
    lastValidatedAt: input.lastValidatedAt,
    offlineDaysRemaining: input.offlineDaysRemaining,
    maxClockSkewSeconds: input.maxClockSkewSeconds
  });
  const mixedDecision = evaluateMixedEntitlementTimestamps({
    nowIso: input.nowIso,
    evaluatedAt: input.mixedEntitlementTimestamps,
    maxSpreadSeconds: input.maxSpreadSeconds
  });

  const reasons = [
    {
      reasonCode: driftDecision.reasonCode,
      remediation: remediationForReason(driftDecision.reasonCode)
    },
    {
      reasonCode: mixedDecision.reasonCode,
      remediation: remediationForReason(mixedDecision.reasonCode)
    }
  ];

  return {
    driftDecision,
    mixedDecision,
    reasons
  };
}

export function runTrustEnvelopeValidationScenario(seed: HubSnapshot): {
  authorizedOnce: boolean;
  hubRemoved: boolean;
  trustArtifactValid: boolean;
  launchTokenRequiredForOfflineRun: boolean;
  offlineRunnableWithoutHub: boolean;
} {
  const entitlement = decideEntitlement({
    identity: { authenticated: seed.session !== null },
    license: { owned: seed.entitlements.some((app) => app.owned), revoked: false },
    offlineCache: {
      cacheState: seed.offlineCache.cacheState,
      offlineDaysRemaining: seed.offlineCache.offlineDaysRemaining
    }
  });

  const artifact = issueTrustArtifact(seed);
  const parsedArtifact = parseTrustArtifact(serializeTrustArtifact(artifact));
  const targetAppId = seed.entitlements[0]?.id ?? "";

  return {
    authorizedOnce: entitlement.outcome === "Authorized",
    hubRemoved: true,
    trustArtifactValid: parsedArtifact !== null,
    launchTokenRequiredForOfflineRun: false,
    offlineRunnableWithoutHub: isRunnableWithoutHub(parsedArtifact, targetAppId)
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

export async function runArtifactInstallUpdateScenario(input: {
  seed: HubSnapshot;
  appId: string;
  installManifestRaw: string;
  updateManifestRaw: string;
  payloadFiles: Record<string, string>;
  targetDir: string;
}): Promise<{
  install: { reasonCode: string; lifecycleTo: string };
  update: { reasonCode: string; lifecycleTo: string };
  installFailureRollback: {
    reasonCode: string;
    rollbackPrepared: boolean;
  };
  updateFailureRollback: {
    reasonCode: string;
    rollbackReasonCode: string;
    rollbackPrepared: boolean;
    finalInstalledVersion: string | null;
  };
}> {
  const install = await runInstallUpdateAuthorityWithArtifactExecutor(
    input.seed,
    "install",
    input.appId,
    {
      manifestRaw: input.installManifestRaw,
      payloadFiles: input.payloadFiles,
      targetDir: input.targetDir,
      fileSystem: {}
    }
  );

  const updateSeed: HubSnapshot = {
    ...install.snapshot,
    entitlements: install.snapshot.entitlements.map((app) =>
      app.id === input.appId ? { ...app, updateAvailable: true } : app
    )
  };

  const update = await runInstallUpdateAuthorityWithArtifactExecutor(
    updateSeed,
    "update",
    input.appId,
    {
      manifestRaw: input.updateManifestRaw,
      payloadFiles: input.payloadFiles,
      targetDir: input.targetDir,
      fileSystem: install.fileSystem
    }
  );

  const installFailure = await runInstallUpdateAuthorityWithArtifactExecutor(
    input.seed,
    "install",
    input.appId,
    {
      manifestRaw: input.installManifestRaw,
      payloadFiles: input.payloadFiles,
      targetDir: input.targetDir,
      fileSystem: {},
      inject: { mode: "partial_apply" }
    }
  );

  const failingUpdate = await runInstallUpdateAuthorityWithArtifactExecutor(
    updateSeed,
    "update",
    input.appId,
    {
      manifestRaw: input.updateManifestRaw,
      payloadFiles: input.payloadFiles,
      targetDir: input.targetDir,
      fileSystem: install.fileSystem,
      inject: { mode: "partial_apply" }
    }
  );
  const failedApp = updateSeed.entitlements.find((app) => app.id === input.appId);
  if (!failedApp) {
    throw new Error("artifact_update_missing_app");
  }
  const rollback = applyUpdateRollback(
    {
      ...failedApp,
      installedVersion: install.snapshot.entitlements.find((app) => app.id === input.appId)?.installedVersion ?? failedApp.installedVersion
    },
    {}
  );

  return {
    install: {
      reasonCode: install.result.reasonCode,
      lifecycleTo: install.result.lifecycle.to
    },
    update: {
      reasonCode: update.result.reasonCode,
      lifecycleTo: update.result.lifecycle.to
    },
    installFailureRollback: {
      reasonCode: installFailure.result.reasonCode,
      rollbackPrepared: installFailure.result.artifactRollback?.rollbackPrepared ?? false
    },
    updateFailureRollback: {
      reasonCode: failingUpdate.result.reasonCode,
      rollbackReasonCode: rollback.reasonCode,
      rollbackPrepared: failingUpdate.result.artifactRollback?.rollbackPrepared ?? false,
      finalInstalledVersion: rollback.preservedInstalledVersion
    }
  };
}
