/**
 * Chord Scale Helper engine (Operations arc).
 */

export { parseChordSymbol, type ParsedChord } from './chordParser.js';
export { parseTimeSignature } from './timeSignatureParser.js';
export { getChordPitchClasses } from './chordTones.js';
export { inferKey, type InferKeyOptions } from './keyInference.js';
export { getRomanNumeral } from './romanNumeralAnalysis.js';
export { isBorrowedChord, getAppliedToDegree } from './borrowedModalDetection.js';
export { detectModulation, type ModulationResult } from './modulationDetection.js';
export { getChordScale, scaleHasNoAvoidNote } from './chordScaleSelector.js';
export {
  checkConsistency,
  scaleContainsChordTones,
  romanNumeralConsistentWithKey,
  type ConsistencyResult,
} from './consistencyChecker.js';
export { getTimeSignatureFromMidiMeta, type MidiTimeSignatureMeta } from './midiTimeSignature.js';
export { getChordFromPitchClassSet, type ChordFromPCSet } from './chordFromPitchClassSet.js';
export { buildScaleMapForExport, type ScaleMapEntry } from './midiExport.js';
export {
  analyzeProgressionFromSymbols,
  keyToString,
  type AnalysisResult,
} from './analyzeProgression.js';
