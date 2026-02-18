/**
 * Chord progression and analysis result.
 * Foundation domain — types only.
 */

import type { Key } from './key.js';
import type { TimeSignature } from './beatMeasure.js';
import type { Chord } from './chord.js';
import type { ChordScaleAssignment } from './chordScaleAssignment.js';

/** A chord progression with optional key and time signature. */
export interface Progression {
  id: string;
  chords: Chord[];
  timeSignature: TimeSignature;
  /** Inferred or user-set key; may be absent before analysis. */
  key?: Key;
  /** Tempo in BPM when from MIDI. */
  tempoBpm?: number;
}

/** Result of harmonic analysis: one chord-scale per chord, internally consistent. */
export interface AnalyzedProgression {
  progression: Progression;
  /** One assignment per chord; order matches progression.chords. */
  assignments: ChordScaleAssignment[];
}
