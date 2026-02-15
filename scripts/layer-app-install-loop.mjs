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

function parseArgs(argv) {
  const out = { multi: false, inject: "none", printJson: false };
  for (const arg of argv) {
    if (arg === "--multi") out.multi = true;
    else if (arg.startsWith("--inject=")) out.inject = arg.slice("--inject=".length);
    else if (arg === "--print-json") out.printJson = true;
  }
  return out;
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

async function loadModules() {
  run("pnpm", ["--filter", "@antiphon/layer0-hub", "exec", "tsc", "-p", "tsconfig.control-plane-smoke.json"]);

  const base = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services");
  const rewrite = (file, from, to) => {
    const full = join(base, file);
    let source = readFileSync(full, "utf-8");
    source = source.replaceAll(from, to);
    writeFileSync(full, source, "utf-8");
  };
  rewrite("artifactInstallerExecution.js", 'from "./artifactManifestContract";', 'from "./artifactManifestContract.js";');
  rewrite("artifactTrustVerification.js", 'from "./artifactManifestContract";', 'from "./artifactManifestContract.js";');
  rewrite("artifactTrustVerification.js", 'from "./timeControl";', 'from "./timeControl.js";');
  rewrite("updateChannelPolicy.js", 'from "./controlPlaneReasonTaxonomy";', 'from "./controlPlaneReasonTaxonomy.js";');
  rewrite("updateChannelPolicy.js", 'from "./appCatalog";', 'from "./appCatalog.js";');
  rewrite("multiAppEntitlement.js", 'from "../domain/entitlementDecision";', 'from "../domain/entitlementDecision.js";');
  rewrite("multiAppEntitlement.js", 'from "./controlPlaneReasonTaxonomy";', 'from "./controlPlaneReasonTaxonomy.js";');
  rewrite("multiAppEntitlement.js", 'from "./appCatalog";', 'from "./appCatalog.js";');
  rewrite("controlPlanePersistence.js", 'from "./appCatalog";', 'from "./appCatalog.js";');
  rewrite("controlPlanePersistence.js", 'from "./timeControl";', 'from "./timeControl.js";');
  rewrite("updateRecoveryPolicy.js", 'from "./controlPlaneReasonTaxonomy";', 'from "./controlPlaneReasonTaxonomy.js";');

  const artifactManifestContract = await import(pathToFileURL(join(base, "artifactManifestContract.js")).href);
  const artifactTrustVerification = await import(pathToFileURL(join(base, "artifactTrustVerification.js")).href);
  const artifactInstallerExecution = await import(pathToFileURL(join(base, "artifactInstallerExecution.js")).href);
  const updateChannelPolicy = await import(pathToFileURL(join(base, "updateChannelPolicy.js")).href);
  const multiAppEntitlement = await import(pathToFileURL(join(base, "multiAppEntitlement.js")).href);
  const controlPlanePersistence = await import(pathToFileURL(join(base, "controlPlanePersistence.js")).href);
  const updateRecoveryPolicy = await import(pathToFileURL(join(base, "updateRecoveryPolicy.js")).href);

  return {
    artifactManifestContract,
    artifactTrustVerification,
    artifactInstallerExecution,
    updateChannelPolicy,
    multiAppEntitlement,
    controlPlanePersistence
    ,
    updateRecoveryPolicy
  };
}

function buildAppInputs(multi) {
  const base = "apps";
  const apps = [
    {
      appId: "antiphon.layer.hello-world",
      channel: "stable",
      requiredEntitlements: ["feat_core"],
      grantEntitlements: ["feat_core"],
      versions: [
        {
          version: "1.0.0",
          manifestPath: `${base}/layer-app-hello-world/artifacts/v1/manifest.json`,
          payloadPath: `${base}/layer-app-hello-world/artifacts/v1/app.txt`
        },
        {
          version: "1.1.0",
          manifestPath: `${base}/layer-app-hello-world/artifacts/v2/manifest.json`,
          payloadPath: `${base}/layer-app-hello-world/artifacts/v2/app.txt`
        }
      ]
    }
  ];

  if (multi) {
    apps.push({
      appId: "antiphon.layer.rhythm",
      channel: "beta",
      requiredEntitlements: ["feat_rhythm"],
      grantEntitlements: [],
      versions: [
        {
          version: "1.0.0",
          manifestPath: `${base}/layer-app-rhythm/artifacts/v1/manifest.json`,
          payloadPath: `${base}/layer-app-rhythm/artifacts/v1/app.txt`
        },
        {
          version: "1.1.0-beta.1",
          manifestPath: `${base}/layer-app-rhythm/artifacts/v2/manifest.json`,
          payloadPath: `${base}/layer-app-rhythm/artifacts/v2/app.txt`
        }
      ]
    });
  }
  return apps;
}

export async function runOperatorLoop(options = {}) {
  const { multi = false, inject = "none" } = options;
  const modules = await loadModules();
  const apps = buildAppInputs(multi);
  const nowIso = "2026-02-13T00:00:00.000Z";

  let fileSystem = {};
  const store = [];
  const activeSelection = [];
  const failures = [];

  for (const app of apps.sort((a, b) => a.appId.localeCompare(b.appId))) {
    const installedVersions = [];

    for (const artifact of app.versions) {
      const manifestRaw = readFileSync(join(process.cwd(), artifact.manifestPath), "utf-8");
      const payload = readFileSync(join(process.cwd(), artifact.payloadPath), "utf-8");

      const trustInput = {
        manifestRaw,
        expectedAppId: app.appId,
        expectedVersion: artifact.version,
        nowIso,
        requireSignature: true
      };

      if (inject === "bad_manifest") {
        trustInput.manifestRaw = "{bad";
      } else if (inject === "trust_fail") {
        trustInput.manifestRaw = manifestRaw.replace(/"signature":\s*"[0-9a-f]+"/, '"signature": "deadbeef"');
      }

      const trust = modules.artifactTrustVerification.verifyArtifactTrust(trustInput);
      if (!trust.trusted) {
        failures.push({ appId: app.appId, version: artifact.version, reasonCode: trust.reasonCode, remediation: trust.remediation });
        continue;
      }

      const tx = modules.artifactInstallerExecution.executeAtomicArtifactTransaction({
        appId: app.appId,
        manifestRaw,
        payloadFiles: { "app.txt": payload },
        targetDir: `/installed/${app.appId}`,
        fileSystem,
        inject: inject === "partial_install" && artifact.version === app.versions[1]?.version ? { mode: "partial_apply" } : undefined
      });

      if (tx.applied.ok) {
        fileSystem = tx.applied.fileSystem;
        installedVersions.push({
          version: artifact.version,
          digest: modules.artifactManifestContract.parseArtifactManifest(manifestRaw).manifest.files[0].sha256
        });
      } else {
        failures.push({ appId: app.appId, version: artifact.version, reasonCode: tx.applied.reasonCode, remediation: tx.applied.remediation });
      }
    }

    store.push({ appId: app.appId, versions: installedVersions.sort((a, b) => a.version.localeCompare(b.version)) });

    const candidates = app.versions.map((v) => ({ appId: app.appId, channel: app.channel, version: v.version }));
    const selection = modules.updateChannelPolicy.selectUpdateByChannelPolicy({
      appId: app.appId,
      allowedChannel: app.channel,
      candidates
    });
    activeSelection.push({ appId: app.appId, selectedVersion: selection.selectedVersion, reasonCode: selection.reasonCode });
  }

  const multiInput = apps.map((app) => ({
    appId: app.appId,
    requiredEntitlements: app.requiredEntitlements,
    grantedEntitlements: app.grantEntitlements,
    decisionInput: {
      identity: { authenticated: true },
      license: { owned: true, revoked: false },
      offlineCache: { cacheState: "valid", offlineDaysRemaining: 7 }
    }
  }));
  const entitlement = modules.multiAppEntitlement.decideMultiAppEntitlements(multiInput);

  const persisted = modules.controlPlanePersistence.toPersistedControlPlaneState(
    {
      session: { userId: "usr_loop", email: "loop@antiphon.audio", displayName: "Loop", signedInAt: nowIso },
      entitlements: [],
      offlineCache: { lastValidatedAt: nowIso, maxOfflineDays: 21, offlineDaysRemaining: 7, cacheState: "valid" },
      transactions: []
    },
    null,
    [],
    failures.map((f) => ({ appId: f.appId, previousTargetHash: "n/a", manifestVersion: f.version, rollbackPrepared: true }))
  );

  const runPlan = {
    apps: activeSelection
      .sort((a, b) => a.appId.localeCompare(b.appId))
      .map((entry) => ({
        appId: entry.appId,
        selectedVersion: entry.selectedVersion,
        runnable: store.find((s) => s.appId === entry.appId)?.versions.some((v) => v.version === entry.selectedVersion) ?? false,
        hubOptional: true
      })),
    failures: failures.sort((a, b) => `${a.appId}:${a.version}`.localeCompare(`${b.appId}:${b.version}`)),
    entitlement: entitlement.sort((a, b) => a.appId.localeCompare(b.appId))
  };

  const rollbackPlan = store
    .map((entry) => {
      const versions = [...entry.versions].sort((a, b) => a.version.localeCompare(b.version));
      const newest = versions[versions.length - 1] ?? null;
      const previous = versions.length > 1 ? versions[versions.length - 2] : null;
      const appInput = {
        id: entry.appId,
        name: entry.appId,
        version: newest?.version ?? "0.0.0",
        installedVersion: previous?.version ?? null,
        owned: true,
        installState: "installed",
        updateAvailable: Boolean(newest && previous)
      };
      const decision = modules.updateRecoveryPolicy.applyUpdateRollback(appInput, {});
      return {
        appId: entry.appId,
        reasonCode: decision.reasonCode,
        finalInstalledVersion: decision.preservedInstalledVersion
      };
    })
    .sort((a, b) => a.appId.localeCompare(b.appId));

  return {
    installStoreLayout: store.sort((a, b) => a.appId.localeCompare(b.appId)),
    activeSelectionState: activeSelection.sort((a, b) => a.appId.localeCompare(b.appId)),
    runPlan,
    rollbackPlan,
    rollbackMetadataCount: persisted.rollbackMetadata?.length ?? 0,
    persistenceStableHash: stableStringify(persisted)
  };
}

export async function runAndAssertSnapshot(name, options, fixturePath) {
  const output = await runOperatorLoop(options);
  const fixture = JSON.parse(readFileSync(join(process.cwd(), fixturePath), "utf-8")).find((f) => f.name === name);
  if (!fixture) {
    throw new Error(`missing_fixture:${name}`);
  }
  assertEqual(output, fixture.expected, `operator loop snapshot mismatch: ${name}`);
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const fixturePath = args.multi
    ? "apps/layer0-hub/fixtures/control-plane-operator-loop-multi-app-snapshots.json"
    : args.inject !== "none"
      ? "apps/layer0-hub/fixtures/control-plane-operator-loop-failure-snapshots.json"
      : "apps/layer0-hub/fixtures/control-plane-operator-loop-snapshots.json";
  const name = args.multi
    ? "operator-loop-multi-app"
    : args.inject !== "none"
      ? `operator-loop-failure-${args.inject}`
      : "operator-loop-single-app";

  runAndAssertSnapshot(name, args, fixturePath)
    .then((output) => {
      if (args.printJson) {
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log(`[operator-loop] ${name} PASS`);
      }
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
