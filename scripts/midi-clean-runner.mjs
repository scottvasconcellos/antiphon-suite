/**
 * Node runner for scripts/midi_clean.py (FOSS stack contract).
 * Spawns Python with optional venv; returns parsed JSON result or throws.
 * See docs/FOSS_AND_LOCAL_LLM_STACK.md
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname ?? import.meta.path, "..");
const SCRIPT = join(REPO_ROOT, "scripts", "midi_clean.py");
const VENV_PYTHON = join(REPO_ROOT, ".venv", "bin", "python3");

function getPython() {
  if (existsSync(VENV_PYTHON)) return VENV_PYTHON;
  return "python3";
}

/**
 * Run midi_clean.py with JSON input { midiPath [, outputPath ] }.
 * @param {string} midiPath - Absolute or relative path to MIDI file.
 * @param {{ outputPath?: string }} [options] - Optional output path for cleaned MIDI.
 * @returns {Promise<{ cleanedMidiPath: string, stats: { noteCount: number, trackCount: number, duration: number, pitchRange: [number, number] } }>}
 * @throws {Error} on missing file, spawn failure, or script error (stderr JSON).
 */
export function runMidiClean(midiPath, options = {}) {
  if (typeof midiPath !== "string" || !midiPath.trim()) {
    return Promise.reject(new Error("midiPath must be a non-empty string"));
  }
  const path = midiPath.startsWith("/") ? midiPath : join(REPO_ROOT, midiPath);
  if (!existsSync(path)) {
    return Promise.reject(new Error(`midiPath does not exist: ${path}`));
  }
  const input = JSON.stringify({
    midiPath: path,
    ...(options.outputPath && { outputPath: options.outputPath }),
  });
  const python = getPython();
  const result = spawnSync(python, [SCRIPT], {
    cwd: REPO_ROOT,
    input: input,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) {
    let errMsg = "midi_clean.py failed";
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
  if (!out.cleanedMidiPath || !out.stats || typeof out.stats.noteCount !== "number") {
    return Promise.reject(new Error(`Script output missing required keys: ${JSON.stringify(out)}`));
  }
  return Promise.resolve(out);
}
