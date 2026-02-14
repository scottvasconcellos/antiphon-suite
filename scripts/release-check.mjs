import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "pipe", shell: false, encoding: "utf-8", ...options });
  return result;
}

for (const check of [
  ["npm", ["run", "rc-check"]],
  ["npm", ["run", "smoke"]],
  ["npm", ["run", "gate"]],
  ["node", ["scripts/operator-contract-check.mjs"]],
  ["npm", ["run", "rc0-release"]]
]) {
  const [cmd, args] = check;
  const result = run(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const hash = run("git", ["rev-parse", "--short", "HEAD"]);
if (hash.status !== 0) {
  process.stderr.write(hash.stderr || "git rev-parse failed\n");
  process.exit(hash.status ?? 1);
}

console.log(`[release:check] commit ${String(hash.stdout).trim()}`);
console.log("[release:check] PASS");
