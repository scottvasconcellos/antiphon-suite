#!/usr/bin/env node
/**
 * Run in-app drum engine on a drums WAV (Librosa + cross-referenced classifiers).
 * Usage: node scripts/run_drum_engine.mjs <path-to-drums.wav> [output-dir]
 * Output: four MIDI files (drums_kick, drums_snare, drums_tops, drums_perc), same length as audio.
 */

import { runBasicDrumEngine } from "./basic-drum-engine-runner.mjs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname ?? import.meta.path, "..");

async function main() {
  const audioPath = process.argv[2];
  const outputDir = process.argv[3] || join(REPO_ROOT, ".tmp-drum-test");
  if (!audioPath) {
    console.error("Usage: node scripts/run_drum_engine.mjs <path-to-drums.wav> [output-dir]");
    process.exit(1);
  }

  const result = await runBasicDrumEngine(audioPath, { outputDir });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
