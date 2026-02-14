import { spawnSync } from "node:child_process";
import { readVersionStamp } from "./version-stamp.mjs";

function fail(message) {
  console.error(`[rc0-tag] FAIL: ${message}`);
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runCapture(command, args) {
  const result = spawnSync(command, args, { stdio: "pipe", shell: false, encoding: "utf-8" });
  if (result.status !== 0) {
    const stderr = String(result.stderr || "").trim();
    return { ok: false, stdout: "", stderr };
  }
  return { ok: true, stdout: String(result.stdout || "").trim(), stderr: "" };
}

function main() {
  run("npm", ["run", "rc0-release"]);

  const versionStamp = readVersionStamp();
  const tagName = `layer0-hub-${versionStamp.contractVersion}`;
  const head = runCapture("git", ["rev-parse", "HEAD"]);
  if (!head.ok) fail("rc0_tag_head_unavailable");

  const tagHead = runCapture("git", ["rev-list", "-n", "1", tagName]);
  if (!tagHead.ok || tagHead.stdout.length === 0) {
    if (process.argv.includes("--verify")) {
      fail(`rc0_tag_missing:${tagName}`);
    }
    console.log("[rc0-tag] PASS: rc0_tag_missing");
    console.log(`[rc0-tag] run: git tag ${tagName} ${head.stdout}`);
    return;
  }

  if (tagHead.stdout !== head.stdout) {
    fail(`rc0_tag_exists_wrong_target:${tagName}:${tagHead.stdout}`);
  }

  console.log(`[rc0-tag] PASS: ${tagName}@${head.stdout}`);
}

main();
