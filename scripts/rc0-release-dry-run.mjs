import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { readVersionStamp } from "./version-stamp.mjs";

const RELEASE_DIR = join(process.cwd(), "dist", "rc0");
const MANIFEST_PATH = join(RELEASE_DIR, "release-manifest.json");
const RELEASE_CONTRACT_PATH = join(process.cwd(), "apps", "layer0-hub", "fixtures", "rc0-release-contract.json");
const OPERATOR_CONTRACT_DEF_PATH = join(process.cwd(), "apps", "layer0-hub", "fixtures", "operator-contract-definition.json");
const VERSION_STAMP_PATH = join(process.cwd(), "apps", "layer0-hub", "fixtures", "version.json");
const SCOPE_PATH = join(process.cwd(), "control-plane.scope.json");
const SCOPE_ACK_PATH = join(process.cwd(), "control-plane.scope.ack.json");

function fail(message) {
  console.error(`[rc0-release] FAIL: ${message}`);
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
    const stderr = (result.stderr || "").trim();
    fail(stderr.length > 0 ? stderr : `${command} failed`);
  }
  return String(result.stdout || "").trim();
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function fileHash(path) {
  return sha256(readFileSync(path));
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function validateManifestContract(manifest) {
  const contract = JSON.parse(readFileSync(RELEASE_CONTRACT_PATH, "utf-8"));
  const keys = Object.keys(manifest).sort((a, b) => a.localeCompare(b));
  for (const required of contract.required_keys) {
    if (!Object.prototype.hasOwnProperty.call(manifest, required)) {
      fail(`rc0_release_contract_violation:missing_key:${required}`);
    }
  }
  for (const key of keys) {
    if (!contract.allowed_keys.includes(key)) {
      fail(`rc0_release_contract_violation:unexpected_key:${key}`);
    }
  }
  if (manifest.contract_version !== contract.contract_version) {
    fail("rc0_release_contract_violation:bad_contract_version");
  }
}

function buildManifest() {
  const versionStamp = readVersionStamp();
  const commit = runCapture("git", ["rev-parse", "HEAD"]);

  const includePaths = [
    "CHANGELOG.md",
    "README.md",
    "RELEASE_NOTES_RC0.md",
    "control-plane.scope.json",
    "control-plane.scope.ack.json",
    "apps/layer0-hub/fixtures/operator-contract-definition.json",
    "apps/layer0-hub/fixtures/operator-contract-lock-snapshots.json",
    "apps/layer0-hub/fixtures/rc0-release-contract.json",
    "apps/layer0-hub/fixtures/version.json",
    "scripts/rc0-release-dry-run.mjs",
    "scripts/rc0-tag.mjs",
    "scripts/version-stamp.mjs",
    "scripts/operator-contract-check.mjs",
    "scripts/gate.mjs",
    "scripts/rc-check.mjs"
  ].sort((a, b) => a.localeCompare(b));

  for (const path of includePaths) {
    statSync(join(process.cwd(), path));
  }

  const files = includePaths.map((path) => ({ path, sha256: fileHash(join(process.cwd(), path)) }));
  const scopeHash = fileHash(SCOPE_PATH);
  const scopeAckHash = fileHash(SCOPE_ACK_PATH);
  const operatorContractDefinitionHash = fileHash(OPERATOR_CONTRACT_DEF_PATH);
  const versionStampHash = fileHash(VERSION_STAMP_PATH);

  const manifest = {
    contract_version: versionStamp.contractVersion,
    layer0_version: versionStamp.layer0Version,
    release_channel: versionStamp.releaseChannel,
    release_kind: "dry-run",
    commit,
    files,
    control_plane_scope_sha256: scopeHash,
    control_plane_scope_ack_sha256: scopeAckHash,
    operator_contract_definition_sha256: operatorContractDefinitionHash,
    version_stamp_sha256: versionStampHash,
    manifest_digest: sha256(
      stableStringify({
        contractVersion: versionStamp.contractVersion,
        layer0Version: versionStamp.layer0Version,
        releaseChannel: versionStamp.releaseChannel,
        commit,
        files,
        scopeHash,
        scopeAckHash,
        operatorContractDefinitionHash,
        versionStampHash
      })
    )
  };

  validateManifestContract(manifest);
  return manifest;
}

function writeReleaseOutput(manifest) {
  rmSync(RELEASE_DIR, { recursive: true, force: true });
  mkdirSync(RELEASE_DIR, { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

function main() {
  run("npm", ["run", "rc-check"]);
  run("npm", ["run", "gate"]);
  run("node", ["scripts/operator-contract-check.mjs"]);

  const manifest = buildManifest();
  writeReleaseOutput(manifest);

  const outputPath = relative(process.cwd(), MANIFEST_PATH);
  console.log(`[rc0-release] manifest ${outputPath}`);
  console.log("[rc0-release] PASS");
}

main();
