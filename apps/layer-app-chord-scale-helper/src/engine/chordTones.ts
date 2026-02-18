/**
 * Chord tone pitch classes from root and quality.
 * Used for key inference and consistency checks.
 */

import type { ChordQuality } from '../domain/chord.js';
import type { RootSemitone } from '../domain/key.js';

/** Intervals in semitones above root for each quality (triad + common extensions). */
const QUALITY_INTERVALS: Record<ChordQuality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  aug: [0, 4, 8],
  'maj7#11': [0, 4, 7, 11, 6], // #11 = 6 semitones
  '7#11': [0, 4, 7, 10, 6],
  '7alt': [0, 4, 6, 10], // alt ≈ b5 #5 b9 #9, use reduced set
  '7b9': [0, 4, 7, 10, 1],
  mmaj7: [0, 3, 7, 11],
};

/**
 * Return pitch classes (0–11) that belong to the chord.
 */
export function getChordPitchClasses(root: RootSemitone, quality: ChordQuality): number[] {
  const intervals = QUALITY_INTERVALS[quality];
  const pcs = new Set<number>();
  for (const semitones of intervals) {
    pcs.add((root + semitones) % 12);
  }
  return [...pcs].sort((a, b) => a - b);
}
