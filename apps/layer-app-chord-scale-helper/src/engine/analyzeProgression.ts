/**
 * Single pipeline: chord symbol list → key, alternates, modulation, optional per-chord data.
 * Used by the key-modulation test harness and by future UI.
 */

import type { Key } from '../domain/key.js';
import type { RootSemitone } from '../domain/key.js';
import { ROOT_NAMES } from '../domain/key.js';
import { parseChordSymbol } from './chordParser.js';
import { getChordPitchClasses } from './chordTones.js';
import { inferKey } from './keyInference.js';
import { detectModulation } from './modulationDetection.js';

/** Key as string for comparison: "C:maj", "A:min". */
export function keyToString(key: Key): string {
  const rootName = ROOT_NAMES[key.root];
  return `${rootName}:${key.mode === 'major' ? 'maj' : 'min'}`;
}

export interface AnalysisResult {
  /** Primary key as "X:maj" or "X:min". */
  primaryKey: string;
  /** Alternate keys (same format). */
  alternates: string[];
  /** Whether modulation was detected (currently always false in engine). */
  modulated: boolean;
  /** Segment keys when modulated (empty for MVP). */
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

  const key = inferKey(segments, { chordRoots });
  const mod = detectModulation(chordRoots, key);

  const primaryKey = keyToString(key);
  const alternates = (key.alternates ?? []).map((a) => `${ROOT_NAMES[a.root]}:${a.mode === 'major' ? 'maj' : 'min'}`);

  const segmentKeys: Array<{ startChordIdx: number; endChordIdx: number; key: string }> =
    mod.segmentKeys?.map((s) => ({
      startChordIdx: s.startIndex,
      endChordIdx: s.endIndex,
      key: keyToString(s.key),
    })) ?? [];

  return {
    primaryKey,
    alternates,
    modulated: mod.modulated,
    ...(segmentKeys.length > 0 && { segmentKeys }),
    errors,
    confidence: key.confidence,
  };
}
