#!/usr/bin/env node
/**
 * Smoke test for STEM Forge pipeline: create a minimal WAV, run pipeline (no --router, --clone),
 * assert JSON shape and no crash. Run from repo root: pnpm run stem-forge:smoke
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const REPO_ROOT = join(import.meta.dirname ?? import.meta.path, "..");
const PIPELINE_SCRIPT = join(REPO_ROOT, "scripts", "run-stem-pipeline.mjs");

function makeMinimalWav(sampleRate = 48000, durationSec = 0.1) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2; // 16-bit
  const buffer = Buffer.alloc(44 + dataSize);
  let off = 0;
  buffer.write("RIFF", off); off += 4;
  buffer.writeUInt32LE(36 + dataSize, off); off += 4;
  buffer.write("WAVE", off); off += 4;
  buffer.write("fmt ", off); off += 4;
  buffer.writeUInt32LE(16, off); off += 4; // chunk size
  buffer.writeUInt16LE(1, off); off += 2;  // PCM
  buffer.writeUInt16LE(1, off); off += 2;  // mono
  buffer.writeUInt32LE(sampleRate, off); off += 4;
  buffer.writeUInt32LE(sampleRate * 2, off); off += 4; // byte rate
  buffer.writeUInt16LE(2, off); off += 2;  // block align
  buffer.writeUInt16LE(16, off); off += 2; // bits per sample
  buffer.write("data", off); off += 4;
  buffer.writeUInt32LE(dataSize, off); off += 4;
  return buffer;
}

function main() {
  const tmpDir = mkdtempSync(join(tmpdir(), "stem-forge-smoke-"));
  const wavPath = join(tmpDir, "smoke.wav");
  writeFileSync(wavPath, makeMinimalWav());

  const result = spawnSync(
    "node",
    [PIPELINE_SCRIPT, "--stems", wavPath],
    { cwd: REPO_ROOT, encoding: "utf-8", maxBuffer: 5 * 1024 * 1024 }
  );

  rmSync(tmpDir, { recursive: true, force: true });

  if (result.error) {
    console.error("Pipeline spawn failed:", result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error("Pipeline exited non-zero:", result.status);
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }

  let summary;
  try {
    summary = JSON.parse(result.stdout.trim());
  } catch (e) {
    console.error("Pipeline did not output valid JSON:", e.message);
    console.error(result.stdout?.slice(-500));
    process.exit(1);
  }

  if (!Array.isArray(summary.stems) || summary.stems.length === 0) {
    console.error("Expected summary.stems to be a non-empty array");
    process.exit(1);
  }
  const first = summary.stems[0];
  if (!first.path || (first.midiPath === undefined && first.error === undefined)) {
    console.error("Expected stems[0] to have path and (midiPath or error)");
    process.exit(1);
  }

  console.log("stem-forge pipeline smoke: OK (stems:", summary.stems.length, ", first:", first.midiPath ? "midiPath" : "error", ")");
}

main();
