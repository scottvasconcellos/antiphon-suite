/**
 * Chord symbol parser with vernacular normalization.
 * Produces root, quality, optional bass, and canonical symbol.
 */

import type { ChordQuality } from '../domain/chord.js';
import type { RootSemitone } from '../domain/key.js';
import { ROOT_NAMES } from '../domain/key.js';

/** Result of parsing a chord symbol (no timing). */
export interface ParsedChord {
  root: RootSemitone;
  quality: ChordQuality;
  /** Slash bass note; absent if no slash. */
  bass?: RootSemitone;
  /** Canonical display form (sharp spellings, canonical quality). */
  normalizedSymbol: string;
}

const LETTER_TO_SEMITONE: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Quality regex: longest first. All normalized to canonical ChordQuality. */
const QUALITY_PATTERNS: Array<{ pattern: RegExp; quality: ChordQuality }> = [
  { pattern: /^maj7#11|Δ#11|MA7#11$/i, quality: 'maj7#11' },
  { pattern: /^7#11$/i, quality: '7#11' },
  { pattern: /^7alt$/i, quality: '7alt' },
  { pattern: /^7b9$/i, quality: '7b9' },
  { pattern: /^m7b5|ø7?|min7b5|halfdim$/i, quality: 'm7b5' },
  { pattern: /^dim7|o7$/i, quality: 'dim7' },
  { pattern: /^mmaj7|mΔ7|minmaj7$/i, quality: 'mmaj7' },
  { pattern: /^min7|m7$/i, quality: 'min7' },
  { pattern: /^maj7|Δ7|M7|MA7$/i, quality: 'maj7' },
  { pattern: /^sus2$/i, quality: 'sus2' },
  { pattern: /^sus4|sus$/i, quality: 'sus4' },
  { pattern: /^dim$|^o(?!7)$/i, quality: 'dim' },
  { pattern: /^min|m(?!7|aj|7b5)/i, quality: 'min' },
  { pattern: /^maj|Δ|M(?!7)|major$/i, quality: 'maj' },
  { pattern: /^7|dom7?$/i, quality: '7' },
  { pattern: /^aug|\+$/i, quality: 'aug' },
];

/** Canonical suffix for display (sharp spelling). */
const QUALITY_TO_SUFFIX: Record<ChordQuality, string> = {
  maj: '',
  maj7: 'maj7',
  min: 'm',
  min7: 'm7',
  '7': '7',
  m7b5: 'm7b5',
  dim: 'dim',
  dim7: 'dim7',
  sus2: 'sus2',
  sus4: 'sus4',
  aug: 'aug',
  'maj7#11': 'maj7#11',
  '7#11': '7#11',
  '7alt': '7alt',
  '7b9': '7b9',
  mmaj7: 'mmaj7',
};

function parseRoot(s: string): { root: RootSemitone; rest: string } {
  const trimmed = s.trim();
  if (trimmed.length === 0) throw new Error('Empty chord symbol');
  const letter = trimmed[0].toUpperCase();
  const semitone = LETTER_TO_SEMITONE[letter];
  if (semitone === undefined) throw new Error(`Invalid root letter: ${trimmed[0]}`);
  let i = 1;
  let acc = 0;
  while (i < trimmed.length && (trimmed[i] === '#' || trimmed[i] === 'b')) {
    acc += trimmed[i] === '#' ? 1 : -1;
    i++;
  }
  const root = ((semitone + acc) % 12 + 12) % 12 as RootSemitone;
  const rest = trimmed.slice(i).trim();
  return { root, rest };
}

function parseQuality(rest: string): ChordQuality {
  const q = rest.replace(/\s+/g, '');
  if (q === '') return 'maj';
  // Disambiguate M7 (maj7) vs m7 (min7): check min7 first so "m7" is not matched by M7 (i flag)
  if (q === 'm7' || /^min7$/i.test(q)) return 'min7';
  if (/^M7$|^MA7$|^maj7$/i.test(q)) return 'maj7';
  for (const { pattern, quality } of QUALITY_PATTERNS) {
    if (pattern.test(q)) return quality;
  }
  throw new Error(`Unrecognized chord quality: ${rest}`);
}

function parseBass(rest: string): { qualityPart: string; bass: RootSemitone } | null {
  const idx = rest.indexOf('/');
  if (idx === -1) return null;
  const qualityPart = rest.slice(0, idx).trim();
  const bassStr = rest.slice(idx + 1).trim();
  const { root: bass } = parseRoot(bassStr);
  return { qualityPart, bass };
}

/**
 * Parse a chord symbol into root, quality, optional bass, and normalized symbol.
 * @throws on invalid symbol
 */
export function parseChordSymbol(symbol: string): ParsedChord {
  const { root, rest } = parseRoot(symbol);
  const slash = parseBass(rest);
  let quality: ChordQuality;
  let bass: RootSemitone | undefined;
  if (slash) {
    quality = parseQuality(slash.qualityPart);
    bass = slash.bass;
  } else {
    quality = parseQuality(rest);
  }
  const normalizedSymbolOut = normalizedSymbol(root, quality, bass);
  return {
    root,
    quality,
    ...(bass !== undefined && { bass }),
    normalizedSymbol: normalizedSymbolOut,
  };
}

function normalizedSymbol(root: RootSemitone, quality: ChordQuality, bass?: RootSemitone): string {
  const rootName = ROOT_NAMES[root];
  const suffix = QUALITY_TO_SUFFIX[quality];
  const base = suffix ? `${rootName}${suffix}` : rootName;
  if (bass !== undefined) return `${base}/${ROOT_NAMES[bass]}`;
  return base;
}

/**
 * Format root + quality (and optional bass) as a chord symbol (sharp spelling).
 * Used when building a Progression from detected chords (e.g. MIDI → PC set → symbol).
 */
export function chordToSymbol(root: RootSemitone, quality: ChordQuality, bass?: RootSemitone): string {
  return normalizedSymbol(root, quality, bass);
}
