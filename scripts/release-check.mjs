import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "pipe", shell: false, encoding: "utf-8", ...options });
  return result;
}

const gate = run("npm", ["run", "gate"], { stdio: "inherit" });
if (gate.status !== 0) {
  process.exit(gate.status ?? 1);
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

const hash = run("git", ["rev-parse", "--short", "HEAD"]);
if (hash.status !== 0) {
  process.stderr.write(hash.stderr || "git rev-parse failed\n");
  process.exit(hash.status ?? 1);
}

console.log(`[release:check] commit ${String(hash.stdout).trim()}`);
console.log("[release:check] PASS");
