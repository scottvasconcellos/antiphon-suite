import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { readVersionStamp } from "./version-stamp.mjs";

const { contractVersion: OPERATOR_CONTRACT_VERSION } = readVersionStamp();

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nactual=${JSON.stringify(actual)}\nexpected=${JSON.stringify(expected)}`);
  }
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashOf(value) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function patchImport(filePath, from, to) {
  const fullPath = join(process.cwd(), filePath);
  let source = readFileSync(fullPath, "utf-8");
  source = source.replaceAll(from, to);
  writeFileSync(fullPath, source, "utf-8");
}

async function loadModules() {
  run("pnpm", ["--filter", "@antiphon/layer0-hub", "exec", "tsc", "-p", "tsconfig.control-plane-smoke.json"]);

  patchImport(
    "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneTrustArtifact.js",
    'from "../domain/types";',
    'from "../domain/types.js";'
  );
  patchImport(
    "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneTrustArtifact.js",
    'from "./timeControl";',
    'from "./timeControl.js";'
  );
  patchImport(
    "apps/layer0-hub/.tmp-control-plane-smoke/services/clockDriftPolicy.js",
    'from "./timeControl";',
    'from "./timeControl.js";'
  );
  patchImport(
    "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlanePersistence.js",
    'from "./timeControl";',
    'from "./timeControl.js";'
  );
  patchImport(
    "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlanePersistence.js",
    'from "./appCatalog";',
    'from "./appCatalog.js";'
  );
  patchImport(
    "apps/layer0-hub/.tmp-control-plane-smoke/services/artifactTrustVerification.js",
    'from "./artifactManifestContract";',
    'from "./artifactManifestContract.js";'
  );
  patchImport(
    "apps/layer0-hub/.tmp-control-plane-smoke/services/artifactTrustVerification.js",
    'from "./timeControl";',
    'from "./timeControl.js";'
  );

  const controlPlaneTrustArtifact = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneTrustArtifact.js")).href
  );
  const clockDriftPolicy = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/clockDriftPolicy.js")).href
  );
  const controlPlanePersistence = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlanePersistence.js")).href
  );

  return { controlPlaneTrustArtifact, clockDriftPolicy, controlPlanePersistence };
}

function makeSeed() {
  return {
    session: {
      userId: "usr_long_run",
      email: "longrun@antiphon.audio",
      displayName: "Long Run",
      signedInAt: "2026-02-13T00:00:00.000Z"
    },
    entitlements: [
      {
        id: "antiphon.layer.alpha",
        name: "Alpha",
        version: "2.0.0",
        installedVersion: "2.0.0",
        owned: true,
        installState: "installed",
        updateAvailable: false
      }
    ],
    offlineCache: {
      lastValidatedAt: "2026-02-13T00:00:00.000Z",
      maxOfflineDays: 21,
      offlineDaysRemaining: 7,
      cacheState: "valid"
    },
    transactions: []
  };
}

function addSeconds(iso, seconds) {
  const epoch = Math.floor(new Date(iso).getTime() / 1000);
  return new Date((epoch + seconds) * 1000).toISOString();
}

async function runScenarioRun(iterations, secondsPerStep) {
  const { controlPlaneTrustArtifact, clockDriftPolicy, controlPlanePersistence } = await loadModules();
  let snapshot = makeSeed();
  let nowIso = "2026-02-13T00:00:00.000Z";

  const reasonTrace = [];
  const cycleHashes = [];

  for (let i = 0; i < iterations; i += 1) {
    const artifact = controlPlaneTrustArtifact.issueTrustArtifact(snapshot);
    const serializedArtifact = controlPlaneTrustArtifact.serializeTrustArtifact(artifact);

    const artifactOk = controlPlaneTrustArtifact.parseTrustArtifactWithReport(serializedArtifact, {
      nowIso,
      maxSkewSeconds: 60 * 60
    });

    const behindIso = addSeconds(nowIso, -7200);
    const aheadIso = addSeconds(nowIso, 7200);

    const skewBehind = controlPlaneTrustArtifact.parseTrustArtifactWithReport(serializedArtifact, {
      nowIso: behindIso,
      maxSkewSeconds: 60
    });
    const skewAhead = controlPlaneTrustArtifact.parseTrustArtifactWithReport(serializedArtifact, {
      nowIso: aheadIso,
      maxSkewSeconds: 60
    });

    const drift = clockDriftPolicy.evaluateClockDrift({
      nowIso,
      lastValidatedAt: snapshot.offlineCache.lastValidatedAt,
      offlineDaysRemaining: snapshot.offlineCache.offlineDaysRemaining,
      maxClockSkewSeconds: 300
    });

    const persisted = controlPlanePersistence.toPersistedControlPlaneState(snapshot, null);
    const serialized = controlPlanePersistence.serializePersistedControlPlaneState(persisted);
    const restoredReport = controlPlanePersistence.parsePersistedControlPlaneStateWithReport(serialized, {
      nowIso,
      maxSkewSeconds: 60 * 60 * 24 * 365
    });

    if (!restoredReport.state) {
      throw new Error("long_run_restore_failed");
    }

    snapshot = {
      ...snapshot,
      offlineCache: {
        ...restoredReport.state.offlineCache,
        lastValidatedAt: nowIso
      }
    };

    reasonTrace.push({
      cycle: i,
      artifactOk: artifactOk.reasonCode,
      artifactSkewBehind: skewBehind.reasonCode,
      artifactSkewAhead: skewAhead.reasonCode,
      drift: drift.reasonCode,
      persist: restoredReport.reasonCode
    });

    cycleHashes.push(hashOf({ snapshot, reason: reasonTrace[reasonTrace.length - 1] }));

    nowIso = addSeconds(nowIso, secondsPerStep);
  }

  return {
    iterations,
    reasonTrace,
    finalStateHash: hashOf(snapshot),
    cycleDigest: hashOf(cycleHashes)
  };
}

export async function buildLongRunSummary() {
  const runA = await runScenarioRun(40, 45);
  const runB = await runScenarioRun(40, 45);
  const runC = await runScenarioRun(40, 45);

  const stable =
    runA.finalStateHash === runB.finalStateHash &&
    runB.finalStateHash === runC.finalStateHash &&
    runA.cycleDigest === runB.cycleDigest &&
    runB.cycleDigest === runC.cycleDigest;

  const summary = {
    iterations: runA.iterations,
    stable,
    finalStateHash: runA.finalStateHash,
    cycleDigest: runA.cycleDigest,
    reasonSignature: runA.reasonTrace.map((entry) => `${entry.artifactOk}|${entry.artifactSkewBehind}|${entry.artifactSkewAhead}|${entry.drift}|${entry.persist}`)
  };

  return summary;
}


export async function buildLongRunOperatorContract() {
  const summary = await buildLongRunSummary();
  return {
    contract_version: OPERATOR_CONTRACT_VERSION,
    script: "proof-long-run-determinism",
    iterations: summary.iterations,
    stable: summary.stable,
    final_state_hash: summary.finalStateHash,
    cycle_digest: summary.cycleDigest,
    reason_signature_digest: hashOf(summary.reasonSignature)
  };
}

export async function runLongRunDeterminismProof(options = { contractJson: false }) {
  const summary = await buildLongRunSummary();
  const expected = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-long-run-proof-snapshots.json"), "utf-8")
  )[0]?.expected;

  assertEqual(summary, expected, "long-run determinism proof mismatch");
  if (options.contractJson) {
    const contract = await buildLongRunOperatorContract();
    console.log(JSON.stringify(contract));
    return;
  }
  console.log("[proof:long-run-determinism] PASS");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const contractJson = process.argv.includes("--contract-json");
  runLongRunDeterminismProof({ contractJson }).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
