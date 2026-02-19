/**
 * Key/modulation invariants: patterns that must NEVER modulate.
 *
 * These tests exercise Axis A (modulation vs tonicization) only.
 * If any of these progressions reports a modulation, the engine is violating
 * a hard musical invariant and the change should be reconsidered.
 * Runs all cases and reports pass/fail count and percentage (then exits non-zero if any fail).
 */

import { analyzeProgressionFromSymbols } from '../src/engine/analyzeProgression.js';

const INVARIANTS: Array<{ id: string; progression: string[] }> = [
  { id: 'INV_I_IV_V_I_C_maj', progression: ['C', 'F', 'G', 'C'] },
  { id: 'INV_I_IV_V_I_G_maj', progression: ['G', 'C', 'D', 'G'] },
  { id: 'INV_I_IV_V_I_D_maj', progression: ['D', 'G', 'A', 'D'] },
  { id: 'INV_circle_C', progression: ['C', 'Am', 'Dm', 'G', 'C', 'E', 'A', 'D', 'G', 'C'] },
  { id: 'INV_circle_G', progression: ['G', 'Em', 'Am', 'D', 'G', 'B', 'Em', 'A', 'D', 'G'] },
  { id: 'INV_borrowed_iv_C', progression: ['C', 'Fm', 'C'] },
  { id: 'INV_borrowed_iv_F', progression: ['F', 'Bbm', 'F'] },
  { id: 'INV_V_of_V_C', progression: ['C', 'D7', 'G', 'C'] },
  { id: 'INV_V_of_ii_C', progression: ['C', 'E7', 'Am', 'F', 'G', 'C'] },
];

const passed: string[] = [];
const failed: Array<{ id: string; reason: string }> = [];
for (const { id, progression } of INVARIANTS) {
  const analysis = analyzeProgressionFromSymbols(progression);
  if (analysis.modulated) {
    failed.push({ id, reason: `modulated=true for ${progression.join(' - ')}` });
  } else {
    passed.push(id);
  }
}

const total = INVARIANTS.length;
const passCount = passed.length;
const failCount = failed.length;
const pct = total > 0 ? ((passCount / total) * 100).toFixed(1) : '0';

console.log('\n--- Key/Modulation Invariants (must never modulate) ---\n');
console.log(`Pass:  ${passCount}`);
console.log(`Fail:  ${failCount}`);
console.log(`Total: ${total}`);
console.log(`Pass%: ${passCount}/${total} (${pct}%)\n`);
if (failCount > 0) {
  failed.forEach((f) => console.log(`  ${f.id}: ${f.reason}`));
  console.log('');
}
process.exit(failCount > 0 ? 1 : 0);

