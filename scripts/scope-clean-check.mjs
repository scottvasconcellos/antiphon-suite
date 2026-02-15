import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

function loadScopeConfig() {
  const raw = readFileSync(join(process.cwd(), "control-plane.scope.json"), "utf-8");
  const parsed = JSON.parse(raw);
  const include = Array.isArray(parsed.include) ? [...parsed.include] : [];
  const exclude = Array.isArray(parsed.exclude) ? [...parsed.exclude] : [];
  return {
    include: include.sort((a, b) => a.localeCompare(b)),
    exclude: exclude.sort((a, b) => a.localeCompare(b))
  };
}

function buildPathspecArgs(scope) {
  const args = [...scope.include];
  for (const pattern of scope.exclude) {
    args.push(`:(exclude)${pattern}`);
  }
  return args;
}

function parsePorcelain(output) {
  const lines = String(output || "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  const paths = lines
    .map((line) => {
      if (line.startsWith("R ") || line.startsWith("R")) {
        const arrowIndex = line.indexOf(" -> ");
        if (arrowIndex >= 0) {
          return line.slice(arrowIndex + 4).trim();
        }
      }
      return line.slice(3).trim();
    })
    .filter((path) => path.length > 0)
    .sort((a, b) => a.localeCompare(b));

  return { lines, paths };
}

export function getScopedDirtyPaths() {
  const scope = loadScopeConfig();
  const pathspec = buildPathspecArgs(scope);
  const result = spawnSync(
    "git",
    ["status", "--porcelain", "--untracked-files=all", "--", ...pathspec],
    { stdio: "pipe", shell: false, encoding: "utf-8" }
  );

  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    throw new Error(stderr.length > 0 ? stderr : "git_status_failed");
  }

  const parsed = parsePorcelain(result.stdout);
  return parsed.paths;
}

export function runScopeCleanCheck() {
  const paths = getScopedDirtyPaths();
  if (paths.length > 0) {
    console.error("[scope-clean-check] FAIL: repo_scope_not_clean");
    for (const filePath of paths) {
      console.error(`[scope-clean-check] dirty ${filePath}`);
    }
    process.exit(1);
  }

  console.log("[scope-clean-check] PASS");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runScopeCleanCheck();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[scope-clean-check] FAIL: ${message}`);
    process.exit(1);
  }
}
