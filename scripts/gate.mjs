import { spawnSync } from "node:child_process";
import { getScopedDirtyPaths } from "./scope-clean-check.mjs";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("[gate] control-plane scoped status");
const scopedDirtyPaths = getScopedDirtyPaths();
if (scopedDirtyPaths.length === 0) {
  console.log("[gate] scoped-dirty-count=0");
} else {
  console.log(`[gate] scoped-dirty-count=${scopedDirtyPaths.length}`);
  for (const filePath of scopedDirtyPaths) {
    console.log(`[gate] scoped-dirty ${filePath}`);
  }
}

console.log("[gate] running smoke");
run("npm", ["run", "smoke"]);

console.log("[gate] verifying public surface snapshot");
run("node", ["scripts/verify-public-surface.mjs"]);

console.log("[gate] verifying reason coverage snapshot");
run("node", ["scripts/verify-reason-coverage.mjs"]);

console.log("[gate] running scoped rc-check");
run("npm", ["run", "rc-check"]);

console.log("[gate] verifying staged legacy guard");
run("node", ["scripts/legacy-staged-guard.mjs"]);

console.log("[gate] running integration checks");
run("node", ["scripts/integration-check.mjs"]);

console.log("[gate] running trust/install boundary proof");
run("node", ["scripts/proof-trust-install-boundary.mjs"]);

console.log("[gate] running long-run determinism proof");
run("node", ["scripts/proof-long-run-determinism.mjs"]);

console.log("[gate] running operator contract check");
run("node", ["scripts/operator-contract-check.mjs"]);

console.log("[gate] PASS");
