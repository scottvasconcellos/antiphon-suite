import { readFileSync, readdirSync, statSync } from "node:fs";
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

function listTypeScriptFiles(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current)) {
      const fullPath = join(current, entry);
      const info = statSync(fullPath);
      if (info.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) {
        out.push(fullPath);
      }
    }
  }
  return out.sort();
}

function assertNoLegacyImports() {
  const scopeConfig = JSON.parse(readFileSync(join(process.cwd(), "control-plane.scope.json"), "utf-8"));
  const frozenLegacyPaths = (scopeConfig.frozenLegacyDeny ?? [])
    .filter((value) => value.startsWith("apps/layer0-hub/src/domain/") && value.endsWith(".ts"))
    .map((value) => value.replace(/^apps\/layer0-hub\/src\/domain\//, "").replace(/\.ts$/, ""));

  const targetFiles = [
    ...listTypeScriptFiles(join(process.cwd(), "apps/layer0-hub/src/services")),
    join(process.cwd(), "apps/layer0-hub/src/App.tsx")
  ];

  for (const filePath of targetFiles) {
    const source = readFileSync(filePath, "utf-8");
    const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
    for (const specifier of imports) {
      if (!specifier.startsWith(".")) {
        continue;
      }
      if (frozenLegacyPaths.some((legacy) => specifier.includes(legacy))) {
        throw new Error(`legacy_import_forbidden:${filePath}:${specifier}`);
      }
    }
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
  run("node", ["scripts/demo.mjs"]);
  run("node", ["scripts/proof-layer-app.mjs"]);

  const demoSnapshot = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-demo-output-snapshots.json"), "utf-8")
  )[0];
  assert(demoSnapshot && demoSnapshot.expected, "demo snapshot fixture missing expected output");

  const operatorSnapshot = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-operator-loop-snapshots.json"), "utf-8")
  )[0];
  assert(operatorSnapshot && operatorSnapshot.expected, "operator-loop snapshot missing expected output");

  const operatorDemoSnapshot = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-operator-demo-snapshots.json"), "utf-8")
  )[0];
  assert(operatorDemoSnapshot && operatorDemoSnapshot.expected, "operator demo snapshot missing expected output");

  const loopSource = readFileSync(join(process.cwd(), "scripts/layer-app-install-loop.mjs"), "utf-8");
  const badImport = /from\s+["'](\.\.\/|\.\/)?apps\/layer0-hub\/src\/(?!services\/publicControlPlane)/.test(loopSource);
  assert(!badImport, "layer-app install loop must not import internal hub modules directly");
  assertNoLegacyImports();

  console.log("[integration-check] PASS");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runIntegrationCheck().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
