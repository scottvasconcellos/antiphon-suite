/**
 * 50-case key/modulation stress test. Runs engine against ground truth;
 * reports pass / soft-pass / fail and pressure-test summary.
 */

import { analyzeProgressionFromSymbols } from '../src/engine/analyzeProgression.js';
import { KEY_MODULATION_SUITE, type KeyModulationCase } from './fixtures/key-modulation-suite.js';

const STRONG_THRESHOLD = 0.85;
const AMBIGUOUS_THRESHOLD = 0.55;

/** Parse ground truth key string to comparable root (0-11) and mode. Engine only has maj/min; dorian/mixolydian map to min/maj for root comparison. */
function parseGroundTruthKey(keyStart: string): { root: number; mode: 'maj' | 'min'; isModal: boolean } {
  const isModal = keyStart.includes('dorian') || keyStart.includes('mixolydian');
  const [rootPart, modePart] = keyStart.split(':');
  const rootMap: Record<string, number> = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
  };
  const root = rootMap[rootPart] ?? 0;
  let mode: 'maj' | 'min' = 'maj';
  if (modePart === 'min' || modePart === 'dorian') mode = 'min';
  if (modePart === 'mixolydian') mode = 'maj'; // engine will infer maj for mixolydian center
  return { root, mode, isModal };
}

/** Engine key string "C:maj" / "A:min" to root number (sharp names: A# = 10). */
function engineKeyToRootMode(primaryKey: string): { root: number; mode: 'maj' | 'min' } {
  const [rootPart, modePart] = primaryKey.split(':');
  const rootMap: Record<string, number> = {
    C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
  };
  const root = rootMap[rootPart] ?? 0;
  const mode = modePart === 'min' ? 'min' : 'maj';
  return { root, mode };
}

/** Check if engine alternates (or primary) contain the ground truth key (by root+mode, engine only has maj/min). */
function alternatesContain(primaryKey: string, alternates: string[], gtKeyStart: string): boolean {
  const gt = parseGroundTruthKey(gtKeyStart);
  const all = [primaryKey, ...alternates];
  for (const k of all) {
    const { root, mode } = engineKeyToRootMode(k);
    if (root === gt.root && mode === gt.mode) return true;
  }
  return false;
}

type Result = 'pass' | 'soft-pass' | 'fail';

function runCase(c: KeyModulationCase): { result: Result; reason: string } {
  const analysis = analyzeProgressionFromSymbols(c.progression);

  if (analysis.errors.length > 0) {
    return { result: 'fail', reason: `parse errors: ${analysis.errors.map((e) => e.symbol + ': ' + e.message).join('; ')}` };
  }

  const gt = c.groundTruth;
  const gtKey = parseGroundTruthKey(gt.keyStart);
  const engineKey = engineKeyToRootMode(analysis.primaryKey);
  const pPrimary = c.expectedBayes.keyPosteriors[0]?.p ?? 0.5;

  // Modal key: engine cannot return dorian/mixolydian; soft-pass if root matches and no false modulation
  if (gtKey.isModal) {
    if (analysis.modulated && !gt.modulates) return { result: 'fail', reason: 'false modulation (modal case)' };
    if (engineKey.root === gtKey.root) return { result: 'soft-pass', reason: 'modal key: root match (mode not supported)' };
    return { result: 'fail', reason: `modal key: expected root ${gtKey.root}, got ${engineKey.root}` };
  }

  // Modulation: must match
  if (gt.modulates && !analysis.modulated) return { result: 'fail', reason: 'missed modulation' };
  if (!gt.modulates && analysis.modulated) return { result: 'fail', reason: 'false modulation' };

  // Strong case: primary must match
  if (pPrimary >= STRONG_THRESHOLD) {
    if (engineKey.root === gtKey.root && engineKey.mode === gtKey.mode) return { result: 'pass', reason: 'primary match' };
    return { result: 'fail', reason: `strong case: expected ${gt.keyStart}, got ${analysis.primaryKey}` };
  }

  // Ambiguous: pass if primary match, soft-pass if gt in alternates
  if (engineKey.root === gtKey.root && engineKey.mode === gtKey.mode) return { result: 'pass', reason: 'primary match' };
  if (pPrimary >= AMBIGUOUS_THRESHOLD && alternatesContain(analysis.primaryKey, analysis.alternates, gt.keyStart))
    return { result: 'soft-pass', reason: 'ambiguous: ground truth in alternates' };
  if (pPrimary < AMBIGUOUS_THRESHOLD) return { result: 'soft-pass', reason: 'highly ambiguous: no strict check' };

  return { result: 'fail', reason: `expected ${gt.keyStart} (or in alternates), got primary ${analysis.primaryKey}` };
}

// Run all cases
const results: Array<{ id: string; result: Result; reason: string }> = [];
for (const c of KEY_MODULATION_SUITE) {
  const { result, reason } = runCase(c);
  results.push({ id: c.id, result, reason });
}

const pass = results.filter((r) => r.result === 'pass').length;
const softPass = results.filter((r) => r.result === 'soft-pass').length;
const fail = results.filter((r) => r.result === 'fail').length;

console.log('\n--- Key/Modulation 50-Case Stress Test ---\n');
console.log(`Pass:      ${pass}`);
console.log(`Soft-pass: ${softPass}`);
console.log(`Fail:      ${fail}`);
console.log(`Total:     ${results.length}\n`);

if (fail > 0) {
  console.log('Failed cases:');
  results.filter((r) => r.result === 'fail').forEach((r) => console.log(`  ${r.id}: ${r.reason}`));
  console.log('');
}

// Exit with error if any hard fail (so CI can catch it)
process.exit(fail > 0 ? 1 : 0);
