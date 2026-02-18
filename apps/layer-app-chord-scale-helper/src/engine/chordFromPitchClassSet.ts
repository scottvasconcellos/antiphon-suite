/**
 * Chord recognition from pitch-class set and bass (e.g. from MIDI segment).
 * Heuristic: bass = root unless slash is inferred; quality from PC set.
 */

import type { ChordQuality } from '../domain/chord.js';
import type { RootSemitone } from '../domain/key.js';

/** Result of chord-from-PC-set (no timing). */
export interface ChordFromPCSet {
  root: RootSemitone;
  quality: ChordQuality;
  /** When bass is not the chord root (inversion/slash). */
  bass?: RootSemitone;
}

/** Intervals from root (sorted) → quality. */
const PC_SET_TO_QUALITY: Record<string, ChordQuality> = {
  '0,4,7': 'maj',
  '0,3,7': 'min',
  '0,4,7,10': '7',
  '0,4,7,11': 'maj7',
  '0,3,7,10': 'min7',
  '0,3,6': 'dim',
  '0,3,6,9': 'dim7',
  '0,3,6,10': 'm7b5',
  '0,2,7': 'sus2',
  '0,5,7': 'sus4',
  '0,4,8': 'aug',
  '0,2,4,7': 'sus2',
  '0,4,6,7,11': 'maj7#11',
  '0,4,6,7,10': '7#11',
  '0,3,7,11': 'mmaj7',
};

function intervalsFromRoot(pcs: number[], root: number): number[] {
  const out = [...new Set(pcs.map((pc) => ((pc - root) % 12 + 12) % 12))].sort((a, b) => a - b);
  return out;
}

function key(intervals: number[]): string {
  return intervals.join(',');
}

/**
 * Infer chord (root, quality, optional bass) from pitch-class set and lowest note (bass).
 * Uses bass = root heuristic; quality from best-matching interval set.
 */
export function getChordFromPitchClassSet(pitchClasses: number[], bassNote: number): ChordFromPCSet {
  const pcs = pitchClasses.map((pc) => ((pc % 12) + 12) % 12);
  const bass = ((bassNote % 12) + 12) % 12 as RootSemitone;
  const root = bass;
  const intervals = intervalsFromRoot(pcs, root);
  const quality = PC_SET_TO_QUALITY[key(intervals)] ?? 'maj';
  return { root: root as RootSemitone, quality };
}
