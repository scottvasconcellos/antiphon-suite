import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

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

function patchImport(filePath, from, to) {
  const fullPath = join(process.cwd(), filePath);
  let source = readFileSync(fullPath, "utf-8");
  source = source.replaceAll(from, to);
  writeFileSync(fullPath, source, "utf-8");
}

async function loadModules() {
  run("pnpm", ["--filter", "@antiphon/layer0-hub", "exec", "tsc", "-p", "tsconfig.control-plane-smoke.json"]);

  patchImport(
    "apps/layer0-hub/.tmp-control-plane-smoke/services/artifactTrustVerification.js",
    'from "./artifactManifestContract";',
    'from "./artifactManifestContract.js";'
  );
  patchImport(
    "apps/layer0-hub/.tmp-control-plane-smoke/services/artifactInstallerExecution.js",
    'from "./artifactManifestContract";',
    'from "./artifactManifestContract.js";'
  );
  patchImport(
    "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneTrustArtifact.js",
    'from "../domain/types";',
    'from "../domain/types.js";'
  );
  patchImport(
    "apps/layer0-hub/.tmp-control-plane-smoke/services/installUpdateAuthority.js",
    'from "../domain/installUpdateStateMachine";',
    'from "../domain/installUpdateStateMachine.js";'
  );
  patchImport(
    "apps/layer0-hub/.tmp-control-plane-smoke/services/installUpdateAuthority.js",
    'from "./downloadInstallerBoundary";',
    'from "./downloadInstallerBoundary.js";'
  );
  patchImport(
    "apps/layer0-hub/.tmp-control-plane-smoke/services/installUpdateAuthority.js",
    'from "./artifactInstallerExecution";',
    'from "./artifactInstallerExecution.js";'
  );

  const artifactTrustVerification = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/artifactTrustVerification.js")).href
  );
  const artifactInstallerExecution = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/artifactInstallerExecution.js")).href
  );
  const controlPlaneTrustArtifact = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneTrustArtifact.js")).href
  );
  const installUpdateAuthority = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/installUpdateAuthority.js")).href
  );

  return { artifactTrustVerification, artifactInstallerExecution, controlPlaneTrustArtifact, installUpdateAuthority };
}

function makeManifest({ version = 1, signature = null } = {}) {
  const base = {
    schema: "antiphon.artifact-manifest",
    version,
    appId: "antiphon.layer.alpha",
    appVersion: "2.0.0",
    channel: "stable",
    digestAlgorithm: "sha256",
    files: [
      {
        path: "README.txt",
        size: 5,
        sha256: "a82fb4a1a82fb4a1a82fb4a1a82fb4a1a82fb4a1a82fb4a1a82fb4a1a82fb4a1"
      }
    ]
  };
  if (signature) {
    base.signature = signature;
  }
  return JSON.stringify(base, null, 2);
}

export async function buildProofOutput() {
  const { artifactTrustVerification, artifactInstallerExecution, controlPlaneTrustArtifact, installUpdateAuthority } = await loadModules();

  const trustFailures = [
    {
      case: "missing_manifest",
      result: artifactTrustVerification.verifyArtifactTrust({
        manifestRaw: "",
        expectedAppId: "antiphon.layer.alpha",
        expectedVersion: "2.0.0",
        nowIso: "2026-02-13T00:00:00.000Z",
        requireSignature: true
      })
    },
    {
      case: "malformed_manifest_shape",
      result: artifactTrustVerification.verifyArtifactTrust({
        manifestRaw: JSON.stringify({ schema: "antiphon.artifact-manifest", version: 1, appId: 7 }),
        expectedAppId: "antiphon.layer.alpha",
        expectedVersion: "2.0.0",
        nowIso: "2026-02-13T00:00:00.000Z",
        requireSignature: true
      })
    },
    {
      case: "unsupported_manifest_version",
      result: artifactTrustVerification.verifyArtifactTrust({
        manifestRaw: makeManifest({ version: 2 }),
        expectedAppId: "antiphon.layer.alpha",
        expectedVersion: "2.0.0",
        nowIso: "2026-02-13T00:00:00.000Z",
        requireSignature: true
      })
    },
    {
      case: "signature_missing",
      result: artifactTrustVerification.verifyArtifactTrust({
        manifestRaw: makeManifest(),
        expectedAppId: "antiphon.layer.alpha",
        expectedVersion: "2.0.0",
        nowIso: "2026-02-13T00:00:00.000Z",
        requireSignature: true
      })
    },
    {
      case: "signature_invalid",
      result: artifactTrustVerification.verifyArtifactTrust({
        manifestRaw: makeManifest({ signature: { keyId: "layer-alpha-k1", algorithm: "ed25519", signature: "deadbeef" } }),
        expectedAppId: "antiphon.layer.alpha",
        expectedVersion: "2.0.0",
        nowIso: "2026-02-13T00:00:00.000Z",
        requireSignature: true
      })
    }
  ].map((entry) => ({ case: entry.case, reasonCode: entry.result.reasonCode, remediation: entry.result.remediation }));

  const trustArtifactFailures = [
    {
      case: "trust_artifact_missing",
      result: controlPlaneTrustArtifact.parseTrustArtifactWithReport("")
    },
    {
      case: "trust_artifact_unreadable",
      result: controlPlaneTrustArtifact.parseTrustArtifactWithReport("{")
    },
    {
      case: "trust_artifact_expired_or_skewed",
      result: controlPlaneTrustArtifact.parseTrustArtifactWithReport(
        JSON.stringify({ schema: "antiphon.trust-artifact", version: 1, appIds: ["antiphon.layer.alpha"], issuedAt: "2010-01-01T00:00:00.000Z" }),
        { nowIso: "2026-02-13T00:00:00.000Z", maxSkewSeconds: 60 }
      )
    }
  ].map((entry) => ({ case: entry.case, reasonCode: entry.result.reasonCode, remediation: entry.result.remediation }));

  const txPartial = artifactInstallerExecution.executeAtomicArtifactTransaction({
    appId: "antiphon.layer.alpha",
    manifestRaw: makeManifest(),
    payloadFiles: { "README.txt": "hello" },
    targetDir: "/opt/antiphon/alpha",
    fileSystem: { "/opt/antiphon/alpha/old.txt": "old" },
    inject: { mode: "partial_apply" }
  });
  const txRollbackFail = artifactInstallerExecution.executeAtomicArtifactTransaction({
    appId: "antiphon.layer.alpha",
    manifestRaw: makeManifest(),
    payloadFiles: { "README.txt": "hello" },
    targetDir: "/opt/antiphon/alpha",
    fileSystem: { "/opt/antiphon/alpha/old.txt": "old" },
    inject: { mode: "rollback_fail" }
  });

  const snapshot = {
    session: null,
    entitlements: [
      {
        id: "antiphon.layer.alpha",
        name: "Alpha",
        version: "2.0.0",
        installedVersion: "1.0.0",
        owned: true,
        installState: "installed",
        updateAvailable: true
      }
    ],
    offlineCache: { lastValidatedAt: "2026-02-13T00:00:00.000Z", maxOfflineDays: 21, offlineDaysRemaining: 21, cacheState: "valid" },
    transactions: []
  };

  const installNonZero = await installUpdateAuthority.runInstallUpdateAuthority(snapshot, "install", "antiphon.layer.alpha", async () => ({
    ok: false,
    reasonCode: "failed_install_non_zero"
  }));
  const updateTimeout = await installUpdateAuthority.runInstallUpdateAuthority(snapshot, "update", "antiphon.layer.alpha", async () => ({
    ok: false,
    reasonCode: "failed_update_timeout"
  }));

  return {
    trustFailures,
    trustArtifactFailures,
    installBoundaryFailures: [
      {
        case: "installer_non_zero_exit",
        reasonCode: installNonZero.result.reasonCode,
        lifecycleTo: installNonZero.result.lifecycle.to
      },
      {
        case: "installer_timeout_hung",
        reasonCode: updateTimeout.result.reasonCode,
        lifecycleTo: updateTimeout.result.lifecycle.to
      },
      {
        case: "installer_partial_state_detected",
        reasonCode: txPartial.applied.reasonCode,
        atomicGuaranteed: txPartial.atomicity.guaranteed,
        targetUnchanged: txPartial.applied.fileSystem["/opt/antiphon/alpha/old.txt"] === "old"
      },
      {
        case: "rollback_failure",
        reasonCode: txRollbackFail.applied.reasonCode,
        atomicGuaranteed: txRollbackFail.atomicity.guaranteed,
        rollbackAttempted: txRollbackFail.atomicity.rollbackAttempted
      }
    ]
  };
}

export async function runTrustInstallBoundaryProof() {
  const actual = await buildProofOutput();
  const expected = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-trust-install-boundary-proof-snapshots.json"), "utf-8")
  )[0]?.expected;
  assertEqual(actual, expected, "trust/install boundary proof mismatch");
  console.log("[proof:trust-install-boundary] PASS");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runTrustInstallBoundaryProof().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
