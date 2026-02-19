/**
 * Pipeline order tests (plan 2.3): enforce fixed stage order and behavior.
 * - Tonicization shield is applied before modulation promotion.
 * - Naming (Stage 5) cannot change centerKey (root).
 * - Pipeline runs with custom params (cooldown/hysteresis in params).
 */

import {
  analyzeProgressionFromSymbols,
  runKeyDecisionPipeline,
  inferKey,
  getChordPitchClasses,
  parseChordSymbol,
  DEFAULT_KEY_MODULATION_PARAMS,
} from '@antiphon/harmonic-analysis-engine';
import type { RootSemitone, ChordQuality } from '@antiphon/harmonic-analysis-engine';

function symbolsToPipelineInput(symbols: string[]) {
  const chordRoots: RootSemitone[] = [];
  const chordQualities: string[] = [];
  const segments: number[][] = [];
  for (const sym of symbols) {
    const p = parseChordSymbol(sym.trim());
    chordRoots.push(p.root);
    chordQualities.push(p.quality);
    segments.push(getChordPitchClasses(p.root, p.quality as ChordQuality));
  }
  return { chordRoots, segments, chordQualities };
}

// 1) Tonicization shield before promotion: V/x → x (x diatonic in K1) must not report modulation
const SHIELD_PROGRESSIONS = [
  ['C', 'D7', 'G', 'C'],           // V/V in C
  ['C', 'E7', 'Am', 'F', 'G', 'C'], // V/ii in C
  ['G', 'A7', 'D', 'G'],           // V/V in G
];
let shieldOk = 0;
for (const prog of SHIELD_PROGRESSIONS) {
  const a = analyzeProgressionFromSymbols(prog);
  if (!a.modulated) shieldOk++;
}
if (shieldOk !== SHIELD_PROGRESSIONS.length) {
  console.error('Pipeline order: tonicization shield must run before promotion; expected no modulation for V/x progressions.');
  process.exit(1);
}

// 2) Naming (Stage 5) cannot change centerKey (root): pipeline key.root === Stage 1 key.root
const ROOT_PROGRESSIONS = [
  ['C', 'F', 'G', 'C'],
  ['Am', 'Dm', 'G', 'Am'],
  ['C', 'G', 'Am', 'F', 'C'],
];
let rootOk = 0;
for (const prog of ROOT_PROGRESSIONS) {
  const input = symbolsToPipelineInput(prog);
  const stage1Key = inferKey(input.segments, { chordRoots: input.chordRoots });
  const result = runKeyDecisionPipeline(input);
  if (result.key.root === stage1Key.root) rootOk++;
}
if (rootOk !== ROOT_PROGRESSIONS.length) {
  console.error('Pipeline order: Stage 5 naming must not change key.root (centerKey).');
  process.exit(1);
}

// 3) Pipeline runs with custom params (params surface; cooldown/hysteresis present)
const customParams = {
  ...DEFAULT_KEY_MODULATION_PARAMS,
  cooldownAfterSwitchChords: 4,
  hysteresisEnter: 0.25,
  hysteresisExit: 0.15,
};
const input = symbolsToPipelineInput(['C', 'F', 'G', 'C']);
const resultCustom = runKeyDecisionPipeline(input, customParams);
if (resultCustom.key === undefined || resultCustom.modulated === undefined) {
  console.error('Pipeline must run with custom params.');
  process.exit(1);
}

console.log('Pipeline order tests: shield before promotion, naming does not change root, custom params OK.');
process.exit(0);
