/**
 * STEM Forge pipeline: run audio→MIDI (and optionally router, clone, MIR) for one or more stems.
 * Usage: node scripts/run-stem-pipeline.mjs [--stems path1.wav path2.wav] [--router] [--clone] [--mir]
 * Or:    node scripts/run-stem-pipeline.mjs --stems-dir ./path/to/stems
 * Output: JSON to stdout { stems: [ { path, midiPath?, clonePath?, metrics?, error? } ], router?: [...] }
 * See docs/FOSS_AND_LOCAL_LLM_STACK.md and docs/STEM_FORGE_GAPS.md
 */

import { readdirSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { runAudioToMidi } from "./audio-to-midi-runner.mjs";
import { runMidiToClone } from "./midi-to-clone-runner.mjs";
import { runMirCompare } from "./mir-compare-runner.mjs";
import { runRouter, runMusicLlm, ollamaHealth, STEM_CLONE_ALLOWLIST } from "./ollama-client.mjs";
import { metricsToQualityScore, updateRegistryQuality } from "./quality-score.mjs";

const REPO_ROOT = join(import.meta.dirname ?? import.meta.path, "..");
const AUDIO_EXTS = new Set([".wav", ".aiff", ".aif", ".flac", ".ogg", ".m4a"]);

function parseArgs() {
  const args = process.argv.slice(2);
  const stems = [];
  let stemsDir = null;
  let useRouter = false;
  let useClone = false;
  let useMir = false;
  let useMusicLlm = false;
  let gridOpts = { bpm: null, timeSig: null, gridFile: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--stems" && i + 1 < args.length) {
      i++;
      while (i < args.length && !args[i].startsWith("--")) {
        stems.push(args[i]);
        i++;
      }
      i--;
    } else if (args[i] === "--stems-dir" && i + 1 < args.length) {
      stemsDir = args[++i];
    } else if (args[i] === "--bpm" && i + 1 < args.length) {
      gridOpts.bpm = parseInt(args[++i], 10) || null;
    } else if (args[i] === "--time-sig" && i + 1 < args.length) {
      gridOpts.timeSig = args[++i] || null;
    } else if (args[i] === "--grid-file" && i + 1 < args.length) {
      gridOpts.gridFile = args[++i] || null;
    } else if (args[i] === "--router") useRouter = true;
    else if (args[i] === "--clone") useClone = true;
    else if (args[i] === "--mir") useMir = true;
    else if (args[i] === "--music-llm") useMusicLlm = true;
  }
  if (stemsDir) {
    const dir = stemsDir.startsWith("/") ? stemsDir : join(REPO_ROOT, stemsDir);
    if (!existsSync(dir)) throw new Error(`--stems-dir does not exist: ${dir}`);
    for (const name of readdirSync(dir)) {
      if (AUDIO_EXTS.has(extname(name).toLowerCase())) stems.push(join(dir, name));
    }
  }
  return { stems, useRouter, useClone, useMir, useMusicLlm, gridOpts };
}

async function main() {
  const { stems, useRouter, useClone, useMir, useMusicLlm, gridOpts } = parseArgs();
  if (stems.length === 0) {
    console.error("Usage: node scripts/run-stem-pipeline.mjs --stems file1.wav [file2.wav ...] [--router] [--clone] [--mir] [--music-llm]");
    console.error("   or: node scripts/run-stem-pipeline.mjs --stems-dir ./stems [--router] [--clone] [--mir] [--music-llm]");
    process.exit(1);
  }

  // Phase 1: audio→MIDI for all stems (so router can use duration/noteCount)
  const results = [];
  for (let i = 0; i < stems.length; i++) {
    const path = stems[i].startsWith("/") ? stems[i] : join(REPO_ROOT, stems[i]);
    const entry = { path, stemId: `s${i}` };
    try {
      const midi = await runAudioToMidi(path);
      entry.midiPath = midi.midiPath;
      entry.noteCount = midi.noteCount;
      entry.duration = midi.duration;
    } catch (e) {
      entry.error = e.message;
    }
    results.push(entry);
  }

  // Phase 2: router once with enriched stems (duration, noteCount for smarter model choice)
  let routerChoices = null;
  if (useRouter) {
    try {
      const ok = await ollamaHealth();
      if (ok) {
        const enrichedStems = results.map((r) => ({
          stemId: r.stemId,
          instrument: "unknown",
          ...(r.duration != null && { lengthSec: r.duration }),
          ...(r.noteCount != null && { complexity: r.noteCount }),
        }));
        routerChoices = await runRouter({
          stems: enrichedStems,
          allowlist: STEM_CLONE_ALLOWLIST,
        });
      }
    } catch (e) {
      routerChoices = { error: e.message };
    }
  }

  // Phase 3: clone and MIR per stem (using router choice or default)
  for (const entry of results) {
    if (entry.error || !entry.midiPath) continue;
    const modelId = Array.isArray(routerChoices)
      ? (routerChoices.find((c) => c.stemId === entry.stemId)?.modelId ?? "basic-pitch-only")
      : "basic-pitch-only";
    if (useClone && modelId) {
      try {
        const clone = await runMidiToClone(entry.midiPath, modelId, {
          refAudioPath: entry.path, // original stem as reference for RAVE
        });
        entry.clonePath = clone.clonePath;
      } catch (e) {
        entry.cloneError = e.message;
      }
    }
    if (useMir && entry.clonePath && existsSync(entry.path) && existsSync(entry.clonePath)) {
      try {
        const out = await runMirCompare(entry.path, entry.clonePath);
        entry.metrics = out.metrics;
        entry.quality_score = metricsToQualityScore(out.metrics);
        try {
          updateRegistryQuality(modelId, entry.quality_score, { path: entry.clonePath });
        } catch (_) { /* registry write optional */ }
      } catch (e) {
        entry.mirError = e.message;
      }
    }
  }

  // Optional: Music LLM suggestions (articulations, style) from stem summary
  let musicSuggestions = null;
  if (useMusicLlm) {
    try {
      const ok = await ollamaHealth();
      if (ok) {
        const summaryParts = results
          .filter((r) => r.midiPath)
          .map((r) => `Stem ${r.stemId}: ${r.noteCount ?? 0} notes, ${r.duration ?? 0}s`)
          .join("; ");
        musicSuggestions = await runMusicLlm({
          summary: summaryParts || "No stems processed.",
          desiredStyle: "clean, mix-ready",
        });
      }
    } catch (e) {
      musicSuggestions = { error: e.message };
    }
  }

  const summary = {
    stems: results,
    ...(routerChoices && { router: routerChoices }),
    ...(musicSuggestions != null && { musicSuggestions }),
    ...((gridOpts.bpm != null || gridOpts.timeSig || gridOpts.gridFile) && { gridOpts }),
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
