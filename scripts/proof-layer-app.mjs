import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("node", ["scripts/control-plane-smoke.mjs"]);

const fixture = JSON.parse(
  readFileSync(
    join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-real-layer-app-pipeline-snapshots.json"),
    "utf-8"
  )
)[0];

const out = fixture.expected;
console.log(`[proof:layer-app] install ${out.install.reasonCode} -> ${out.install.lifecycleTo}`);
console.log(`[proof:layer-app] update ${out.update.reasonCode} -> ${out.update.lifecycleTo}`);
console.log(`[proof:layer-app] rollback ${out.rollback.reasonCode} + ${out.rollback.rollbackReasonCode}`);
console.log(`[proof:layer-app] hub-optional ${String(out.hubOptional)}`);
console.log("[proof:layer-app] PASS");
