import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { runOperatorLoop } from "./layer-app-install-loop.mjs";
import { readVersionStamp } from "./version-stamp.mjs";

const { contractVersion: OPERATOR_CONTRACT_VERSION } = readVersionStamp();

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nactual=${JSON.stringify(actual)}\nexpected=${JSON.stringify(expected)}`);
  }
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashOf(value) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function summarize(output) {
  const chosenApps = output.activeSelectionState
    .map((entry) => entry.appId)
    .sort((a, b) => a.localeCompare(b));

  return {
    chosenApps,
    entitlementOutcomes: [...output.runPlan.entitlement]
      .sort((a, b) => a.appId.localeCompare(b.appId))
      .map((entry) => ({
        appId: entry.appId,
        outcome: entry.outcome,
        reasonCode: entry.reasonCode
      })),
    installUpdateActions: [...output.activeSelectionState]
      .sort((a, b) => a.appId.localeCompare(b.appId))
      .map((entry) => ({
        appId: entry.appId,
        selectedVersion: entry.selectedVersion,
        reasonCode: entry.reasonCode
      })),
    trustArtifact: {
      created: output.persistenceStableHash.length > 0,
      validated: output.runPlan.failures.length === 0,
      hubOptionalRunnable: output.runPlan.apps.every((app) => app.hubOptional && app.runnable)
    },
    proofMarker: `hub-optional-runnable:${output.runPlan.apps.every((app) => app.hubOptional && app.runnable)}`
  };
}

export async function buildDemoSummary() {
  const output = await runOperatorLoop({ multi: true, inject: "none" });
  return summarize(output);
}

export async function buildDemoOperatorContract() {
  const summary = await buildDemoSummary();
  return {
    contract_version: OPERATOR_CONTRACT_VERSION,
    script: "demo",
    chosen_apps: summary.chosenApps,
    entitlement_reason_codes: summary.entitlementOutcomes.map((entry) => entry.reasonCode).sort((a, b) => a.localeCompare(b)),
    install_reason_codes: summary.installUpdateActions.map((entry) => entry.reasonCode).sort((a, b) => a.localeCompare(b)),
    trust: { ...summary.trustArtifact },
    proof_marker: summary.proofMarker,
    digest: hashOf(summary)
  };
}

export async function runDemo(options = { contractJson: false }) {
  const summary = await buildDemoSummary();
  const expected = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-operator-demo-snapshots.json"), "utf-8")
  )[0]?.expected;

  assertEqual(summary, expected, "operator demo snapshot mismatch");

  if (options.contractJson) {
    const contract = await buildDemoOperatorContract();
    console.log(JSON.stringify(contract));
    return;
  }

  console.log(`[demo] apps=${summary.chosenApps.join(",")}`);
  for (const item of summary.entitlementOutcomes) {
    console.log(`[demo] entitlement ${item.appId} ${item.outcome} ${item.reasonCode}`);
  }
  for (const item of summary.installUpdateActions) {
    console.log(`[demo] action ${item.appId} ${item.selectedVersion} ${item.reasonCode}`);
  }
  console.log(
    `[demo] trust created=${summary.trustArtifact.created} validated=${summary.trustArtifact.validated} hubOptionalRunnable=${summary.trustArtifact.hubOptionalRunnable}`
  );
  console.log(`[demo] proof ${summary.proofMarker}`);
  console.log("[demo] PASS");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const contractJson = process.argv.includes("--contract-json");
  runDemo({ contractJson }).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
