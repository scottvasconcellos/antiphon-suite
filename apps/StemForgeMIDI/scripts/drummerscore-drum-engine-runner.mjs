/**
 * Convert a DrummerScore output MIDI into our four role MIDIs with _drummerscore in the name.
 * DrummerScore is notebook-based: run their main.ipynb on your drum stem to get a MIDI, then pass midiPath here.
 * @param {string} midiPath - Path to the MIDI file produced by DrummerScore (e.g. from main.ipynb).
 * @param {{ outputDir?: string, audioPath?: string }} [options] - Optional output dir and source audio (for duration/tempo).
 * @returns {Promise<{ drums_kick: string, drums_snare: string, drums_tops: string, drums_perc: string }>}
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname ?? import.meta.path, "..");
const SCRIPT = join(REPO_ROOT, "scripts", "drummerscore_drum_engine.py");
const VENV_PYTHON = join(REPO_ROOT, ".venv", "bin", "python3");

function getPython() {
  if (existsSync(VENV_PYTHON)) return VENV_PYTHON;
  return "python3";
}

export function runDrummerScoreDrumEngine(midiPath, options = {}) {
  if (typeof midiPath !== "string" || !midiPath.trim()) {
    return Promise.reject(new Error("midiPath must be a non-empty string (path to MIDI from DrummerScore main.ipynb)"));
  }
  const path = midiPath.startsWith("/") ? midiPath : join(REPO_ROOT, midiPath);
  if (!existsSync(path)) {
    return Promise.reject(new Error(`midiPath does not exist: ${path}`));
  }
  const input = JSON.stringify({
    midiPath: path,
    ...(options.outputDir && { outputDir: options.outputDir }),
    ...(options.audioPath && { audioPath: options.audioPath }),
  });
  const python = getPython();
  const result = spawnSync(python, [SCRIPT], {
    cwd: REPO_ROOT,
    input,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) {
    let errMsg = "drummerscore_drum_engine.py failed";
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
    return Promise.reject(new Error(errMsg));
  }
  try {
    const out = JSON.parse(result.stdout.trim());
    return Promise.resolve({
      drums_kick: out.drums_kick,
      drums_snare: out.drums_snare,
      drums_tops: out.drums_tops,
      drums_perc: out.drums_perc,
    });
  } catch (e) {
    return Promise.reject(new Error(`drummerscore_drum_engine.py invalid stdout: ${e.message}`));
  }
}
