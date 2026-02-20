/**
 * Cut and merge audio via ffmpeg (STEM Forge engine).
 * Cut: extract [startSec, endSec] from one file.
 * Merge: concatenate multiple WAVs into one.
 * See docs/FOSS_AND_LOCAL_LLM_STACK.md (ffmpeg).
 */

import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const REPO_ROOT = join(import.meta.dirname ?? import.meta.path, "..");

/**
 * Cut a segment from an audio file.
 * @param {string} inputPath - Path to input audio (WAV preferred).
 * @param {string} outputPath - Path for output segment.
 * @param {number} startSec - Start time in seconds.
 * @param {number} endSec - End time in seconds (exclusive).
 * @returns {Promise<{ outputPath: string }>}
 */
export function cutStem(inputPath, outputPath, startSec, endSec) {
  const inAbs = inputPath.startsWith("/") ? inputPath : join(REPO_ROOT, inputPath);
  const outAbs = outputPath.startsWith("/") ? outputPath : join(REPO_ROOT, outputPath);
  if (!existsSync(inAbs)) return Promise.reject(new Error(`Input does not exist: ${inAbs}`));
  if (typeof startSec !== "number" || typeof endSec !== "number" || startSec < 0 || endSec <= startSec) {
    return Promise.reject(new Error("startSec and endSec must be numbers with 0 <= startSec < endSec"));
  }
  const result = spawnSync(
    "ffmpeg",
    ["-y", "-i", inAbs, "-ss", String(startSec), "-to", String(endSec), "-c", "copy", outAbs],
    { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim().slice(-500);
    return Promise.reject(new Error(`ffmpeg cut failed: ${err}`));
  }
  if (!existsSync(outAbs)) return Promise.reject(new Error("ffmpeg did not produce output file"));
  return Promise.resolve({ outputPath: outAbs });
}

/**
 * Merge multiple audio files into one (concat demuxer). All inputs should be same format (e.g. 48k mono WAV).
 * @param {string[]} inputPaths - Paths to input audio files (order preserved).
 * @param {string} outputPath - Path for merged output.
 * @returns {Promise<{ outputPath: string }>}
 */
export function mergeStems(inputPaths, outputPath) {
  if (!Array.isArray(inputPaths) || inputPaths.length === 0) {
    return Promise.reject(new Error("inputPaths must be a non-empty array"));
  }
  const absPaths = inputPaths.map((p) => (p.startsWith("/") ? p : join(REPO_ROOT, p)));
  for (const p of absPaths) {
    if (!existsSync(p)) return Promise.reject(new Error(`Input does not exist: ${p}`));
  }
  const outAbs = outputPath.startsWith("/") ? outputPath : join(REPO_ROOT, outputPath);
  const listPath = join(tmpdir(), `ffmpeg-concat-${Date.now()}.txt`);
  const listContent = absPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  writeFileSync(listPath, listContent, "utf8");
  try {
    const result = spawnSync(
      "ffmpeg",
      ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outAbs],
      { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
    );
    if (result.status !== 0) {
      const err = (result.stderr || result.stdout || "").trim().slice(-500);
      return Promise.reject(new Error(`ffmpeg merge failed: ${err}`));
    }
    if (!existsSync(outAbs)) return Promise.reject(new Error("ffmpeg did not produce output file"));
    return Promise.resolve({ outputPath: outAbs });
  } finally {
    try { unlinkSync(listPath); } catch (_) {}
  }
}
