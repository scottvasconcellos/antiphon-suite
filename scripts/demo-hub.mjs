import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { buildDemoOutput } from "./demo-layer.mjs";

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nactual=${JSON.stringify(actual)}\nexpected=${JSON.stringify(expected)}`);
  }
}

export async function runDemoHub() {
  const actual = await buildDemoOutput();
  const expected = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-demo-output-snapshots.json"), "utf-8")
  )[0]?.expected;
  assertEqual(actual, expected, "Hub demo snapshot mismatch");

  console.log("[demo:hub] open http://localhost:5173 (optional UI check)");
  console.log("[demo:hub] catalog apps");
  for (const app of actual.catalogApps) {
    console.log(`[demo:hub] - ${app.appId} channel=${app.channel} installed=${String(app.installedVersion)} available=${app.availableVersion}`);
  }
  console.log("[demo:hub] entitlement outcomes");
  for (const outcome of actual.entitlementOutcomes) {
    console.log(`[demo:hub] - ${outcome.appId} outcome=${outcome.outcome} reason=${outcome.reasonCode}`);
  }
  console.log("[demo:hub] install/update transitions");
  for (const tx of actual.transitions) {
    console.log(`[demo:hub] - ${tx.flow} ${tx.from}->${tx.to} reason=${tx.reasonCode}`);
  }
  console.log(
    `[demo:hub] update selection ${actual.updateSelection.appId} -> ${String(actual.updateSelection.selectedVersion)} (${actual.updateSelection.reasonCode})`
  );
  console.log(
    `[demo:hub] trust proof authorizedOnce=${actual.trustProof.authorizedOnce} hubRemoved=${actual.trustProof.hubRemoved} offlineRunnableWithoutHub=${actual.trustProof.offlineRunnableWithoutHub}`
  );
  console.log("[demo:hub] PASS");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runDemoHub().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
