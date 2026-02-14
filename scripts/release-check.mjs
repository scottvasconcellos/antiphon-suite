import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "pipe", shell: false, encoding: "utf-8", ...options });
  return result;
}

const status = run("git", ["status", "--short"]);
if (status.status !== 0) {
  process.stderr.write(status.stderr || "git status failed\n");
  process.exit(status.status ?? 1);
}
if ((status.stdout || "").trim().length > 0) {
  console.error("[release:check] FAIL: git working tree is not clean");
  process.stdout.write(status.stdout || "");
  process.exit(1);
}

for (const check of [
  ["npm", ["run", "smoke"]],
  ["npm", ["run", "gate"]],
  ["node", ["scripts/integration-check.mjs"]],
  ["node", ["scripts/proof-layer-app.mjs"]]
]) {
  const [cmd, args] = check;
  const result = run(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const statusAfter = run("git", ["status", "--short"]);
if (statusAfter.status !== 0) {
  process.stderr.write(statusAfter.stderr || "git status failed after checks\n");
  process.exit(statusAfter.status ?? 1);
}
if ((statusAfter.stdout || "").trim().length > 0) {
  console.error("[release:check] FAIL: checks must leave repo clean");
  process.stdout.write(statusAfter.stdout || "");
  process.exit(1);
}

const hash = run("git", ["rev-parse", "--short", "HEAD"]);
if (hash.status !== 0) {
  process.stderr.write(hash.stderr || "git rev-parse failed\n");
  process.exit(hash.status ?? 1);
}

console.log(`[release:check] commit ${String(hash.stdout).trim()}`);
console.log("[release:check] PASS");
