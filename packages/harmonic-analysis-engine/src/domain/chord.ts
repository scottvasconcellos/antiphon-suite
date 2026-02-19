/**
 * Chord representation for progression and chord-scale assignment.
 * Foundation domain — types only.
 */

import type { BeatSpan } from './beatMeasure.js';
import type { RootSemitone } from './key.js';

/** Chord quality / type key (aligned with common notation). */
export type ChordQuality =
  | 'maj'
  | 'maj7'
  | 'min'
  | 'min7'
  | '7'
  | 'm7b5'
  | 'dim'
  | 'dim7'
  | 'sus2'
  | 'sus4'
  | 'aug'
  | 'maj7#11'
  | '7#11'
  | '7alt'
  | '7b9'
  | 'mmaj7';

/** A chord in a progression with timing. */
export interface Chord {
  id: string;
  /** Display symbol (e.g. "Cmaj7", "F#m7"). */
  symbol: string;
  root: RootSemitone;
  quality: ChordQuality;
  /** Slash bass note (e.g. C/G); absent if not a slash chord. */
  bass?: RootSemitone;
  /** Timing in beats from progression start. */
  span: BeatSpan;
}
