import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("[gate] repo status");
run("git", ["status", "--short"]);

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

console.log("[gate] PASS");
