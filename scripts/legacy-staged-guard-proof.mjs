import { findForbiddenStagedPaths } from "./legacy-staged-guard.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

try {
  const patterns = [
    "apps/layer0-hub/src/domain/musicEngineContracts.ts",
    "apps/layer0-hub/src/domain/musicIntelligenceEngine.ts",
    "apps/layer0-hub/fixtures/music-*.json"
  ];

  const outsideOnly = findForbiddenStagedPaths(
    ["scripts/rc-check.mjs", "apps/layer0-hub/src/services/launchTokenBoundary.ts"],
    patterns
  );
  assert(outsideOnly.length === 0, "outside_scope_should_pass");

  const withForbidden = findForbiddenStagedPaths(
    ["scripts/rc-check.mjs", "apps/layer0-hub/src/domain/musicEngineContracts.ts"],
    patterns
  );
  assert(withForbidden.length === 1, "forbidden_stage_should_fail");
  assert(withForbidden[0] === "apps/layer0-hub/src/domain/musicEngineContracts.ts", "wrong_forbidden_path");

  console.log("[legacy-staged-guard-proof] PASS");
} catch (error) {
  console.error(`[legacy-staged-guard-proof] FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
