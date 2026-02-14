import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { readVersionStamp } from "./version-stamp.mjs";

const RELEASE_DIR = join(process.cwd(), "dist", "rc0");
const DRY_MANIFEST_PATH = join(RELEASE_DIR, "release-manifest.json");
const FINAL_MANIFEST_PATH = join(RELEASE_DIR, "release-manifest.final.json");
const FINAL_CONTRACT_PATH = join(process.cwd(), "apps", "layer0-hub", "fixtures", "rc0-release-final-contract.json");

function fail(message) {
  console.error(`[rc0-finalize] FAIL: ${message}`);
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
    fail(stderr.length > 0 ? stderr : `${command} failed`);
  }
  return String(result.stdout || "").trim();
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function validateManifestContract(manifest) {
  const contract = JSON.parse(readFileSync(FINAL_CONTRACT_PATH, "utf-8"));
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

function main() {
  run("npm", ["run", "rc0-release"]);
  run("node", ["scripts/rc0-tag.mjs", "--verify"]);

  const versionStamp = readVersionStamp();
  const tagName = `layer0-hub-${versionStamp.contractVersion}`;
  const dryManifest = JSON.parse(readFileSync(DRY_MANIFEST_PATH, "utf-8"));
  const tagTarget = runCapture("git", ["rev-list", "-n", "1", tagName]);

  const finalManifest = {
    ...dryManifest,
    release_kind: "final",
    rc0_tag: tagName,
    rc0_tag_target_commit: tagTarget
  };

  finalManifest.manifest_digest = sha256(
    stableStringify({
      contractVersion: finalManifest.contract_version,
      layer0Version: finalManifest.layer0_version,
      releaseChannel: finalManifest.release_channel,
      releaseKind: finalManifest.release_kind,
      commit: finalManifest.commit,
      files: finalManifest.files,
      scopeHash: finalManifest.control_plane_scope_sha256,
      scopeAckHash: finalManifest.control_plane_scope_ack_sha256,
      operatorContractDefinitionHash: finalManifest.operator_contract_definition_sha256,
      versionStampHash: finalManifest.version_stamp_sha256,
      rc0Tag: finalManifest.rc0_tag,
      rc0TagTargetCommit: finalManifest.rc0_tag_target_commit
    })
  );

  validateManifestContract(finalManifest);
  writeFileSync(FINAL_MANIFEST_PATH, JSON.stringify(finalManifest, null, 2) + "\n");

  console.log("[rc0-finalize] manifest dist/rc0/release-manifest.final.json");
  console.log("[rc0-finalize] PASS");
}

main();
