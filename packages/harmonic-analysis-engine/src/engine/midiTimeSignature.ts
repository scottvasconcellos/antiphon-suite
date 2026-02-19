/**
 * Time signature from MIDI meta events.
 * If no meta event is present, returns default 4/4 (MVP).
 */

import type { TimeSignature } from '../domain/beatMeasure.js';

export interface MidiTimeSignatureMeta {
  numerator: number;
  denominator: number;
}

const DEFAULT: TimeSignature = { numerator: 4, denominator: 4 };

/**
 * Get TimeSignature from MIDI time-signature meta event.
 * When meta is absent or invalid, returns default 4/4.
 */
export function getTimeSignatureFromMidiMeta(meta: MidiTimeSignatureMeta | null | undefined): TimeSignature {
  if (meta == null) return DEFAULT;
  const num = Number(meta.numerator);
  const den = Number(meta.denominator);
  if (!Number.isFinite(num) || !Number.isFinite(den) || num < 1 || den < 1) return DEFAULT;
  return { numerator: num, denominator: den };
}
