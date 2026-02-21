/**
 * Run ADT-lib drum engine on drums audio. Output MIDIs are named with _adtlib so you can tell which set is which.
 * Uses .venv-drum-pack if present (ADTLib + madmom + tensorflow), else .venv.
 * @param {string} audioPath - Path to drums audio file.
 * @param {{ outputDir?: string }} [options] - Optional output directory.
 * @returns {Promise<{ drums_kick: string, drums_snare: string, drums_tops: string, drums_perc: string }>}
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname ?? import.meta.path, "..");
const SCRIPT = join(REPO_ROOT, "scripts", "adtlib_drum_engine.py");
const VENV_DRUM_PACK = join(REPO_ROOT, ".venv-drum-pack", "bin", "python3");
const VENV_DEFAULT = join(REPO_ROOT, ".venv", "bin", "python3");

function getPython() {
  if (existsSync(VENV_DRUM_PACK)) return VENV_DRUM_PACK;
  if (existsSync(VENV_DEFAULT)) return VENV_DEFAULT;
  return "python3";
}

export function runAdtlibDrumEngine(audioPath, options = {}) {
  if (typeof audioPath !== "string" || !audioPath.trim()) {
    return Promise.reject(new Error("audioPath must be a non-empty string"));
  }
  const path = audioPath.startsWith("/") ? audioPath : join(REPO_ROOT, audioPath);
  if (!existsSync(path)) {
    return Promise.reject(new Error(`audioPath does not exist: ${path}`));
  }
  const input = JSON.stringify({
    audioPath: path,
    ...(options.outputDir && { outputDir: options.outputDir }),
  });
  const python = getPython();
  const result = spawnSync(python, [SCRIPT], {
    cwd: REPO_ROOT,
    input,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
    timeout: 300000,
  });
  if (result.status !== 0) {
    let errMsg = "adtlib_drum_engine.py failed";
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
    return Promise.reject(new Error(`adtlib_drum_engine.py invalid stdout: ${e.message}`));
  }
}
