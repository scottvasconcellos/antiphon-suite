/**
 * Key and mode types for harmonic analysis.
 * Foundation domain — types only; engine logic lives in Operations arc.
 */

export type Mode = 'major' | 'minor';

/** Chromatic root: 0 = C, 1 = C#, ..., 11 = B. */
export type RootSemitone = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** Inferred or user-specified key. */
export interface Key {
  /** Root as semitone (0–11). */
  root: RootSemitone;
  mode: Mode;
  /** Optional confidence 0–1 when inferred. */
  confidence?: number;
  /** Runner-up keys when inference is ambiguous (e.g. two keys close in score). */
  alternates?: Array<{ root: RootSemitone; mode: Mode; confidence?: number }>;
}

/** Root note name (sharp spelling). */
export const ROOT_NAMES: Record<RootSemitone, string> = {
  0: 'C',
  1: 'C#',
  2: 'D',
  3: 'D#',
  4: 'E',
  5: 'F',
  6: 'F#',
  7: 'G',
  8: 'G#',
  9: 'A',
  10: 'A#',
  11: 'B',
};
