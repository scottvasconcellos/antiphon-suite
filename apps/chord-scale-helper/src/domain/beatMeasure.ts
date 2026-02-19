/**
 * Beat and measure structure for progression and export.
 * Foundation domain — types only.
 */

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

/** Position in a progression: measure index (0-based) and beat within measure. */
export interface BeatPosition {
  measureIndex: number;
  beatInMeasure: number;
}

/** Span of beats (start inclusive, duration in beats). */
export interface BeatSpan {
  startBeat: number;
  durationBeats: number;
}

/** Measure-aligned span for export (measure index and beat offset). */
export interface MeasureAlignedSpan {
  measureIndex: number;
  beatOffset: number;
  durationBeats: number;
}
