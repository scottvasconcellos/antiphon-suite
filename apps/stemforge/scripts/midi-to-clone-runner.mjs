/**
 * Node runner for scripts/midi_to_clone.py (FOSS stack contract).
 * See docs/FOSS_AND_LOCAL_LLM_STACK.md
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname ?? import.meta.path, "..");
const SCRIPT = join(REPO_ROOT, "scripts", "midi_to_clone.py");
const VENV_CLONE = join(REPO_ROOT, ".venv-clone", "bin", "python3");
const VENV_DEFAULT = join(REPO_ROOT, ".venv", "bin", "python3");

function getPython() {
  if (existsSync(VENV_CLONE)) return VENV_CLONE;
  if (existsSync(VENV_DEFAULT)) return VENV_DEFAULT;
  return "python3";
}

/**
 * Run midi_to_clone.py with JSON input { midiPath, modelId, refAudioPath? }.
 * @param {string} midiPath
 * @param {string} modelId
 * @param {{ refAudioPath?: string }} [options]
 * @returns {Promise<{ clonePath: string }>}
 */
export function runMidiToClone(midiPath, modelId, options = {}) {
  if (typeof midiPath !== "string" || !midiPath.trim()) {
    return Promise.reject(new Error("midiPath must be a non-empty string"));
  }
  if (typeof modelId !== "string" || !modelId.trim()) {
    return Promise.reject(new Error("modelId must be a non-empty string"));
  }
  const input = JSON.stringify({
    midiPath: midiPath.startsWith("/") ? midiPath : join(REPO_ROOT, midiPath),
    modelId,
    ...(options.refAudioPath && { refAudioPath: options.refAudioPath }),
  });
  const python = getPython();
  const result = spawnSync(python, [SCRIPT], {
    cwd: REPO_ROOT,
    input: input,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) {
    let errMsg = "midi_to_clone.py failed";
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
  if (!out.clonePath || typeof out.clonePath !== "string") {
    return Promise.reject(new Error(`Script output missing clonePath: ${JSON.stringify(out)}`));
  }
  return Promise.resolve(out);
}
