import { writeFileSync, unlinkSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { getScopedDirtyPaths } from "./scope-clean-check.mjs";

function ensureDir(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const outsideScopeFile = "docs/_quarantine/rc-scope-proof.tmp";
const insideScopeFile = "scripts/.rc-scope-proof.tmp";

try {
  ensureDir(outsideScopeFile);
  ensureDir(insideScopeFile);

  writeFileSync(outsideScopeFile, "proof-outside-scope\n", "utf-8");
  let paths = getScopedDirtyPaths();
  assert(!paths.includes(outsideScopeFile), "outside_scope_should_be_ignored");

  writeFileSync(insideScopeFile, "proof-inside-scope\n", "utf-8");
  paths = getScopedDirtyPaths();
  assert(paths.includes(insideScopeFile), "inside_scope_should_fail");

  console.log("[rc-scope-proof] PASS");
} catch (error) {
  console.error(`[rc-scope-proof] FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
} finally {
  if (existsSync(insideScopeFile)) {
    unlinkSync(insideScopeFile);
  }
  if (existsSync(outsideScopeFile)) {
    unlinkSync(outsideScopeFile);
  }
}
