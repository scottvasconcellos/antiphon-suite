/**
 * Node runner for scripts/mir_compare.py (FOSS stack contract).
 * See docs/FOSS_AND_LOCAL_LLM_STACK.md
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname ?? import.meta.path, "..");
const SCRIPT = join(REPO_ROOT, "scripts", "mir_compare.py");
const VENV_MIR = join(REPO_ROOT, ".venv-mir", "bin", "python3");
const VENV_DEFAULT = join(REPO_ROOT, ".venv", "bin", "python3");

function getPython() {
  if (existsSync(VENV_MIR)) return VENV_MIR;
  if (existsSync(VENV_DEFAULT)) return VENV_DEFAULT;
  return "python3";
}

/**
 * Run mir_compare.py with JSON input { originalPath, clonePath }.
 * @param {string} originalPath - Path to original WAV
 * @param {string} clonePath - Path to clone WAV
 * @returns {Promise<{ metrics: { spectralCentroidDiff: number, loudnessDiff: number } }>}
 */
export function runMirCompare(originalPath, clonePath) {
  if (typeof originalPath !== "string" || !originalPath.trim()) {
    return Promise.reject(new Error("originalPath must be a non-empty string"));
  }
  if (typeof clonePath !== "string" || !clonePath.trim()) {
    return Promise.reject(new Error("clonePath must be a non-empty string"));
  }
  const orig = originalPath.startsWith("/") ? originalPath : join(REPO_ROOT, originalPath);
  const clone = clonePath.startsWith("/") ? clonePath : join(REPO_ROOT, clonePath);
  if (!existsSync(orig)) return Promise.reject(new Error(`originalPath does not exist: ${orig}`));
  if (!existsSync(clone)) return Promise.reject(new Error(`clonePath does not exist: ${clone}`));

  const input = JSON.stringify({ originalPath: orig, clonePath: clone });
  const python = getPython();
  const result = spawnSync(python, [SCRIPT], {
    cwd: REPO_ROOT,
    input: input,
    encoding: "utf-8",
    maxBuffer: 2 * 1024 * 1024,
  });
  if (result.status !== 0) {
    let errMsg = "mir_compare.py failed";
    if (result.stderr) {
      try {
        const line = result.stderr.trim().split("\n").filter(Boolean).pop();
        if (line) {
          const j = JSON.parse(line);
          if (j.error) errMsg = j.error;
        }
      } catch (_) {
        if (result.stderr.length < 500) errMsg = result.stderr.trim();
      }
    }
    if (result.error) errMsg = result.error.message;
    return Promise.reject(new Error(errMsg));
  }
  let out;
  try {
    out = JSON.parse(result.stdout.trim());
  } catch (e) {
    return Promise.reject(new Error(`Invalid JSON from script: ${result.stdout?.slice(0, 200)}`));
  }
  if (!out.metrics || typeof out.metrics !== "object") {
    return Promise.reject(new Error(`Script output missing metrics: ${JSON.stringify(out)}`));
  }
  return Promise.resolve(out);
}
