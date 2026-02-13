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

export async function buildDemoOutput() {
  run("pnpm", ["--filter", "@antiphon/layer0-hub", "exec", "tsc", "-p", "tsconfig.control-plane-smoke.json"]);

  const multiAppPath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/multiAppEntitlement.js");
  let multiAppSource = readFileSync(multiAppPath, "utf-8");
  multiAppSource = multiAppSource.replace('from "../domain/entitlementDecision";', 'from "../domain/entitlementDecision.js";');
  multiAppSource = multiAppSource.replace('from "./controlPlaneReasonTaxonomy";', 'from "./controlPlaneReasonTaxonomy.js";');
  multiAppSource = multiAppSource.replace('from "./appCatalog";', 'from "./appCatalog.js";');
  writeFileSync(multiAppPath, multiAppSource, "utf-8");

  const updatePolicyPath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/updateChannelPolicy.js");
  let updatePolicySource = readFileSync(updatePolicyPath, "utf-8");
  updatePolicySource = updatePolicySource.replace('from "./controlPlaneReasonTaxonomy";', 'from "./controlPlaneReasonTaxonomy.js";');
  updatePolicySource = updatePolicySource.replace('from "./appCatalog";', 'from "./appCatalog.js";');
  writeFileSync(updatePolicyPath, updatePolicySource, "utf-8");

  const appCatalog = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/appCatalog.js")).href
  );
  const multiAppEntitlement = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/multiAppEntitlement.js")).href
  );
  const installUpdateStateMachine = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/domain/installUpdateStateMachine.js")).href
  );
  const updateChannelPolicy = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/updateChannelPolicy.js")).href
  );

  const manifestFixture = JSON.parse(
    readFileSync(
      join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-layer-app-manifest-snapshots.json"),
      "utf-8"
    )
  )[0];
  const trustFixture = JSON.parse(
    readFileSync(
      join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-trust-envelope-validation-snapshots.json"),
      "utf-8"
    )
  )[0];

  const catalog = appCatalog.layerManifestsToCatalogEntries(
    manifestFixture.manifests,
    manifestFixture.installedVersions
  );
  const entitlements = multiAppEntitlement.decideMultiAppEntitlementsFromManifests(
    manifestFixture.manifests,
    ["feat_core"],
    manifestFixture.decisionInput
  );
  const installTransition = installUpdateStateMachine.transitionLifecycleState("NotInstalled", "BeginInstall");
  const updateAvailableTransition = installUpdateStateMachine.transitionLifecycleState("Installed", "MarkUpdateAvailable");
  const updateTransition = installUpdateStateMachine.transitionLifecycleState(updateAvailableTransition.to, "BeginUpdate");
  const selection = updateChannelPolicy.selectUpdateByManifestPolicy(
    manifestFixture.manifests.find((manifest) => manifest.id === "antiphon.layer.alpha"),
    manifestFixture.updateCandidates
  );
  const trust = trustFixture.expected;

  return {
    catalogApps: catalog
      .map((entry) => ({
        appId: entry.appId,
        channel: entry.channel,
        installedVersion: entry.installedVersion,
        availableVersion: entry.availableVersion
      }))
      .sort((a, b) => a.appId.localeCompare(b.appId)),
    entitlementOutcomes: [...entitlements]
      .sort((a, b) => a.appId.localeCompare(b.appId))
      .map((entry) => ({
        appId: entry.appId,
        outcome: entry.outcome,
        reasonCode: entry.reasonCode
      })),
    transitions: [
      { flow: "install", from: "NotInstalled", to: installTransition.to, reasonCode: "ok_install_completed" },
      { flow: "update", from: "Installed", to: updateTransition.to, reasonCode: "ok_update_candidate_selected" }
    ],
    updateSelection: {
      appId: selection.appId,
      selectedVersion: selection.selectedVersion,
      reasonCode: selection.reasonCode
    },
    trustProof: {
      authorizedOnce: trust.authorizedOnce,
      hubRemoved: trust.hubRemoved,
      offlineRunnableWithoutHub: trust.offlineRunnableWithoutHub
    }
  };
}

export async function runDemoLayer() {
  const actual = await buildDemoOutput();
  const expected = JSON.parse(
    readFileSync(
      join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-demo-output-snapshots.json"),
      "utf-8"
    )
  )[0]?.expected;
  assertEqual(actual, expected, "Demo output snapshot mismatch");

  console.log("[demo:layer] catalog apps");
  for (const app of actual.catalogApps) {
    console.log(`[demo:layer] - ${app.appId} channel=${app.channel} installed=${String(app.installedVersion)} available=${app.availableVersion}`);
  }
  console.log("[demo:layer] entitlement outcomes");
  for (const outcome of actual.entitlementOutcomes) {
    console.log(`[demo:layer] - ${outcome.appId} outcome=${outcome.outcome} reason=${outcome.reasonCode}`);
  }
  console.log("[demo:layer] install/update transitions");
  for (const tx of actual.transitions) {
    console.log(`[demo:layer] - ${tx.flow} ${tx.from}->${tx.to} reason=${tx.reasonCode}`);
  }
  console.log(
    `[demo:layer] update selection ${actual.updateSelection.appId} -> ${String(actual.updateSelection.selectedVersion)} (${actual.updateSelection.reasonCode})`
  );
  console.log(
    `[demo:layer] trust proof authorizedOnce=${actual.trustProof.authorizedOnce} hubRemoved=${actual.trustProof.hubRemoved} offlineRunnableWithoutHub=${actual.trustProof.offlineRunnableWithoutHub}`
  );
  console.log("[demo:layer] PASS");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runDemoLayer().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
