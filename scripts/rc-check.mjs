import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

function fail(message) {
  console.error(`[rc-check] FAIL: ${message}`);
  process.exit(1);
}

function run(command, args, stdio = "pipe") {
  return spawnSync(command, args, { stdio, shell: false, encoding: "utf-8" });
}

const nodeMajor = Number(process.versions.node.split(".")[0] || "0");
if (nodeMajor < 20) {
  fail(`node_version_unsupported required>=20 actual=${process.versions.node}`);
}

const scopeGovernance = run("node", ["scripts/scope-governance-check.mjs"], "inherit");
if (scopeGovernance.status !== 0) {
  fail("scope_config_changed_unacknowledged");
}

const scopeStatus = run("node", ["scripts/scope-clean-check.mjs"], "inherit");
if (scopeStatus.status !== 0) {
  fail("repo_scope_not_clean (control-plane scoped clean-state required; legacy quarantine drift ignored)");
}

const requiredFiles = [
  "apps/layer-app-hello-world/artifacts/v1/manifest.json",
  "apps/layer-app-hello-world/artifacts/v2/manifest.json",
  "apps/layer-app-rhythm/artifacts/v1/manifest.json",
  "apps/layer-app-rhythm/artifacts/v2/manifest.json",
  "apps/layer0-hub/fixtures/control-plane-operator-loop-snapshots.json",
  "apps/layer0-hub/fixtures/control-plane-operator-loop-multi-app-snapshots.json",
  "apps/layer0-hub/fixtures/control-plane-operator-loop-failure-snapshots.json",
  "apps/layer0-hub/fixtures/control-plane-operator-demo-snapshots.json"
].sort((a, b) => a.localeCompare(b));

for (const filePath of requiredFiles) {
  if (!existsSync(filePath)) {
    fail(`missing_required_file:${filePath}`);
  }
}

console.log(`[rc-check] node=${process.versions.node}`);
console.log("[rc-check] scoped clean-state required for control-plane only");
console.log("[rc-check] legacy quarantine drift is ignored");
console.log(`[rc-check] requiredFiles=${requiredFiles.length}`);
console.log("[rc-check] PASS");
