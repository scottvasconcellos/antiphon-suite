/**
 * Scale representation for one definitive chord-scale per chord.
 * Foundation domain — types only.
 */

/** Scale identified by name (e.g. "Ionian", "Dorian", "Melodic Minor"). */
export interface Scale {
  id: string;
  name: string;
  /** Intervals in semitones from root (e.g. [0,2,4,5,7,9,11] for major). */
  intervals: number[];
}

/** Note in scale: semitone offset from progression root or chord root. */
export type ScaleDegree = number;

/** Chord tones within the scale (scale degrees that form the chord). */
export interface ChordTones {
  scaleDegrees: ScaleDegree[];
}
