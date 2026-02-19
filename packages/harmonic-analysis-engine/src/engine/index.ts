/**
 * Chord Scale Helper engine (Operations arc).
 */

export { parseChordSymbol, chordToSymbol, type ParsedChord } from './chordParser.js';
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
  buildProgressionFromChordEvents,
  type ChordEventInput,
  type BuildProgressionOptions,
} from './progressionFromChordEvents.js';
export {
  analyzeProgressionFromSymbols,
  analyzeProgression,
  keyToString,
  type AnalysisResult,
} from './analyzeProgression.js';
export { runKeyDecisionPipeline } from './keyDecisionPipeline.js';
export type { PipelineInput, PipelineResult } from './keyDecisionPipeline.js';
export { DEFAULT_KEY_MODULATION_PARAMS } from './keyModulationParams.js';
export type { KeyModulationParams } from './keyModulationParams.js';
