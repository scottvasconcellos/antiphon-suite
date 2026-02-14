import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

function fail(message) {
  console.error(`[rc-check] FAIL: ${message}`);
  process.exit(1);
}

function run(command, args) {
  return spawnSync(command, args, { stdio: "pipe", shell: false, encoding: "utf-8" });
}

const nodeMajor = Number(process.versions.node.split(".")[0] || "0");
if (nodeMajor < 20) {
  fail(`node_version_unsupported required>=20 actual=${process.versions.node}`);
}

const status = run("git", ["status", "--short"]);
if (status.status !== 0) {
  fail("git_status_unavailable");
}
if ((status.stdout || "").trim().length > 0) {
  fail("repo_not_clean");
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
console.log(`[rc-check] requiredFiles=${requiredFiles.length}`);
console.log("[rc-check] PASS");
