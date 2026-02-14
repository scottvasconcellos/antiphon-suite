import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

export function isScopeAcknowledged(scopeConfig, ack) {
  const scopeHash = sha256(stableStringify(scopeConfig));
  const ackHash = String(ack.scopeConfigSha256 || "");
  return { acknowledged: scopeHash === ackHash, scopeHash, ackHash };
}

export function runScopeGovernanceCheck() {
  const scopePath = join(process.cwd(), "control-plane.scope.json");
  const ackPath = join(process.cwd(), "control-plane.scope.ack.json");

  const scopeConfig = readJson(scopePath);
  const ack = readJson(ackPath);

  const result = isScopeAcknowledged(scopeConfig, ack);

  if (!result.acknowledged) {
    console.error("[scope-governance-check] FAIL: scope_config_changed_unacknowledged");
    console.error(`[scope-governance-check] expected ${result.scopeHash}`);
    console.error(`[scope-governance-check] acknowledged ${result.ackHash}`);
    process.exit(1);
  }

  console.log("[scope-governance-check] PASS");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runScopeGovernanceCheck();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[scope-governance-check] FAIL: ${message}`);
    process.exit(1);
  }
}
