import { isScopeAcknowledged } from "./scope-governance-check.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

try {
  const scopeConfig = {
    include: ["scripts", "apps/layer0-hub"],
    exclude: ["apps/layer0-hub/src/domain/musicEngineContracts.ts"],
    frozenLegacyDeny: ["apps/layer0-hub/src/domain/musicEngineContracts.ts"]
  };

  const acknowledged = isScopeAcknowledged(scopeConfig, {
    scopeConfigSha256: "1546c9ca2947c820dcf83491c4a9f222ff62ba1ff943455350dd3530272c65ac"
  });
  assert(acknowledged.acknowledged, "acknowledged_scope_should_pass");

  const unacknowledged = isScopeAcknowledged(scopeConfig, {
    scopeConfigSha256: "not-the-right-hash"
  });
  assert(!unacknowledged.acknowledged, "unacknowledged_scope_should_fail");

  console.log("[scope-governance-proof] PASS");
} catch (error) {
  console.error(`[scope-governance-proof] FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
