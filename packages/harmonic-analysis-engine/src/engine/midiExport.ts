/**
 * Export analyzed progression to a structure aligned to measure/beat for MIDI or DAW.
 */

import type { AnalyzedProgression } from '../domain/progression.js';

/** One row in the scale map: chord + scale aligned to beat span. */
export interface ScaleMapEntry {
  startBeat: number;
  durationBeats: number;
  chordId: string;
  chordSymbol: string;
  scaleName: string;
  romanNumeralSymbol: string;
}

/**
 * Build a scale map from analyzed progression: one entry per chord with start/duration,
 * chord symbol, scale name, and Roman numeral. Aligned to progression's beat structure
 * for MIDI or DAW export.
 */
export function buildScaleMapForExport(analyzed: AnalyzedProgression): ScaleMapEntry[] {
  const { progression, assignments } = analyzed;
  const entries: ScaleMapEntry[] = [];
  for (let i = 0; i < progression.chords.length; i++) {
    const chord = progression.chords[i];
    const assignment = assignments[i];
    if (!assignment || assignment.chordId !== chord.id) continue;
    entries.push({
      startBeat: chord.span.startBeat,
      durationBeats: chord.span.durationBeats,
      chordId: chord.id,
      chordSymbol: chord.symbol,
      scaleName: assignment.scale.name,
      romanNumeralSymbol: assignment.romanNumeral.symbol,
    });
  }
  return entries;
}
