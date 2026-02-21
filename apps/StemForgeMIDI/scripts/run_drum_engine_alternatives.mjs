#!/usr/bin/env node
/**
 * Run alternative drum engines on a drums stem so you can compare sets (ADT-lib, Omnizart).
 * Outputs are named so you can tell which set is which: *_adtlib_*, *_omnizart_*.
 *
 * Usage:
 *   node scripts/run_drum_engine_alternatives.mjs <path-to-drums.wav> [output-dir]
 *
 * For DrummerScore (notebook-based): run their main.ipynb to get a MIDI, then:
 *   node -e "import('./scripts/drummerscore-drum-engine-runner.mjs').then(m=>m.runDrummerScoreDrumEngine('path/to/output.mid',{outputDir:'./out'}).then(console.log))"
 */

import { runAdtlibDrumEngine } from "./adtlib-drum-engine-runner.mjs";
import { runAdvancedDrumEngine } from "./advanced-drum-engine-runner.mjs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname ?? import.meta.path, "..");

async function main() {
  const audioPath = process.argv[2];
  const outputDir = process.argv[3] || join(REPO_ROOT, ".tmp-drum-test");
  if (!audioPath) {
    console.error("Usage: node scripts/run_drum_engine_alternatives.mjs <path-to-drums.wav> [output-dir]");
    console.error("");
    console.error("Runs ADT-lib and Omnizart (if .venv-omnizart exists) on the stem.");
    console.error("Output files: *_adtlib_drums_*.mid, *_omnizart_drums_*.mid");
    process.exit(1);
  }

  console.log("Running ADT-lib...");
  try {
    const adt = await runAdtlibDrumEngine(audioPath, { outputDir });
    console.log("ADT-lib OK:", adt);
  } catch (e) {
    console.warn("ADT-lib failed:", e.message);
  }

  console.log("Running Omnizart (if .venv-omnizart exists)...");
  try {
    const adv = await runAdvancedDrumEngine(audioPath, { outputDir });
    console.log("Omnizart OK:", adv);
  } catch (e) {
    console.warn("Omnizart failed:", e.message);
  }

  console.log("");
  console.log("DrummerScore is notebook-based. Run their main.ipynb on your stem, then:");
  console.log("  runDrummerScoreDrumEngine('<path-to-their-output.mid>', { outputDir: '" + outputDir + "', audioPath: '" + audioPath + "' })");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
