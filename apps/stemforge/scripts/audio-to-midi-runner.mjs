/**
 * Node runner for scripts/audio_to_midi.py (FOSS stack contract).
 * Spawns Python with optional venv; returns parsed JSON result or throws.
 * See docs/FOSS_AND_LOCAL_LLM_STACK.md
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname ?? import.meta.path, "..");
const SCRIPT = join(REPO_ROOT, "scripts", "audio_to_midi.py");
const VENV_PYTHON = join(REPO_ROOT, ".venv", "bin", "python3");

/**
 * Resolve Python executable: use .venv if present, else python3 from PATH.
 */
function getPython() {
  if (existsSync(VENV_PYTHON)) return VENV_PYTHON;
  return "python3";
}

/**
 * Run audio_to_midi.py with JSON input { audioPath }.
 * @param {string} audioPath - Absolute or relative path to WAV/AIFF (or other supported audio).
 * @param {{ outputPath?: string }} [options] - Optional outputPath for MIDI file.
 * @returns {Promise<{ midiPath: string, noteCount: number, pitchRange: [number, number], duration: number }>}
 * @throws {Error} on missing file, spawn failure, or script error (stderr JSON).
 */
export function runAudioToMidi(audioPath, options = {}) {
  if (typeof audioPath !== "string" || !audioPath.trim()) {
    return Promise.reject(new Error("audioPath must be a non-empty string"));
  }
  const path = audioPath.startsWith("/") ? audioPath : join(REPO_ROOT, audioPath);
  if (!existsSync(path)) {
    return Promise.reject(new Error(`audioPath does not exist: ${path}`));
  }
  const input = JSON.stringify({
    audioPath: path,
    ...(options.outputPath && { outputPath: options.outputPath }),
  });
  const python = getPython();
  const result = spawnSync(python, [SCRIPT], {
    cwd: REPO_ROOT,
    input: input,
    encoding: "utf-8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    let errMsg = "audio_to_midi.py failed";
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
  if (!out.midiPath || typeof out.noteCount !== "number" || !Array.isArray(out.pitchRange) || typeof out.duration !== "number") {
    return Promise.reject(new Error(`Script output missing required keys: ${JSON.stringify(out)}`));
  }
  return Promise.resolve(out);
}
