/**
 * One definitive chord-scale per chord (MVP invariant).
 * Foundation domain — types only.
 */

import type { Chord } from './chord.js';
import type { Scale } from './scale.js';
import type { RomanNumeral } from './romanNumeral.js';

/** Single authoritative chord-scale assignment for one chord. */
export interface ChordScaleAssignment {
  chordId: string;
  scale: Scale;
  romanNumeral: RomanNumeral;
  /** Scale degrees that are chord tones. */
  chordToneDegrees: number[];
}
