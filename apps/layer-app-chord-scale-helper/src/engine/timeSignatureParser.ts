/**
 * Time signature parser for text input.
 * Default 4/4 when absent or invalid.
 */

import type { TimeSignature } from '../domain/beatMeasure.js';

const DEFAULT: TimeSignature = { numerator: 4, denominator: 4 };

/**
 * Parse a time signature string (e.g. "4/4", "3/4", "6/8") to TimeSignature.
 * Returns default 4/4 when input is absent, empty, or invalid.
 */
export function parseTimeSignature(input?: string | null): TimeSignature {
  if (input == null || input.trim() === '') return DEFAULT;
  const m = input.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return DEFAULT;
  const num = parseInt(m[1], 10);
  const den = parseInt(m[2], 10);
  if (!Number.isFinite(num) || !Number.isFinite(den) || num < 1 || den < 1) return DEFAULT;
  return { numerator: num, denominator: den };
}
