/**
 * Normalize a stem (or any audio) to 48 kHz mono 16-bit WAV via ffmpeg.
 * STEM Forge engine: ensures uniform format for downstream (Basic Pitch, MIR, etc.).
 * Usage: node scripts/ffmpeg-normalize.mjs <inputPath> [outputPath] [--rate 48000] [--bits 16]
 * Output path defaults to <inputPath> with _normalized.wav suffix in same dir.
 * See docs/FOSS_AND_LOCAL_LLM_STACK.md (ffmpeg).
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname ?? import.meta.path, "..");

function parseArgs() {
  const args = process.argv.slice(2);
  let inputPath = null;
  let outputPath = null;
  let sampleRate = 48000;
  let bitDepth = 16;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--rate" && i + 1 < args.length) {
      sampleRate = parseInt(args[++i], 10) || 48000;
    } else if (args[i] === "--bits" && i + 1 < args.length) {
      bitDepth = parseInt(args[++i], 10) || 16;
    } else if (!inputPath) {
      inputPath = args[i];
    } else if (!outputPath) {
      outputPath = args[i];
    }
  }
  if (!inputPath) return null;
  const inAbs = inputPath.startsWith("/") ? inputPath : join(REPO_ROOT, inputPath);
  if (!existsSync(inAbs)) throw new Error(`Input does not exist: ${inAbs}`);
  let outAbs = outputPath
    ? (outputPath.startsWith("/") ? outputPath : join(REPO_ROOT, outputPath))
    : inAbs.replace(/\.[^.]+$/i, "_normalized.wav");
  return { inputPath: inAbs, outputPath: outAbs, sampleRate, bitDepth };
}

/**
 * Run ffmpeg to convert to WAV. Format: -ar sampleRate -ac 1 -sample_fmt s16 (or s32 for 24/32).
 * @param {{ inputPath: string, outputPath: string, sampleRate: number, bitDepth: number }} opts
 * @returns {Promise<{ outputPath: string }>}
 */
export function normalizeStem(opts) {
  const { inputPath, outputPath, sampleRate, bitDepth } = opts;
  const sampleFmt = bitDepth <= 16 ? "s16" : "s32";
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i", inputPath,
      "-ar", String(sampleRate),
      "-ac", "1",
      "-sample_fmt", sampleFmt,
      outputPath,
    ],
    { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim().slice(-500);
    return Promise.reject(new Error(`ffmpeg failed: ${err}`));
  }
  if (!existsSync(outputPath)) return Promise.reject(new Error("ffmpeg did not produce output file"));
  return Promise.resolve({ outputPath });
}

async function main() {
  const opts = parseArgs();
  if (!opts) {
    console.error("Usage: node scripts/ffmpeg-normalize.mjs <inputPath> [outputPath] [--rate 48000] [--bits 16]");
    process.exit(1);
  }
  try {
    const out = await normalizeStem(opts);
    console.log(JSON.stringify(out));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

// Run when executed as script
if (process.argv[1]?.includes("ffmpeg-normalize")) {
  main();
}
