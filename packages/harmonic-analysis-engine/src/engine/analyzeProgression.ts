/**
 * Single pipeline: chord symbol list → key, alternates, modulation, optional per-chord data.
 * Full progression: Progression (with beat spans) → AnalyzedProgression (one chord-scale per chord).
 */

import type { Key, RootSemitone } from '../domain/key.js';
import { ROOT_NAMES } from '../domain/key.js';
import type { ChordQuality } from '../domain/chord.js';
import type { ChordScaleAssignment } from '../domain/chordScaleAssignment.js';
import type { Progression, AnalyzedProgression } from '../domain/progression.js';
import type { Scale } from '../domain/scale.js';
import { parseChordSymbol } from './chordParser.js';
import { getChordPitchClasses } from './chordTones.js';
import { runKeyDecisionPipeline } from './keyDecisionPipeline.js';
import { getRomanNumeral } from './romanNumeralAnalysis.js';
import { getChordScale } from './chordScaleSelector.js';
import { checkConsistency } from './consistencyChecker.js';

/** Key as string for comparison: "C:maj", "A:min". */
export function keyToString(key: { root: number; mode: string }): string {
  const rootName = ROOT_NAMES[key.root as RootSemitone];
  return `${rootName}:${key.mode === 'major' ? 'maj' : 'min'}`;
}

export interface AnalysisResult {
  /** Primary key as "X:maj" or "X:min". */
  primaryKey: string;
  /** Alternate keys (same format). */
  alternates: string[];
  /** Whether modulation was detected. */
  modulated: boolean;
  /** Segment keys when modulated. */
  segmentKeys?: Array<{ startChordIdx: number; endChordIdx: number; key: string }>;
  /** Parse errors (symbol and message). */
  errors: Array<{ symbol: string; message: string }>;
  /** Confidence 0–1 of primary key when inferred. */
  confidence?: number;
}

/**
 * Analyze a progression from chord symbols: infer key, alternates, and modulation.
 * Segments are built from chord tones (one segment per chord); chord roots drive cadence/first/last bonuses.
 */
export function analyzeProgressionFromSymbols(symbols: string[]): AnalysisResult {
  const errors: Array<{ symbol: string; message: string }> = [];
  const parsed: Array<{ root: RootSemitone; quality: string }> = [];

  for (const sym of symbols) {
    try {
      const p = parseChordSymbol(sym.trim());
      parsed.push({ root: p.root, quality: p.quality });
    } catch (e) {
      errors.push({ symbol: sym, message: e instanceof Error ? e.message : String(e) });
    }
  }

  if (parsed.length === 0) {
    return {
      primaryKey: 'C:maj',
      alternates: [],
      modulated: false,
      errors,
    };
  }

  const segments: number[][] = parsed.map(({ root, quality }) =>
    getChordPitchClasses(root, quality as import('../domain/chord.js').ChordQuality)
  );
  const chordRoots: RootSemitone[] = parsed.map((p) => p.root);
  const chordQualities: string[] = parsed.map((p) => p.quality);

  const result = runKeyDecisionPipeline(
    { chordRoots, segments, chordQualities }
  );
  const { key, modulated, segmentKeys: rawSegmentKeys } = result;

  // When modulation is detected, report the start key as primary so keyStart matches ground truth
  const primaryKey =
    modulated && rawSegmentKeys?.length
      ? keyToString(rawSegmentKeys[0].key)
      : keyToString(key);
  let alternates = (key.alternates ?? []).map((a) => `${ROOT_NAMES[a.root]}:${a.mode === 'major' ? 'maj' : 'min'}`);
  if (modulated && rawSegmentKeys && rawSegmentKeys.length >= 2) {
    const endKeyStr = keyToString(rawSegmentKeys[rawSegmentKeys.length - 1].key);
    if (primaryKey !== endKeyStr && !alternates.includes(endKeyStr)) alternates = [endKeyStr, ...alternates].slice(0, 3);
  }

  const segmentKeys: Array<{ startChordIdx: number; endChordIdx: number; key: string }> =
    rawSegmentKeys?.map((s) => ({
      startChordIdx: s.startIndex,
      endChordIdx: s.endIndex,
      key: keyToString(s.key),
    })) ?? [];

  return {
    primaryKey,
    alternates,
    modulated,
    ...(segmentKeys.length > 0 && { segmentKeys }),
    errors,
    confidence: key.confidence,
  };
}

/** Parse "C:maj" / "A:min" into Key. Uses sharp spellings from ROOT_NAMES. */
function keyFromString(s: string): Key {
  const [rootPart, modePart] = s.split(':');
  const nameToRoot: Record<string, RootSemitone> = {};
  for (let i = 0; i <= 11; i++) {
    const r = i as RootSemitone;
    nameToRoot[ROOT_NAMES[r]] = r;
  }
  const root = (nameToRoot[rootPart ?? ''] ?? 0) as RootSemitone;
  const mode = (modePart === 'min' ? 'minor' : 'major') as Key['mode'];
  return { root, mode };
}

/** Scale degrees (1–7) that are chord tones for this quality in the given scale (intervals from chord root). */
function getChordToneDegrees(scale: Scale, quality: ChordQuality): number[] {
  const chordIntervals = getChordPitchClasses(0 as RootSemitone, quality);
  const degrees: number[] = [];
  for (const interval of chordIntervals) {
    const idx = scale.intervals.indexOf(interval);
    if (idx >= 0) degrees.push(idx + 1);
  }
  return degrees.length > 0 ? degrees.sort((a, b) => a - b) : [1];
}

/**
 * Build full AnalyzedProgression from a Progression (chords with symbol, root, quality, span).
 * Uses analyzeProgressionFromSymbols for key/segments, then assigns one chord-scale per chord
 * and runs consistency checks.
 */
export function analyzeProgression(progression: Progression): AnalyzedProgression {
  const symbols = progression.chords.map((c) => c.symbol);
  const result = analyzeProgressionFromSymbols(symbols);
  const primaryKey = keyFromString(result.primaryKey);

  const segmentKeyForIndex = (index: number): Key => {
    if (result.segmentKeys && result.modulated) {
      for (const seg of result.segmentKeys) {
        if (index >= seg.startChordIdx && index <= seg.endChordIdx) return keyFromString(seg.key);
      }
    }
    return primaryKey;
  };

  const assignments: ChordScaleAssignment[] = [];
  for (let i = 0; i < progression.chords.length; i++) {
    const chord = progression.chords[i];
    const key = segmentKeyForIndex(i);
    const rn = getRomanNumeral(key, chord.root, chord.quality as ChordQuality);
    const scale = getChordScale(key, chord.root, chord.quality as ChordQuality, rn.degree);
    const chordToneDegrees = getChordToneDegrees(scale, chord.quality as ChordQuality);
    const cons = checkConsistency(key, chord.root, chord.quality as ChordQuality, scale, rn);
    if (!cons.valid && cons.errors.length > 0) {
      // Still assign; caller can surface errors
    }
    assignments.push({
      chordId: chord.id,
      scale,
      romanNumeral: rn,
      chordToneDegrees,
    });
  }

  return { progression, assignments };
}
