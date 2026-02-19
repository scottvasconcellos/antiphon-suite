/**
 * Key-detection edge-case questions (from 50-questions / F2xx).
 * Same harness as K-suite: pass/soft/fail and percentage.
 */

import { analyzeProgressionFromSymbols } from '@antiphon/harmonic-analysis-engine';
import type { KeyModulationCase } from './fixtures/key-modulation-suite.js';

const STRONG_THRESHOLD = 0.85;
const AMBIGUOUS_THRESHOLD = 0.55;

function parseGroundTruthKey(keyStart: string): { root: number; mode: 'maj' | 'min'; isModal: boolean } {
  const isModal = keyStart.includes('dorian') || keyStart.includes('mixolydian') || keyStart.includes('aeolian');
  const [rootPart, modePart] = keyStart.split(':');
  const rootMap: Record<string, number> = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
  };
  const root = rootMap[rootPart] ?? 0;
  let mode: 'maj' | 'min' = 'maj';
  if (modePart === 'min' || modePart === 'dorian' || modePart === 'aeolian') mode = 'min';
  if (modePart === 'mixolydian') mode = 'maj';
  return { root, mode, isModal };
}

function engineKeyToRootMode(primaryKey: string): { root: number; mode: 'maj' | 'min' } {
  const [rootPart, modePart] = primaryKey.split(':');
  const rootMap: Record<string, number> = {
    C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
  };
  const root = rootMap[rootPart] ?? 0;
  const mode = modePart === 'min' ? 'min' : 'maj';
  return { root, mode };
}

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
  if (gtKey.isModal) {
    if (analysis.modulated && !gt.modulates) return { result: 'fail', reason: 'false modulation (modal case)' };
    if (engineKey.root === gtKey.root) return { result: 'soft-pass', reason: 'modal key: root match' };
    return { result: 'fail', reason: `modal key: expected root ${gtKey.root}, got ${engineKey.root}` };
  }
  if (gt.modulates && !analysis.modulated) return { result: 'fail', reason: 'missed modulation' };
  if (!gt.modulates && analysis.modulated) return { result: 'fail', reason: 'false modulation' };
  if (pPrimary >= STRONG_THRESHOLD) {
    if (engineKey.root === gtKey.root && engineKey.mode === gtKey.mode) return { result: 'pass', reason: 'primary match' };
    return { result: 'fail', reason: `strong case: expected ${gt.keyStart}, got ${analysis.primaryKey}` };
  }
  if (engineKey.root === gtKey.root && engineKey.mode === gtKey.mode) return { result: 'pass', reason: 'primary match' };
  if (pPrimary >= AMBIGUOUS_THRESHOLD && alternatesContain(analysis.primaryKey, analysis.alternates, gt.keyStart))
    return { result: 'soft-pass', reason: 'ambiguous: gt in alternates' };
  if (pPrimary < AMBIGUOUS_THRESHOLD) return { result: 'soft-pass', reason: 'highly ambiguous' };
  return { result: 'fail', reason: `expected ${gt.keyStart} (or in alternates), got primary ${analysis.primaryKey}` };
}

// Edge-case questions from 50-questions doc (F2xx / parallel minor / snapback / ambiguous)
const EDGE_QUESTIONS: KeyModulationCase[] = [
  { id: 'EQ-F211', progression: ['C', 'Eb', 'F', 'G', 'C'], groundTruth: { keyStart: 'C:min', modulates: false, category: 'parallel_minor' }, expectedBayes: { keyPosteriors: [{ key: 'C:min', p: 0.65 }, { key: 'C:maj', p: 0.35 }] } },
  { id: 'EQ-F221', progression: ['C', 'Dm', 'G', 'C', 'Am', 'F', 'G'], groundTruth: { keyStart: 'C:maj', modulates: false, category: 'key_ambiguous' }, expectedBayes: { keyPosteriors: [{ key: 'C:maj', p: 0.80 }] } },
  { id: 'EQ-F231', progression: ['C', 'D', 'G', 'C', 'D', 'G', 'C'], groundTruth: { keyStart: 'C:maj', modulates: false, category: 'snapback' }, expectedBayes: { keyPosteriors: [{ key: 'C:maj', p: 0.90 }] } },
  { id: 'EQ-F236', progression: ['C', 'Bb', 'Cm'], groundTruth: { keyStart: 'C:maj', modulates: true, segments: [{ startChordIdx: 0, endChordIdx: 1, key: 'C:maj' }, { startChordIdx: 2, endChordIdx: 2, key: 'C:min' }], category: 'bVII_i' }, expectedBayes: { keyPosteriors: [{ key: 'C:min', p: 0.55 }, { key: 'C:maj', p: 0.45 }] } },
  { id: 'EQ-F201', progression: ['C', 'E', 'A', 'D', 'G', 'C', 'F', 'Bb', 'Eb'], groundTruth: { keyStart: 'C:maj', modulates: false, category: 'extreme_stress' }, expectedBayes: { keyPosteriors: [{ key: 'C:maj', p: 0.50 }] } },
  { id: 'EQ-F232', progression: ['C', 'E', 'A', 'D', 'G', 'C'], groundTruth: { keyStart: 'C:maj', modulates: false, category: 'snapback' }, expectedBayes: { keyPosteriors: [{ key: 'C:maj', p: 0.88 }] } },
  { id: 'EQ-F222', progression: ['G', 'Em', 'C', 'D', 'Em'], groundTruth: { keyStart: 'G:maj', modulates: false, category: 'key_ambiguous' }, expectedBayes: { keyPosteriors: [{ key: 'G:maj', p: 0.55 }, { key: 'E:min', p: 0.45 }] } },
  { id: 'EQ-F237', progression: ['C', 'Bb', 'Cm', 'Fm', 'Cm'], groundTruth: { keyStart: 'C:min', modulates: false, category: 'parallel_minor' }, expectedBayes: { keyPosteriors: [{ key: 'C:min', p: 0.85 }] } },
  { id: 'EQ-F242', progression: ['G', 'D', 'Em', 'C', 'G', 'Em'], groundTruth: { keyStart: 'G:maj', modulates: false, category: 'key_ambiguous' }, expectedBayes: { keyPosteriors: [{ key: 'G:maj', p: 0.52 }, { key: 'E:min', p: 0.48 }] } },
  { id: 'EQ-F246', progression: ['C', 'E7', 'Am', 'D7', 'G', 'C', 'A7', 'Dm', 'G', 'C'], groundTruth: { keyStart: 'C:maj', modulates: false, category: 'tonicization' }, expectedBayes: { keyPosteriors: [{ key: 'C:maj', p: 0.88 }] } },
];

const results: Array<{ id: string; result: Result; reason: string }> = [];
for (const c of EDGE_QUESTIONS) {
  const { result, reason } = runCase(c);
  results.push({ id: c.id, result, reason });
}

const pass = results.filter((r) => r.result === 'pass').length;
const softPass = results.filter((r) => r.result === 'soft-pass').length;
const fail = results.filter((r) => r.result === 'fail').length;
const total = results.length;
const passOrSoft = pass + softPass;
const pct = total > 0 ? ((passOrSoft / total) * 100).toFixed(1) : '0';

console.log('\n--- Key-Detection Edge-Case Questions ---\n');
console.log(`Pass:      ${pass}`);
console.log(`Soft-pass: ${softPass}`);
console.log(`Fail:      ${fail}`);
console.log(`Total:     ${total}`);
console.log(`Pass+soft: ${passOrSoft}/${total} (${pct}%)\n`);
if (fail > 0) {
  results.filter((r) => r.result === 'fail').forEach((r) => console.log(`  ${r.id}: ${r.reason}`));
  console.log('');
}
process.exit(fail > 0 ? 1 : 0);
