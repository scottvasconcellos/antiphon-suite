/**
 * Chord parser and time signature tests.
 */

import {
  parseChordSymbol,
  parseTimeSignature,
  getChordPitchClasses,
  inferKey,
  getRomanNumeral,
  getChordScale,
  checkConsistency,
  getTimeSignatureFromMidiMeta,
  getChordFromPitchClassSet,
  buildScaleMapForExport,
  analyzeProgression,
  buildProgressionFromChordEvents,
} from '@antiphon/harmonic-analysis-engine';
import type { AnalyzedProgression, RootSemitone } from '@antiphon/harmonic-analysis-engine';

function assertParse(
  symbol: string,
  expectedRoot: number,
  expectedQuality: string,
  expectedNorm?: string,
  expectedBass?: number
) {
  const p = parseChordSymbol(symbol);
  if (p.root !== expectedRoot) throw new Error(`${symbol}: expected root ${expectedRoot}, got ${p.root}`);
  if (p.quality !== expectedQuality) throw new Error(`${symbol}: expected quality ${expectedQuality}, got ${p.quality}`);
  if (expectedNorm != null && p.normalizedSymbol !== expectedNorm) throw new Error(`${symbol}: expected normalized "${expectedNorm}", got "${p.normalizedSymbol}"`);
  if (expectedBass !== undefined) {
    if (p.bass === undefined) throw new Error(`${symbol}: expected bass ${expectedBass}, got undefined`);
    if (p.bass !== expectedBass) throw new Error(`${symbol}: expected bass ${expectedBass}, got ${p.bass}`);
  }
}

// C = 0, D = 2, E = 4, F = 5, G = 7, A = 9, B = 11
console.log('Chord parser tests...');

// Triads
assertParse('C', 0, 'maj', 'C');
assertParse('Cmaj', 0, 'maj', 'C');
assertParse('CΔ', 0, 'maj', 'C');
assertParse('Dm', 2, 'min', 'Dm');
assertParse('Dmin', 2, 'min', 'Dm');
assertParse('Ebm', 3, 'min', 'D#m');
assertParse('F#', 6, 'maj', 'F#');
assertParse('Gdim', 7, 'dim');
assertParse('Gdim', 7, 'dim', 'Gdim');
assertParse('Go', 7, 'dim', 'Gdim');
assertParse('Aaug', 9, 'aug');
assertParse('A+', 9, 'aug');

// Sevenths
assertParse('Cmaj7', 0, 'maj7', 'Cmaj7');
assertParse('CΔ7', 0, 'maj7');
assertParse('CM7', 0, 'maj7');
assertParse('Dm7', 2, 'min7', 'Dm7');
assertParse('Dmin7', 2, 'min7');
assertParse('G7', 7, '7', 'G7');
assertParse('Fm7b5', 5, 'm7b5');
assertParse('Fø', 5, 'm7b5');
assertParse('Fø7', 5, 'm7b5');
assertParse('Bdim7', 11, 'dim7');
assertParse('Bo7', 11, 'dim7');
assertParse('Cmmaj7', 0, 'mmaj7');
assertParse('CmΔ7', 0, 'mmaj7');

// Extensions / alterations
assertParse('Cmaj7#11', 0, 'maj7#11');
assertParse('C7#11', 0, '7#11');
assertParse('C7alt', 0, '7alt');
assertParse('C7b9', 0, '7b9');

// Sus
assertParse('Csus2', 0, 'sus2');
assertParse('Csus4', 0, 'sus4');
assertParse('Csus', 0, 'sus4');

// Slash
assertParse('C/G', 0, 'maj', 'C/G', 7);
assertParse('Dm7/A', 2, 'min7', undefined, 9);
assertParse('Bb/C', 10, 'maj', undefined, 0);

// Roots with accidentals
assertParse('F#m7', 6, 'min7', 'F#m7');
assertParse('Abmaj7', 8, 'maj7');
assertParse('Bbm7', 10, 'min7');

// Invalid
try {
  parseChordSymbol('');
  throw new Error('Expected error for empty');
} catch (e) {
  if (!(e instanceof Error) || !e.message.includes('Empty')) throw e;
}
try {
  parseChordSymbol('X7');
  throw new Error('Expected error for invalid root');
} catch (e) {
  if (!(e instanceof Error) || !e.message.includes('Invalid root')) throw e;
}
try {
  parseChordSymbol('Cfoo');
  throw new Error('Expected error for unknown quality');
} catch (e) {
  if (!(e instanceof Error) || !e.message.includes('Unrecognized')) throw e;
}

// Time signature
const t44 = parseTimeSignature('4/4');
if (t44.numerator !== 4 || t44.denominator !== 4) throw new Error(`4/4: got ${t44.numerator}/${t44.denominator}`);
const t34 = parseTimeSignature('3/4');
if (t34.numerator !== 3 || t34.denominator !== 4) throw new Error(`3/4: got ${t34.numerator}/${t34.denominator}`);
const def = parseTimeSignature(undefined);
if (def.numerator !== 4 || def.denominator !== 4) throw new Error(`default: got ${def.numerator}/${def.denominator}`);
const bad = parseTimeSignature('x');
if (bad.numerator !== 4 || bad.denominator !== 4) throw new Error(`invalid: got ${bad.numerator}/${bad.denominator}`);

// Chord tones
const cmaj = getChordPitchClasses(0, 'maj');
if (cmaj.length !== 3 || !cmaj.includes(0) || !cmaj.includes(4) || !cmaj.includes(7)) throw new Error('Cmaj PCs: ' + cmaj.join(','));

// Key inference: C-F-G (I-IV-V in C) should yield C major
const segments = [[0, 4, 7], [5, 9, 0], [7, 11, 2]];
const key = inferKey(segments);
if (key.root !== 0 || key.mode !== 'major') throw new Error(`inferKey C-F-G: expected C major, got root=${key.root} mode=${key.mode}`);

// Roman numerals in C major
const rn1 = getRomanNumeral({ root: 0, mode: 'major' }, 0, 'maj');
if (rn1.symbol !== 'I' || rn1.degree !== 1) throw new Error('C maj in C: expected I, got ' + rn1.symbol);
const rn5 = getRomanNumeral({ root: 0, mode: 'major' }, 7, '7');
if (rn5.symbol !== 'V7' || rn5.degree !== 5) throw new Error('G7 in C: expected V7, got ' + rn5.symbol);
const rn2 = getRomanNumeral({ root: 0, mode: 'major' }, 2, 'min7');
if (rn2.symbol !== 'ii' || rn2.degree !== 2) throw new Error('Dm7 in C: expected ii, got ' + rn2.symbol);

// Chord-scale and consistency: Dm7 in C → Dorian, scale contains chord tones
const keyC = { root: 0 as const, mode: 'major' as const };
const scaleDm7 = getChordScale(keyC, 2, 'min7', 2);
if (scaleDm7.name !== 'Dorian') throw new Error('Dm7 scale: expected Dorian, got ' + scaleDm7.name);
const cons = checkConsistency(keyC, 2, 'min7', scaleDm7, rn2);
if (!cons.valid) throw new Error('Consistency: ' + cons.errors.join('; '));

// MIDI time sig: default when no meta
const midiDefault = getTimeSignatureFromMidiMeta(null);
if (midiDefault.numerator !== 4 || midiDefault.denominator !== 4) throw new Error('MIDI default: ' + JSON.stringify(midiDefault));
const midi34 = getTimeSignatureFromMidiMeta({ numerator: 3, denominator: 4 });
if (midi34.numerator !== 3 || midi34.denominator !== 4) throw new Error('MIDI 3/4: ' + JSON.stringify(midi34));

// Chord from PC set: C major triad + bass C
const cTriad = getChordFromPitchClassSet([0, 4, 7, 12, 16, 19], 0);
if (cTriad.root !== 0 || cTriad.quality !== 'maj') throw new Error('PC set Cmaj: root=' + cTriad.root + ' quality=' + cTriad.quality);
const g7 = getChordFromPitchClassSet([7, 11, 14, 17], 7);
if (g7.root !== 7 || g7.quality !== '7') throw new Error('PC set G7: root=' + g7.root + ' quality=' + g7.quality);

// Scale map export (minimal AnalyzedProgression)
const prog = {
  id: 'p1',
  chords: [{ id: 'c1', symbol: 'Cmaj7', root: 0 as RootSemitone, quality: 'maj7' as const, span: { startBeat: 0, durationBeats: 4 } }],
  timeSignature: { numerator: 4, denominator: 4 },
  key: { root: 0 as RootSemitone, mode: 'major' as const },
};
const scale = { id: 'ionian', name: 'Ionian', intervals: [0, 2, 4, 5, 7, 9, 11] };
const rn = { symbol: 'I', degree: 1, quality: 'major' as const };
const analyzed: AnalyzedProgression = { progression: prog, assignments: [{ chordId: 'c1', scale, romanNumeral: rn, chordToneDegrees: [1, 3, 5, 7] }] };
const map = buildScaleMapForExport(analyzed);
if (map.length !== 1 || map[0].scaleName !== 'Ionian' || map[0].startBeat !== 0) throw new Error('Scale map: ' + JSON.stringify(map));

// analyzeProgression: full pipeline from Progression → AnalyzedProgression
const analyzedFromPipeline = analyzeProgression(prog);
if (analyzedFromPipeline.assignments.length !== 1) throw new Error('analyzeProgression: expected 1 assignment');
// Engine prefers Lydian for maj7 (no avoid note); Ionian is also valid
if (!['Ionian', 'Lydian'].includes(analyzedFromPipeline.assignments[0].scale.name)) throw new Error('analyzeProgression: expected Ionian or Lydian, got ' + analyzedFromPipeline.assignments[0].scale.name);
const map2 = buildScaleMapForExport(analyzedFromPipeline);
if (map2.length !== 1 || map2[0].romanNumeralSymbol !== 'I') throw new Error('analyzeProgression scale map: ' + JSON.stringify(map2));

// buildProgressionFromChordEvents: PC set + bass + beats → Progression → analyzeProgression
const events = [
  { pitchClasses: [0, 4, 7], bass: 0, startBeat: 0, durationBeats: 4 },
  { pitchClasses: [7, 11, 14, 17], bass: 7, startBeat: 4, durationBeats: 2 },
  { pitchClasses: [0, 4, 7], bass: 0, startBeat: 6, durationBeats: 4 },
];
const progFromEvents = buildProgressionFromChordEvents(events);
if (progFromEvents.chords.length !== 3) throw new Error('buildProgressionFromChordEvents: expected 3 chords');
if (progFromEvents.chords[0].symbol !== 'C' || progFromEvents.chords[1].symbol !== 'G7') throw new Error('buildProgressionFromChordEvents: expected C, G7, C got ' + progFromEvents.chords.map((c) => c.symbol).join(', '));
const analyzedFromEvents = analyzeProgression(progFromEvents);
if (analyzedFromEvents.assignments.length !== 3) throw new Error('analyzeProgression(events): expected 3 assignments');

console.log('All chord parser, time signature, chord tones, key inference, Roman numeral, chord-scale, consistency, MIDI, export, analyzeProgression, and buildProgressionFromChordEvents tests passed.');
process.exit(0);
