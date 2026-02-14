import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { runOperatorLoop } from "./layer-app-install-loop.mjs";

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nactual=${JSON.stringify(actual)}\nexpected=${JSON.stringify(expected)}`);
  }
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

export async function runDemo() {
  const output = await runOperatorLoop({ multi: true, inject: "none" });
  const summary = summarize(output);
  const expected = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-operator-demo-snapshots.json"), "utf-8")
  )[0]?.expected;

  assertEqual(summary, expected, "operator demo snapshot mismatch");

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
  runDemo().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
