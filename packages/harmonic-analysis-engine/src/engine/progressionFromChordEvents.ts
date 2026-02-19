/**
 * Build a Progression from a list of chord events (e.g. from MIDI or manual entry).
 * Each event is a pitch-class set + bass + beat span; we detect chord (root, quality) and format as symbol.
 */

import type { TimeSignature } from '../domain/beatMeasure.js';
import type { Progression } from '../domain/progression.js';
import type { Chord } from '../domain/chord.js';
import type { RootSemitone } from '../domain/key.js';
import { getChordFromPitchClassSet } from './chordFromPitchClassSet.js';
import { chordToSymbol } from './chordParser.js';

/** One chord event: pitch classes (0–11), bass note (0–11 or MIDI), and beat span. */
export interface ChordEventInput {
  /** Pitch classes in the chord (0–11). */
  pitchClasses: number[];
  /** Bass note as pitch class (0–11) or lowest MIDI note (will be reduced mod 12). */
  bass: number;
  /** Start beat from progression start. */
  startBeat: number;
  /** Duration in quarter notes. */
  durationBeats: number;
}

export interface BuildProgressionOptions {
  timeSignature?: TimeSignature | null;
  progressionId?: string;
}

const DEFAULT_TIME_SIGNATURE: TimeSignature = { numerator: 4, denominator: 4 };

/**
 * Build a Progression from chord events (e.g. MIDI segments or manual entries).
 * Uses getChordFromPitchClassSet to infer root/quality, then chordToSymbol for display.
 */
export function buildProgressionFromChordEvents(
  events: ChordEventInput[],
  options?: BuildProgressionOptions
): Progression {
  const timeSignature = options?.timeSignature ?? DEFAULT_TIME_SIGNATURE;
  const id = options?.progressionId ?? 'p1';

  const chords: Chord[] = events.map((evt, i) => {
    const bassPc = ((evt.bass % 12) + 12) % 12;
    const detected = getChordFromPitchClassSet(evt.pitchClasses, bassPc);
    const root = detected.root as RootSemitone;
    const symbol = chordToSymbol(root, detected.quality, detected.bass);
    return {
      id: `c${i + 1}`,
      symbol,
      root,
      quality: detected.quality,
      ...(detected.bass !== undefined && { bass: detected.bass }),
      span: { startBeat: evt.startBeat, durationBeats: evt.durationBeats },
    };
  });

  return {
    id,
    chords,
    timeSignature,
  };
}
