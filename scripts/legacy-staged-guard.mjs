import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

function loadScopeConfig() {
  const raw = readFileSync(join(process.cwd(), "control-plane.scope.json"), "utf-8");
  const parsed = JSON.parse(raw);
  const frozenLegacy = Array.isArray(parsed.frozenLegacyDeny) ? parsed.frozenLegacyDeny : [];
  return frozenLegacy.sort((a, b) => a.localeCompare(b));
}

function matchesPattern(filePath, pattern) {
  if (!pattern.includes("*")) {
    return filePath === pattern;
  }
  const escapedParts = pattern
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`^${escapedParts.join(".*")}$`).test(filePath);
}

export function findForbiddenStagedPaths(stagedPaths, forbiddenPatterns) {
  return stagedPaths
    .filter((filePath) => forbiddenPatterns.some((pattern) => matchesPattern(filePath, pattern)))
    .sort((a, b) => a.localeCompare(b));
}

function getStagedPaths() {
  const result = spawnSync("git", ["diff", "--cached", "--name-only"], {
    stdio: "pipe",
    shell: false,
    encoding: "utf-8"
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    throw new Error(stderr.length > 0 ? stderr : "git_diff_cached_failed");
  }
  return String(result.stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .sort((a, b) => a.localeCompare(b));
}

export function runLegacyStagedGuard() {
  const staged = getStagedPaths();
  const forbiddenPatterns = loadScopeConfig();
  const offenders = findForbiddenStagedPaths(staged, forbiddenPatterns);

  if (offenders.length > 0) {
    console.error("[legacy-staged-guard] FAIL: legacy_staged_forbidden");
    for (const filePath of offenders) {
      console.error(`[legacy-staged-guard] staged ${filePath}`);
    }
    process.exit(1);
  }

  console.log("[legacy-staged-guard] PASS");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runLegacyStagedGuard();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[legacy-staged-guard] FAIL: ${message}`);
    process.exit(1);
  }
}
