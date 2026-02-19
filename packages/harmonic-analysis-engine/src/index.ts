/**
 * @antiphon/harmonic-analysis-engine — public API.
 * Re-exports engine (key inference, modulation, chord-scale, Roman numerals, etc.) and domain types.
 */

export {
  parseChordSymbol,
  chordToSymbol,
  parseTimeSignature,
  getChordPitchClasses,
  inferKey,
  getRomanNumeral,
  isBorrowedChord,
  getAppliedToDegree,
  detectModulation,
  getChordScale,
  scaleHasNoAvoidNote,
  checkConsistency,
  scaleContainsChordTones,
  romanNumeralConsistentWithKey,
  getTimeSignatureFromMidiMeta,
  getChordFromPitchClassSet,
  buildScaleMapForExport,
  buildProgressionFromChordEvents,
  analyzeProgressionFromSymbols,
  analyzeProgression,
  keyToString,
  runKeyDecisionPipeline,
  DEFAULT_KEY_MODULATION_PARAMS,
} from './engine/index.js';

export type {
  ParsedChord,
  InferKeyOptions,
  ModulationResult,
  ConsistencyResult,
  MidiTimeSignatureMeta,
  ChordFromPCSet,
  ScaleMapEntry,
  ChordEventInput,
  BuildProgressionOptions,
  AnalysisResult,
  PipelineInput,
  PipelineResult,
  KeyModulationParams,
} from './engine/index.js';

export type {
  Key,
  Mode,
  RootSemitone,
  TimeSignature,
  BeatPosition,
  BeatSpan,
  MeasureAlignedSpan,
  Chord,
  ChordQuality,
  Scale,
  ScaleDegree,
  ChordTones,
  RomanNumeral,
  RomanNumeralQuality,
  ChordScaleAssignment,
  Progression,
  AnalyzedProgression,
} from './domain/index.js';

export { ROOT_NAMES } from './domain/index.js';
