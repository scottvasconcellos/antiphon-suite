#!/usr/bin/env node
/**
 * CLI for MIDI clean (STEM Forge). Usage: node scripts/stem-forge-midi-clean-cli.mjs <midiPath>
 */
import { runMidiClean } from "./midi-clean-runner.mjs";
const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/stem-forge-midi-clean-cli.mjs <midiPath>");
  process.exit(1);
}
runMidiClean(path)
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
