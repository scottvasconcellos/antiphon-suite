/**
 * Key inference from segment pitch-class data (Krumhansl-Schmuckler style)
 * with cadence weighting, first/last tonic bonus, and alternates when ambiguous.
 */

import type { Key } from '../domain/key.js';
import type { RootSemitone } from '../domain/key.js';

// Krumhansl-Schmuckler key-finding profiles (C major and A minor)
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

/** Options for key inference when chord roots are available. */
export interface InferKeyOptions {
  /** Chord roots in order (for cadence and first/last tonic). */
  chordRoots?: RootSemitone[];
  /** Bonus weight for profile correlation (default 1). */
  profileWeight?: number;
  /** Bonus when last two chords form V–I or V7–I (authentic cadence). */
  cadenceBonus?: number;
  /** Bonus when first chord root is key tonic. */
  firstTonicBonus?: number;
  /** Bonus when last chord root is key tonic. */
  lastTonicBonus?: number;
  /** Return up to N alternates when score is within this ratio of best (e.g. 0.95). */
  alternateThreshold?: number;
}

const DEFAULT_OPTIONS: Required<InferKeyOptions> = {
  chordRoots: [],
  profileWeight: 1,
  cadenceBonus: 0.15,
  firstTonicBonus: 0.08,
  lastTonicBonus: 0.1,
  alternateThreshold: 0.92,
};

function rotateProfile(profile: number[], shift: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 12; i++) out[(i + shift) % 12] = profile[i];
  return out;
}

function buildHistogram(segments: number[][]): number[] {
  const hist = new Array(12).fill(0);
  for (const seg of segments) {
    for (const pc of seg) {
      const i = ((pc % 12) + 12) % 12;
      hist[i] += 1;
    }
  }
  return hist;
}

/** Pearson correlation between two length-12 arrays. */
function correlation(a: number[], b: number[]): number {
  let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0, n = 12;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
    sumAB += a[i] * b[i];
    sumA2 += a[i] * a[i];
    sumB2 += b[i] * b[i];
  }
  const num = n * sumAB - sumA * sumB;
  const den = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
  if (den === 0) return 0;
  return num / den;
}

function toConfidence(r: number): number {
  return Math.max(0, Math.min(1, (r + 1) / 2));
}

/** Dominant root in key: P5 above tonic = 7 semitones. */
function isAuthenticCadence(keyRoot: number, mode: 'major' | 'minor', secondToLast: number, last: number): boolean {
  const tonic = (last - keyRoot + 12) % 12;
  const dom = (secondToLast - keyRoot + 12) % 12;
  if (tonic !== 0) return false;
  return dom === 7;
}

/**
 * Infer key from segments (each segment = array of pitch classes 0–11).
 * Optional chord roots enable cadence and first/last tonic weighting; alternates returned when ambiguous.
 */
export function inferKey(segments: number[][], options?: InferKeyOptions): Key {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const hist = buildHistogram(segments);
  const roots = opts.chordRoots;
  const firstRoot = roots.length > 0 ? roots[0] : null;
  const lastRoot = roots.length > 0 ? roots[roots.length - 1] : null;
  const secondToLastRoot = roots.length >= 2 ? roots[roots.length - 2] : null;

  type Candidate = { root: RootSemitone; mode: 'major' | 'minor'; score: number };
  const candidates: Candidate[] = [];

  for (let root = 0; root < 12; root++) {
    const majorProfile = rotateProfile(MAJOR_PROFILE, root);
    const minorProfile = rotateProfile(MINOR_PROFILE, root);
    const cMaj = correlation(hist, majorProfile);
    const cMin = correlation(hist, minorProfile);

    let scoreMaj = opts.profileWeight * cMaj;
    let scoreMin = opts.profileWeight * cMin;

    if (roots.length > 0) {
      if (firstRoot !== null && (firstRoot - root + 12) % 12 === 0) {
        scoreMaj += opts.firstTonicBonus;
        scoreMin += opts.firstTonicBonus;
      }
      if (lastRoot !== null && (lastRoot - root + 12) % 12 === 0) {
        scoreMaj += opts.lastTonicBonus;
        scoreMin += opts.lastTonicBonus;
      }
      // Arpeggiation bonus: if progression is short (≤5 chords) and starts/ends on same root, strongly favor that root
      if (firstRoot !== null && lastRoot !== null && firstRoot === lastRoot && (firstRoot - root + 12) % 12 === 0 && roots.length <= 5) {
        const uniqueRoots = new Set(roots);
        if (uniqueRoots.size <= 4) {
          // Very likely an arpeggiation - boost significantly
          scoreMaj += 0.25;
          scoreMin += 0.25;
        }
      }
      if (secondToLastRoot !== null && lastRoot !== null) {
        if (isAuthenticCadence(root, 'major', secondToLastRoot, lastRoot)) scoreMaj += opts.cadenceBonus;
        if (isAuthenticCadence(root, 'minor', secondToLastRoot, lastRoot)) scoreMin += opts.cadenceBonus;
      }
      // Slight minor preference when bookended by same root, flat-side color (bVII, bVI, bIII), and minor is already close to major
      if (firstRoot !== null && lastRoot !== null && firstRoot === lastRoot && (firstRoot - root + 12) % 12 === 0) {
        const flatSide = [3, 8, 10]; // bIII, bVI, bVII (strong minor color)
        const count = roots.filter((r) => flatSide.includes((r - root + 12) % 12)).length;
        // If we see bIII (like Eb in C), strongly favor minor
        const hasFlatIII = roots.some((r) => (r - root + 12) % 12 === 3);
        if (hasFlatIII && scoreMin >= scoreMaj - 0.2) scoreMin += 0.12; // Stronger boost for bIII
        else if (count >= 2 && scoreMin >= scoreMaj - 0.15) scoreMin += 0.065;
      }
    }

    candidates.push({ root: root as RootSemitone, mode: 'major', score: scoreMaj });
    candidates.push({ root: root as RootSemitone, mode: 'minor', score: scoreMin });
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const bestScore = best.score;
  const alternates = candidates
    .slice(1)
    .filter((c) => c.score >= opts.alternateThreshold * bestScore)
    .slice(0, 3)
    .map((c) => ({ root: c.root, mode: c.mode, confidence: toConfidence(c.score) }));

  return {
    root: best.root,
    mode: best.mode,
    confidence: toConfidence(bestScore),
    ...(alternates.length > 0 && { alternates }),
  };
}
