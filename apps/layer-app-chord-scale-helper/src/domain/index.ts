/**
 * Chord Scale Helper domain types.
 * Foundation arc — types only; engine and UI in later arcs.
 */

export type { Key, Mode, RootSemitone } from './key.js';
export { ROOT_NAMES } from './key.js';

export type {
  TimeSignature,
  BeatPosition,
  BeatSpan,
  MeasureAlignedSpan,
} from './beatMeasure.js';

export type { Chord, ChordQuality } from './chord.js';

export type { Scale, ScaleDegree, ChordTones } from './scale.js';

export type { RomanNumeral, RomanNumeralQuality } from './romanNumeral.js';

export type { ChordScaleAssignment } from './chordScaleAssignment.js';

export type { Progression, AnalyzedProgression } from './progression.js';
