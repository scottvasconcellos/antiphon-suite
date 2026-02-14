import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nactual=${JSON.stringify(actual)}\nexpected=${JSON.stringify(expected)}`);
  }
}

export async function runIntegrationCheck() {
  const publicControlPlaneSource = readFileSync(
    join(process.cwd(), "apps/layer0-hub/src/services/publicControlPlane.ts"),
    "utf-8"
  );

  const publicSurfaceFixture = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-public-surface-snapshots.json"), "utf-8")
  )[0];
  const actualSurface = [...publicControlPlaneSource.matchAll(/export\s+\*\s+as\s+([A-Za-z0-9_]+)\s+from/g)]
    .map((match) => match[1])
    .sort();
  assertEqual(actualSurface, [...publicSurfaceFixture.expected].sort(), "public surface snapshot mismatch");

  run("node", ["scripts/verify-reason-coverage.mjs"]);

  run("node", ["scripts/demo-hub.mjs"]);
  run("node", ["scripts/demo-layer.mjs"]);
  run("node", ["scripts/proof-layer-app.mjs"]);

  const demoSnapshot = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-demo-output-snapshots.json"), "utf-8")
  )[0];
  assert(demoSnapshot && demoSnapshot.expected, "demo snapshot fixture missing expected output");

  console.log("[integration-check] PASS");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runIntegrationCheck().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
