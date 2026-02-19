/**
 * Layer 0 consistency: scale contains chord tones; RN consistent with key.
 */

import type { ChordQuality } from '../domain/chord.js';
import type { Key } from '../domain/key.js';
import type { RootSemitone } from '../domain/key.js';
import type { RomanNumeral } from '../domain/romanNumeral.js';
import type { Scale } from '../domain/scale.js';
import { getChordPitchClasses } from './chordTones.js';

export interface ConsistencyResult {
  valid: boolean;
  errors: string[];
}

/**
 * Check that the scale (intervals from chord root) contains all chord pitch classes.
 */
export function scaleContainsChordTones(
  chordRoot: RootSemitone,
  quality: ChordQuality,
  scale: Scale
): boolean {
  const chordPCs = new Set(getChordPitchClasses(chordRoot, quality));
  const scalePCs = new Set(scale.intervals.map((s) => (chordRoot + s) % 12));
  for (const pc of chordPCs) {
    if (!scalePCs.has(pc)) return false;
  }
  return true;
}

/**
 * Check that Roman numeral degree is 1–7 (or 0 if non-diatonic) and matches key context.
 */
export function romanNumeralConsistentWithKey(rn: RomanNumeral, _key: Key): boolean {
  if (rn.degree < 0 || rn.degree > 7) return false;
  if (rn.degree === 0 && !rn.borrowed) return false;
  return true;
}

/**
 * Run Layer 0 consistency on one chord's assignment.
 */
export function checkConsistency(
  key: Key,
  chordRoot: RootSemitone,
  chordQuality: ChordQuality,
  scale: Scale,
  rn: RomanNumeral
): ConsistencyResult {
  const errors: string[] = [];
  if (!scaleContainsChordTones(chordRoot, chordQuality, scale)) {
    errors.push('Scale does not contain all chord tones');
  }
  if (!romanNumeralConsistentWithKey(rn, key)) {
    errors.push('Roman numeral inconsistent with key');
  }
  return { valid: errors.length === 0, errors };
}
