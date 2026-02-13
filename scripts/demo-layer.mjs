import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("[demo:layer] building deterministic control-plane harness artifacts");
run("node", ["scripts/control-plane-smoke.mjs"]);

console.log("[demo:layer] running layer app example harness");
run("node", ["scripts/layer-app-example-harness.mjs"]);

console.log("[demo:layer] PASS");
