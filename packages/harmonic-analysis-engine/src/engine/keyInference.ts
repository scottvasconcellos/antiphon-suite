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
  firstTonicBonus: 0.15, // Increased from 0.08 to strengthen first chord bonus
  lastTonicBonus: 0.1, // Keep at 0.1 (already increased from default 0.02 in modulationDetection)
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

const MAJOR_DEGREES = [0, 2, 4, 5, 7, 9, 11];

function allRootsDiatonicInMajor(roots: number[], keyRoot: number): boolean {
  for (const r of roots) {
    if (!MAJOR_DEGREES.includes((r - keyRoot + 12) % 12)) return false;
  }
  return true;
}

/** Parallel minor boost from bIII, bVI, no leading tone. Only when root is stable (≥2 or bookended). */
function parallelMinorBoost(root: number, roots: number[], firstRoot: number | null, lastRoot: number | null): number {
  const hasB3 = roots.some((r) => (r - root + 12) % 12 === 3);
  const hasB6 = roots.some((r) => (r - root + 12) % 12 === 8);
  const noLeadingTone = !roots.some((r) => (r - root + 12) % 12 === 10);
  const tonicCount = roots.filter((r) => (r - root + 12) % 12 === 0).length;
  const stable = tonicCount >= 2 || (firstRoot === root && lastRoot === root);
  if (!stable) return 0;
  let boost = 0;
  if (hasB3) boost += 0.18;
  if (hasB6) boost += 0.10;
  if (noLeadingTone) boost += 0.05;
  return boost;
}

const PARALLEL_MODE_MARGIN = 0.06;

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
        // Tonic prevalence: first chord root repeated strongly favors that key (e.g. K081 inversions in C)
        const tonicCount = roots.filter((r) => (r - root + 12) % 12 === 0).length;
        if (tonicCount >= 2) {
          const prevalenceBonus = Math.min(0.28, (tonicCount - 1) * 0.09); // Slightly increased for K081
          scoreMaj += prevalenceBonus;
          scoreMin += prevalenceBonus;
        }
        // Additional boost when first chord is repeated at the end (strong bookending)
        // But reduce this if there are many different roots (indicates inversions, not key change)
        const uniqueRoots = new Set(roots);
        const isLikelyInversions = uniqueRoots.size <= roots.length * 0.6 && roots.length >= 6; // Many repeats suggests inversions
        if (lastRoot !== null && firstRoot === lastRoot && roots.length >= 4) {
          const bookendBonus = isLikelyInversions ? 0.16 : 0.12; // Stronger for inversion-heavy progressions
          scoreMaj += bookendBonus;
          scoreMin += bookendBonus;
        }
        // For K081: if first chord appears multiple times and progression has inversions (many roots repeated),
        // give extra boost to first chord key, but be careful not to overdo it
        if (tonicCount >= 3 && uniqueRoots.size <= roots.length * 0.7 && roots.length >= 6) {
          const inversionBonus = 0.12; // Moderate boost for inversion-heavy progressions starting on tonic
          scoreMaj += inversionBonus;
          scoreMin += inversionBonus;
        }
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
      // Middle cadence (e.g. ii–V–I–IV): any adjacent V–I favors that tonic so we don't pick IV as key
      for (let i = 0; i < roots.length - 1; i++) {
        const domRoot = roots[i];
        const tonRoot = roots[i + 1];
        if ((root - tonRoot + 12) % 12 === 0 && (domRoot - tonRoot + 12) % 12 === 7) {
          const boost = roots.length <= 5 ? 0.22 : opts.cadenceBonus * 0.8;
          scoreMaj += boost;
          scoreMin += boost;
          break;
        }
      }
      // ii–V–I–IV (4 chords): roots[1] V of roots[2], roots[3] IV of roots[2]; strong bonus for roots[2] as tonic
      if (roots.length === 4 && (roots[1] - roots[2] + 12) % 12 === 7 && (roots[3] - roots[2] + 12) % 12 === 5) {
        if ((root - roots[2] + 12) % 12 === 0) {
          scoreMaj += 0.28;
          scoreMin += 0.28;
        }
      }
      // Parallel minor: add boost from bIII, bVI, no leading tone; margin so minor wins only when clearly ahead
      const boost = parallelMinorBoost(root, roots, firstRoot, lastRoot);
      scoreMin += boost - (boost > 0 ? PARALLEL_MODE_MARGIN : 0);
    }

    candidates.push({ root: root as RootSemitone, mode: 'major', score: scoreMaj });
    candidates.push({ root: root as RootSemitone, mode: 'minor', score: scoreMin });
  }

  // vi-ending demotion: when one major key has all chords diatonic, progression ends on its vi, no V-i to vi, major has cadence → prefer major
  const majScores = new Map<number, number>();
  candidates.forEach((c) => { if (c.mode === 'major') majScores.set(c.root, c.score); });
  if (roots.length >= 3 && roots.length <= 8 && lastRoot !== null) {
    for (let majorRoot = 0; majorRoot < 12; majorRoot++) {
      const viRoot = (majorRoot + 9) % 12;
      if (lastRoot !== viRoot) continue;
      if (!allRootsDiatonicInMajor(roots, majorRoot)) continue;
      const viCount = roots.filter((r) => r === viRoot).length;
      if (viCount !== 1) continue; // vi only at end
      const hasVIcadence = (() => {
        for (let i = 0; i < roots.length - 1; i++)
          if (roots[i + 1] === viRoot && (roots[i] - viRoot + 12) % 12 === 7) return true;
        return false;
      })();
      const majorHasCadence = (() => {
        for (let i = 0; i < roots.length - 1; i++) {
          if (roots[i + 1] !== majorRoot) continue;
          const rel = (roots[i] - majorRoot + 12) % 12;
          if (rel === 7 || rel === 5) return true; // V-I or IV-I
        }
        return false;
      })();
      // Prefer major when it has a cadence and progression opens in major (I, IV, or V) even if vi has V-i at end
      const firstRel = firstRoot !== null ? (firstRoot - majorRoot + 12) % 12 : -1;
      const opensInMajor = firstRel === 0 || firstRel === 5 || firstRel === 7;
      if (majorHasCadence && (opensInMajor || !hasVIcadence)) {
        for (const c of candidates) {
          if (c.mode === 'minor' && c.root === viRoot) {
            const majScore = majScores.get(majorRoot) ?? 0;
            c.score = Math.min(c.score, majScore - 0.10); // end-only vi: cap so major wins (K079)
            break;
          }
        }
        break; // applied for this majorRoot
      }
    }
  }

  // First-chord tie-breaker for ambiguous major vs relative minor (EQ-F222: G Em C D Em → prefer G:maj)
  // Research: Prefer major for vi-IV-I-V patterns (K112, K122): Score major mode +10% if I-V cadence present despite vi start
  if (roots.length >= 3 && roots.length <= 6 && firstRoot !== null) {
    const majorRoot = firstRoot;
    const viRoot = (majorRoot + 9) % 12;
    const hasVIcadence = (() => {
      for (let i = 0; i < roots.length - 1; i++)
        if (roots[i + 1] === viRoot && (roots[i] - viRoot + 12) % 12 === 7) return true;
      return false;
    })();
    // Check for vi-IV-I-V pattern: first chord is vi, then IV, then I, then V
    const isViIVIVPattern = roots.length === 4 && 
      roots[0] === viRoot && 
      (roots[1] - majorRoot + 12) % 12 === 5 && // IV
      roots[2] === majorRoot && // I
      (roots[3] - majorRoot + 12) % 12 === 7; // V
    // Check for I-V cadence (V-I or I-V)
    const hasIVCadence = (() => {
      for (let i = 0; i < roots.length - 1; i++) {
        const rel = (roots[i + 1] - majorRoot + 12) % 12;
        if (roots[i] === majorRoot && rel === 7) return true; // I-V
        if (rel === 0 && (roots[i] - majorRoot + 12) % 12 === 7) return true; // V-I
      }
      return false;
    })();
    if (!hasVIcadence || (isViIVIVPattern && hasIVCadence)) {
      const majC = candidates.find((c) => c.mode === 'major' && c.root === majorRoot);
      const minC = candidates.find((c) => c.mode === 'minor' && c.root === viRoot);
      if (majC && minC && minC.score > majC.score) {
        const gap = minC.score - majC.score;
        // Research: +10% for vi-IV-I-V patterns with I-V cadence
        const bonus = isViIVIVPattern && hasIVCadence ? Math.min(0.28, gap + 0.10) : Math.min(0.18, gap + 0.02);
        majC.score += bonus; // prefer major when first chord is I and no V-i to vi (EQ-F222)
      }
    }
  }
  // Research: For short (<4 chords), tie-break by first chord quality (maj > min)
  if (roots.length < 4 && firstRoot !== null) {
    const majorRoot = firstRoot;
    const viRoot = (majorRoot + 9) % 12;
    const majC = candidates.find((c) => c.mode === 'major' && c.root === majorRoot);
    const minC = candidates.find((c) => c.mode === 'minor' && c.root === viRoot);
    // If scores are close, prefer major (maj > min)
    if (majC && minC && Math.abs(majC.score - minC.score) < 0.15) {
      majC.score += 0.10; // Tie-break bonus for major
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const bestScore = best.score;
  const secondBest = candidates[1];
  const margin = secondBest ? (bestScore - secondBest.score) / (Math.abs(bestScore) + 1e-6) : 1;
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
    margin,
  };
}

/** Result of key inference with margin (for two-track commitment). */
export interface InferKeyWithMarginResult {
  key: Key;
  /** Margin between best and second-best key (normalized); use for commitMarginThreshold. */
  margin: number;
}

/**
 * Infer key and margin (two-track: commit only when margin exceeds threshold).
 */
export function inferKeyWithMargin(segments: number[][], options?: InferKeyOptions): InferKeyWithMarginResult {
  const key = inferKey(segments, options);
  return { key, margin: key.margin ?? 0 };
}
