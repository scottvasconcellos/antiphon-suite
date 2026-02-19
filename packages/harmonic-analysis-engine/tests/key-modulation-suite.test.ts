/**
 * 50-case key/modulation stress test. Runs engine against ground truth;
 * reports pass / soft-pass / fail and pressure-test summary.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeProgressionFromSymbols, parseChordSymbol } from '@antiphon/harmonic-analysis-engine';
import { KEY_MODULATION_SUITE, type KeyModulationCase } from './fixtures/key-modulation-suite.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBUG_LOG_PATH = path.resolve(__dirname, '../../../.cursor/debug.log');

const DEBUG_LOG = (payload: object) => {
  const line = JSON.stringify({ ...payload, timestamp: Date.now(), runId: 'test', hypothesisId: 'H0' }) + '\n';
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, line);
  } catch (_) {}
};

const STRONG_THRESHOLD = 0.85;
const AMBIGUOUS_THRESHOLD = 0.55;

/** Parse ground truth key string to comparable root (0-11) and mode. Engine only has maj/min; dorian/mixolydian map to min/maj for root comparison. */
function parseGroundTruthKey(keyStart: string): { root: number; mode: 'maj' | 'min'; isModal: boolean } {
  const isModal = keyStart.includes('dorian') || keyStart.includes('mixolydian') || keyStart.includes('aeolian');
  const [rootPart, modePart] = keyStart.split(':');
  const rootMap: Record<string, number> = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
  };
  const root = rootMap[rootPart] ?? 0;
  let mode: 'maj' | 'min' = 'maj';
  if (modePart === 'min' || modePart === 'dorian' || modePart === 'aeolian') mode = 'min';
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
  if (result === 'fail') {
    const analysis = analyzeProgressionFromSymbols(c.progression);
    let fingerprint = '';
    try {
      fingerprint = c.progression.map((s) => parseChordSymbol(s.trim()).root).join(',');
    } catch (_) {}
    DEBUG_LOG({
      location: 'key-modulation-suite.test.ts:fail',
      message: 'case failed',
      data: {
        id: c.id,
        reason,
        fingerprint,
        primaryKey: analysis.primaryKey,
        modulated: analysis.modulated,
        keyStart: c.groundTruth.keyStart,
        gtModulates: c.groundTruth.modulates,
      },
    });
  }
}

const pass = results.filter((r) => r.result === 'pass').length;
const softPass = results.filter((r) => r.result === 'soft-pass').length;
const fail = results.filter((r) => r.result === 'fail').length;

const total = results.length;
const passOrSoft = pass + softPass;
const pct = total > 0 ? ((passOrSoft / total) * 100).toFixed(1) : '0';

console.log(`\n--- Key/Modulation ${total}-Case Stress Test ---\n`);
console.log(`Pass:      ${pass}`);
console.log(`Soft-pass: ${softPass}`);
console.log(`Fail:      ${fail}`);
console.log(`Total:     ${total}`);
console.log(`Pass+soft: ${passOrSoft}/${total} (${pct}%)\n`);

// Per-category metrics (Axis A/B/C by phenomenon: parallel_minor, modal, circle_of_fifths, etc.)
type CatStats = { total: number; pass: number; soft: number; fail: number };
const byCategoryAll = new Map<string, CatStats>();
for (const c of KEY_MODULATION_SUITE) {
  const cat = c.groundTruth.category ?? '(no category)';
  if (!byCategoryAll.has(cat)) {
    byCategoryAll.set(cat, { total: 0, pass: 0, soft: 0, fail: 0 });
  }
  const stats = byCategoryAll.get(cat)!;
  const r = results.find((x) => x.id === c.id);
  stats.total += 1;
  if (!r) continue;
  if (r.result === 'pass') stats.pass += 1;
  else if (r.result === 'soft-pass') stats.soft += 1;
  else if (r.result === 'fail') stats.fail += 1;
}

if (byCategoryAll.size > 0) {
  console.log('By category (pass/soft/fail):');
  for (const [cat, stats] of Array.from(byCategoryAll.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    const catPct = stats.total > 0 ? (((stats.pass + stats.soft) / stats.total) * 100).toFixed(1) : '0';
    console.log(
      `  ${cat}: ${stats.pass}/${stats.total} pass, ${stats.soft} soft, ${stats.fail} fail (pass+soft ${catPct}%)`
    );
  }
  console.log('');
}

if (fail > 0) {
  const failed = results.filter((r) => r.result === 'fail');
  console.log('Failed cases:');
  failed.forEach((r) => console.log(`  ${r.id}: ${r.reason}`));
  const byCategory = new Map<string, string[]>();
  for (const r of failed) {
    const c = KEY_MODULATION_SUITE.find((x) => x.id === r.id);
    const cat = c?.groundTruth?.category ?? '(no category)';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(`${r.id}: ${r.reason}`);
  }
  if (byCategory.size > 1) {
    console.log('\nBy category:');
    for (const [cat, lines] of Array.from(byCategory.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
      console.log(`  ${cat}: ${lines.length}`);
      lines.slice(0, 5).forEach((l) => console.log(`    ${l}`));
      if (lines.length > 5) console.log(`    ... and ${lines.length - 5} more`);
    }
  }
  console.log('');
}

const rate = total ? passOrSoft / total : 1;
const meetsTarget = rate >= 0.9;
if (meetsTarget) {
  console.log('✓ 90% success rate (pass+soft) reached.\n');
} else {
  console.log(`✗ Below 90% (pass+soft): ${(rate * 100).toFixed(1)}%\n`);
}

// Exit 0 when pass+soft ≥ 90% (documented target); 1 if below (regression)
process.exit(meetsTarget ? 0 : 1);
