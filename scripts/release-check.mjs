import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "pipe", shell: false, encoding: "utf-8", ...options });
  return result;
}

const dryRun = run("npm", ["run", "rc0-release"], { stdio: "inherit" });
if (dryRun.status !== 0) {
  process.exit(dryRun.status ?? 1);
}

const hash = run("git", ["rev-parse", "--short", "HEAD"]);
if (hash.status !== 0) {
  process.stderr.write(hash.stderr || "git rev-parse failed\n");
  process.exit(hash.status ?? 1);
}

console.log(`[release:check] commit ${String(hash.stdout).trim()}`);
console.log("[release:check] PASS");
