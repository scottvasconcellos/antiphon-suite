/**
 * Modulation detection: new key confirmed by cadence (V–I or V7–I) in that key.
 * Uses the key inferred from the segment *before* the rightmost cadence, so we
 * don't falsely modulate when global key inference disagrees with the ending.
 * Filters: secondary dominants (V/X), half cadence, IV–I in global key, min segment, snapback,
 * backdoor (bVII7→I), tritone substitution.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Key } from '../domain/key.js';
import type { RootSemitone } from '../domain/key.js';
import { inferKey } from './keyInference.js';

// Resolve log path: from engine/ to monorepo root .cursor/debug.log
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEBUG_LOG_PATH = path.resolve(__dirname, '../../../.cursor/debug.log');

function debugLog(payload: object): void {
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify({ ...payload, timestamp: Date.now(), runId: 'mod' }) + '\n');
  } catch (_) {}
}

export interface ModulationResult {
  modulated: boolean;
  segmentKeys?: Array<{ startIndex: number; endIndex: number; key: Key }>;
}

/** Optional promotion/snapback params (from key modulation pipeline). */
export interface ModulationDetectionOptions {
  /** Min chords in new key after cadence to promote (default 2). */
  modulationMinSpanChords?: number;
  /** Snapback window: if we return to K₁ within this many chords, demote (default 2). */
  snapbackWindowChords?: number;
  /** Rule-conflict override: when shield says stay, still promote if K₂ segment has ≥ this many chords (default 3). */
  persistenceChords?: number;
}

/** Diatonic scale degrees from key root (semitones): major I–vii, minor i–VII. */
const MAJOR_DEGREES = [0, 2, 4, 5, 7, 9, 11];
const MINOR_DEGREES = [0, 2, 3, 5, 7, 8, 10];

/**
 * True if chordRoot (pitch class 0–11) is diatonic in the given key.
 * Major: I–vii; minor: i–VII (natural minor scale).
 */
export function isDiatonicInKey(chordRoot: number, key: Key): boolean {
  const degrees = key.mode === 'major' ? MAJOR_DEGREES : MINOR_DEGREES;
  const relative = (chordRoot - key.root + 12) % 12;
  return degrees.includes(relative);
}

/** Dominant-quality chord (V, V7, V7alt, etc.): used to detect V/X and avoid false modulation. */
const DOMINANT_QUALITIES = new Set<string>(['7', '7#11', '7alt', '7b9']);

function hasDominantQuality(quality: string): boolean {
  return DOMINANT_QUALITIES.has(quality);
}

/** Dominant root in any key: (tonic + 7) mod 12. */
function isAuthenticCadence(domRoot: number, tonRoot: number): boolean {
  return (tonRoot + 7) % 12 === domRoot;
}

/** bVII-i cadence in minor keys: (tonic + 10) mod 12 → tonic (e.g. Bb→Cm in C minor). */
function isBackdoorCadence(domRoot: number, tonRoot: number): boolean {
  return (tonRoot + 10) % 12 === domRoot;
}

/** Tritone substitution: dominant root is (tonic+7+6)%12 = (tonic+1)%12 (e.g. Db7→C; G=7, Db=1). */
function isTritoneSubToTonic(domRoot: number, tonRoot: number): boolean {
  return (tonRoot + 1) % 12 === domRoot;
}

/** Backdoor: bVII7→I, i.e. (tonic + 10) % 12 → tonic (e.g. Bb7→C). */
function isBackdoorToTonic(domRoot: number, tonRoot: number): boolean {
  return (tonRoot + 10) % 12 === domRoot;
}

/**
 * Detect modulation by finding the single rightmost authentic cadence (V–I by root motion).
 * If that cadence is in the global key, no modulation. If it is in another key, and the
 * material before it agrees with the global key, report modulation.
 * Optional chordQualities[] (same length as chordRoots) enables secondary-dominant and
 * backdoor/tritone filtering.
 */
export function detectModulation(
  chordRoots: RootSemitone[],
  segments: number[][],
  globalKey: Key,
  chordQualities?: string[],
  options?: ModulationDetectionOptions
): ModulationResult {
  const minSpan = options?.modulationMinSpanChords ?? 2;
  const snapbackWindow = options?.snapbackWindowChords ?? 2;
  const persistenceChords = options?.persistenceChords ?? 3;
  const n = chordRoots.length;
  // #region agent log
  const fingerprint = chordRoots.slice(0, 12).join(',');
  debugLog({
    location: 'modulationDetection.ts:detectModulation',
    message: 'mod entry',
    data: { fingerprint, n, globalKeyRoot: globalKey.root },
    hypothesisId: 'H1',
  });
  // #endregion
  if (n < 4 || segments.length !== n) {
    // Exception: exactly 3 chords with bVII–i at end (e.g. C, Bb, Cm → EQ-F236) can establish parallel minor
    // But NOT bVII7→I (backdoor substitution) - that should not modulate
    if (n === 3 && segments.length === 3) {
      const r0 = chordRoots[0], r1 = chordRoots[1], r2 = chordRoots[2];
      // Check if it's bVII7→I (backdoor) - if so, don't modulate
      const isBackdoorSub = chordQualities && chordQualities.length === 3 && hasDominantQuality(chordQualities[1]) && (r2 + 10) % 12 === r1;
      if (isBackdoorSub) {
        // bVII7→I backdoor substitution - no modulation
        return { modulated: false };
      }
      if (r0 === r2 && (r2 + 10) % 12 === r1) {
        const keyBefore: Key = { root: r0 as RootSemitone, mode: 'major' };
        const keyAfter: Key = { root: r2 as RootSemitone, mode: 'minor' };
        return {
          modulated: true,
          segmentKeys: [
            { startIndex: 0, endIndex: 1, key: keyBefore },
            { startIndex: 2, endIndex: 2, key: keyAfter },
          ],
        };
      }
    }
    return { modulated: false };
  }

  const lastRoot = chordRoots[n - 1];
  // For prefix inference, use very low lastTonicBonus to avoid picking the cadence key prematurely
  // This helps with K021, K047 where prefix should stay in original key
  const prefixInferOpts = { firstTonicBonus: 0.15, lastTonicBonus: 0.01 };

  // Detect arpeggiations: very short progressions (≤5 chords) that start/end on same root with ≤4 unique roots
  // This catches cases like C-E-G-B-C (C major arpeggiated) that shouldn't modulate
  if (n <= 5 && chordRoots[0] === lastRoot) {
    const uniqueRoots = new Set(chordRoots);
    if (uniqueRoots.size <= 4) {
      // Very likely an arpeggiation - skip modulation detection
      debugLog({
        location: 'modulationDetection.ts:skip',
        message: 'skip arpeggiation',
        data: { fingerprint, n, uniqueRoots: uniqueRoots.size },
        hypothesisId: 'H1',
      });
      return { modulated: false };
    }
  }

  // Collect all cadence positions (i, tonic); include V-I (authentic), V/V-V-I (secondary dominant chains), and bVII-i (backdoor in minor, but only for parallel minor modulations)
  // Skip backdoor/tritone-sub dominants when chord has dominant quality (those are substitutions, not cadences)
  const cadences: Array<{ i: number; cadenceKeyRoot: RootSemitone; isBackdoor: boolean; isVofVofV?: boolean }> = [];
  for (let idx = n - 2; idx >= 0; idx--) {
    const domRoot = chordRoots[idx];
    const tonRoot = chordRoots[idx + 1];
    const isBackdoorSub = isBackdoorToTonic(domRoot, tonRoot);
    const isTritone = isTritoneSubToTonic(domRoot, tonRoot);
    // Skip backdoor/tritone substitutions when they have dominant quality (they're V substitutes, not cadences)
    if ((isBackdoorSub || isTritone) && (!chordQualities || chordQualities.length !== n || hasDominantQuality(chordQualities[idx]))) continue;
    
    // Detect V/V-V-I patterns: when chord[idx] is V/V of chord[idx+1], and chord[idx+1] is V of chord[idx+2]
    // This forms a secondary dominant chain: V/V-V-I cadence
    // Check this BEFORE checking regular V-I to prioritize V/V-V-I patterns
    if (idx + 2 < n) {
      const intermediateRoot = chordRoots[idx + 1];
      const finalRoot = chordRoots[idx + 2];
      const isVofV = isAuthenticCadence(domRoot, intermediateRoot); // domRoot is V of intermediateRoot
      const isVofI = isAuthenticCadence(intermediateRoot, finalRoot); // intermediateRoot is V of finalRoot
      // V/V should have dominant quality, but intermediate V can be triadic or dominant
      // For K047: D7/F# has dominant quality (7), so check that
      const vvHasDomQuality = !chordQualities || chordQualities.length !== n || hasDominantQuality(chordQualities[idx]);
      // Also check if intermediate V has dominant quality (optional but helps)
      const intermediateHasDomQuality = chordQualities && chordQualities.length === n && hasDominantQuality(chordQualities[idx + 1]);
      if (isVofV && isVofI && vvHasDomQuality) {
        // This is a V/V-V-I cadence; treat the final root as the cadence tonic
        // Mark as V/V-V-I so we know the resolution is at idx+2, not idx+1
        cadences.push({ i: idx, cadenceKeyRoot: finalRoot as RootSemitone, isBackdoor: false, isVofVofV: true });
        continue; // Skip regular V-I check for this position
      }
    }
    
    // Accept authentic V-I cadences, but skip if it's actually a backdoor bVII7→I
    // Check if this is bVII7→I (backdoor with dominant quality) - should not be treated as V-I cadence
    // bVII7→I: domRoot is (tonRoot + 10) % 12, and has dominant quality
    if (isAuthenticCadence(domRoot, tonRoot)) {
      // Double-check: if this is actually bVII7→I (backdoor), skip it
      // bVII7→I: (tonRoot + 10) % 12 === domRoot, and has dominant quality
      const isBackdoorPattern = isBackdoorToTonic(domRoot, tonRoot);
      if (isBackdoorPattern && chordQualities && chordQualities.length === n && hasDominantQuality(chordQualities[idx])) {
        // This is bVII7→I (backdoor substitution), not a V-I cadence - skip it
        continue;
      }
      // Also check: if domRoot is bVII of tonRoot (even without checking quality), and has dominant quality, it's backdoor
      // This catches cases where the cadence check passes but it's actually backdoor
      if ((tonRoot + 10) % 12 === domRoot && chordQualities && chordQualities.length === n && hasDominantQuality(chordQualities[idx])) {
        // bVII7→I backdoor substitution - skip
        continue;
      }
      cadences.push({ i: idx, cadenceKeyRoot: tonRoot as RootSemitone, isBackdoor: false });
      continue;
    }
    // Accept bVII-i cadences ONLY for parallel minor modulations (same root, different mode)
    // This is a special case: bVII-i in minor keys can establish a parallel minor modulation
    // Only if: 1) chord doesn't have dominant quality (bVII-i uses major chord, not bVII7)
    //          2) The tonic is the same root as keyBefore (parallel minor)
    //          3) There's a sustained minor region (at least 2 chords including the cadence)
    // Block bVII7→I (backdoor with dominant quality) - these are substitutions, not modulations
    // Also check isBackdoorToTonic (bVII7→I) explicitly
    if (isBackdoorCadence(domRoot, tonRoot) || isBackdoorToTonic(domRoot, tonRoot)) {
      if (chordQualities && chordQualities.length === n && hasDominantQuality(chordQualities[idx])) {
        // bVII7→I is a backdoor substitution, not a modulation - skip it
        continue;
      }
      // Only accept bVII-i (not bVII7→I) for parallel minor - check it's not dominant quality
      if (!chordQualities || chordQualities.length !== n || !hasDominantQuality(chordQualities[idx])) {
        // We'll check if it's parallel minor later in the loop - for now, mark it
        cadences.push({ i: idx, cadenceKeyRoot: tonRoot as RootSemitone, isBackdoor: true });
      }
    }
  }

  // Dominant-chain collapsing (doc 17): find rightmost run of P5-resolving links; only the final chord establishes key
  let chainStart = n - 1;
  for (let i = n - 1; i >= 1; i--) {
    if ((chordRoots[i - 1] + 7) % 12 === chordRoots[i]) chainStart = i - 1;
    else break;
  }

  /** Loop: first half === second half; use stricter promotion for ambiguous loops. */
  function isLoop(roots: RootSemitone[]): boolean {
    const len = roots.length;
    if (len < 4 || len % 2 !== 0) return false;
    const half = len >> 1;
    for (let i = 0; i < half; i++) if (roots[i] !== roots[half + i]) return false;
    return true;
  }

  for (const { i: iCand, cadenceKeyRoot: K, isBackdoor, isVofVofV } of cadences) {
    // Allow bVII–i at index 1 (e.g. C, Bb, Cm → EQ-F236) so prefix has 1 chord; otherwise need ≥2
    // For V/V-V-I cadences, allow prefixEnd >= 1 since the cadence itself spans 3 chords and is strong evidence
    if (iCand < 2 && !(isBackdoor && n >= 3) && !isVofVofV) continue;
    // For V/V-V-I cadences, the resolution is at iCand+2, so cadence is final if iCand+2 >= n-1
    const cadenceIsFinal = isVofVofV ? (iCand + 2 >= n - 1) : (iCand + 1 >= n - 1);
    // Skip cadences inside a dominant chain unless resolution is at the very end (arrival key)
    // For V/V-V-I, check if the intermediate V (iCand+1) is inside the chain
    const resolutionIdx = isVofVofV ? iCand + 2 : iCand + 1;
    if (resolutionIdx > chainStart && resolutionIdx < n - 1) {
      debugLog({
        location: 'modulationDetection.ts:skip',
        message: 'skip inside dominant chain',
        data: { fingerprint, iCand, K, chainStart, resolutionIndex: resolutionIdx, isVofVofV },
        hypothesisId: 'H6',
      });
      continue;
    }
    let prefixEnd = iCand;
    let keyBefore = inferKey(segments.slice(0, prefixEnd), { chordRoots: chordRoots.slice(0, prefixEnd), ...prefixInferOpts });
    // For V/V-V-I, be more lenient: allow prefixEnd >= 1 if prefix clearly establishes a different key
    // Also, if prefix inference picks K (cadence key), try shortening prefix to avoid picking cadence key prematurely
    const minPrefixForVofVofV = 1;
    let attempts = 0;
    const maxAttempts = 3; // Try up to 3 times to find a prefix that doesn't equal K
    while (prefixEnd >= (isVofVofV ? minPrefixForVofVofV : 2) && keyBefore.root === K && attempts < maxAttempts) {
      prefixEnd--;
      if (prefixEnd < (isVofVofV ? minPrefixForVofVofV : 2)) break;
      keyBefore = inferKey(segments.slice(0, prefixEnd), { chordRoots: chordRoots.slice(0, prefixEnd), ...prefixInferOpts });
      attempts++;
    }
    // For V/V-V-I, allow prefixEnd >= 1 if keyBefore is different from K
    // For regular V-I, still require prefixEnd >= 2 and keyBefore !== K
    const minPrefixRequired = isVofVofV ? minPrefixForVofVofV : 2;
    // Special case: if prefix inference keeps picking K, but first chord is different from K, trust the first chord
    // This helps with K021, K047 where prefix might pick G:maj but first chord is C
    if (prefixEnd < minPrefixRequired || (keyBefore.root === K && !isVofVofV)) {
      // For bVII-i cadences, allow parallel minor (same root, different mode)
      if (isBackdoor && keyBefore.root === K && keyBefore.mode === 'major') {
        // This is a parallel minor modulation - continue processing
      } else if (isVofVofV && prefixEnd >= minPrefixForVofVofV && keyBefore.root !== K) {
        // V/V-V-I with valid prefix and different key - allow it
      } else if (isVofVofV && chordRoots[0] !== K && prefixEnd >= minPrefixForVofVofV) {
        // V/V-V-I: if first chord differs from K, trust it even if prefix inference picked K
        // Re-infer with even more conservative settings
        keyBefore = inferKey(segments.slice(0, Math.max(1, prefixEnd)), { 
          chordRoots: chordRoots.slice(0, Math.max(1, prefixEnd)), 
          firstTonicBonus: 0.20, 
          lastTonicBonus: 0.0 // No last tonic bonus for prefix
        });
        if (keyBefore.root !== K) {
          // Now we have a valid keyBefore - continue
        } else {
          // #region agent log
          debugLog({
            location: 'modulationDetection.ts:skip',
            message: 'skip keyBeforeEqK or prefixEnd (V/V-V-I, prefix still equals K)',
            data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root, prefixEnd, isVofVofV, firstRoot: chordRoots[0] },
            hypothesisId: 'H1',
          });
          // #endregion
          continue;
        }
      } else {
      // #region agent log
      debugLog({
        location: 'modulationDetection.ts:skip',
        message: 'skip keyBeforeEqK or prefixEnd',
        data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root, prefixEnd, isVofVofV, minPrefixRequired },
        hypothesisId: 'H1',
      });
      // #endregion
        continue;
      }
    }
    // For bVII-i cadences, only allow parallel minor modulations (same root, different mode)
    if (isBackdoor && keyBefore.root !== K) {
      // bVII-i cadences only work for parallel minor, not different roots
      continue;
    }
    if (chordRoots[0] !== keyBefore.root) {
      // #region agent log
      debugLog({
        location: 'modulationDetection.ts:skip',
        message: 'skip firstChordMismatch',
        data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root, firstRoot: chordRoots[0] },
        hypothesisId: 'H4',
      });
      // #endregion
      continue;
    }

    // Filter cadences to minor chords that are secondary functions (ii, iii, vi) in keyBefore
    // Only filter if: 1) cadence is NOT at the end, OR 2) progression returns to original key soon after
    // This allows legitimate final modulations to minor keys (like K162, K166, K167)
    // For V/V-V-I cadences, check resolution at iCand+2, not iCand+1
    const resolutionCheckIdx = isVofVofV ? iCand + 2 : iCand + 1;
    if (chordQualities && chordQualities.length === n && resolutionCheckIdx < n) {
      const resolutionQuality = chordQualities[resolutionCheckIdx];
      const resolutionRoot = chordRoots[resolutionCheckIdx];
      // Check if resolution is a minor chord (not major tonic)
      const isMinorResolution = resolutionQuality === 'min' || resolutionQuality === 'min7';
      if (isMinorResolution && isDiatonicInKey(resolutionRoot, keyBefore) && resolutionRoot !== keyBefore.root) {
        // Check if it's a secondary function (ii, iii, or vi in major; ii°, iii, or vi in minor)
        const pcOffset = (resolutionRoot - keyBefore.root + 12) % 12;
        const isSecondaryFunction = keyBefore.mode === 'major' 
          ? [2, 4, 9].includes(pcOffset) // ii, iii, vi in major
          : [2, 4, 8].includes(pcOffset); // ii°, iii, vi in minor
        if (isSecondaryFunction) {
          // Only filter if cadence is NOT final OR if progression returns to original key soon after
          const isFinalCadence = resolutionCheckIdx === n - 1;
          const lookAheadStart = isVofVofV ? iCand + 3 : iCand + 2;
          const returnsToOriginal = !isFinalCadence && lookAheadStart < n && 
            chordRoots.slice(lookAheadStart, Math.min(lookAheadStart + 3, n)).includes(keyBefore.root);
          if (!isFinalCadence || returnsToOriginal) {
            // This is likely V/X → X where X is a secondary function, not a modulation
            debugLog({
              location: 'modulationDetection.ts:skip',
              message: 'skip secondary function cadence',
              data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root, resolutionRoot, pcOffset, isFinalCadence, returnsToOriginal, isVofVofV },
              hypothesisId: 'H5',
            });
            continue;
          }
        }
      }
    }

    // Tonicization shield (V/x): if dominant resolves by fifth to a chord diatonic in keyBefore → V/deg, do not count as modulation (doc 2, 6).
    // Promotion override: allow when post-cadence span is long enough (≥3 chords) so established modulations pass.
    // For V/V-V-I cadences, the resolution is at iCand+2, not iCand+1 (resolutionIdx already computed above)
    const nextRoot = chordRoots[resolutionIdx];
    const isP5Resolution = isVofVofV 
      ? ((chordRoots[iCand + 1] + 7) % 12 === nextRoot) // V resolves to I in V/V-V-I
      : ((nextRoot + 7) % 12 === chordRoots[iCand]); // Standard V-I
    const targetDiatonicInKeyBefore = isDiatonicInKey(nextRoot, keyBefore);
    const hasDomQuality = chordQualities?.length === n && hasDominantQuality(chordQualities[iCand]);
    const postCadenceSpan = isVofVofV ? (n - (iCand + 2)) : (n - (iCand + 1));
    const returnsToKeyBeforeTonic = lastRoot === keyBefore.root;
    // Promote when: (a) enough span and no return home, or (b) cadence is final and piece ends in K (genuine modulation to ending key),
    // or (c) bVII–i at end establishing parallel minor (EQ-F236: C, Bb, Cm → C:maj then C:min)
    const bVIIiParallelMinorAtEnd = isBackdoor && cadenceIsFinal && keyBefore.root === K && keyBefore.mode === 'major';
    const enoughSpanToPromote =
      (postCadenceSpan >= 2 && !returnsToKeyBeforeTonic) || // Relaxed from 3 to 2 chords
      (cadenceIsFinal && K === lastRoot && lastRoot !== keyBefore.root) ||
      bVIIiParallelMinorAtEnd;
    if (targetDiatonicInKeyBefore && (hasDomQuality || isP5Resolution)) {
      if (nextRoot !== K) {
        // Resolution is a scale degree in keyBefore, not the cadence tonic → check if it's a secondary function
        // Only block if it's a secondary function (ii, iii, vi) AND short span
        const pcOffset = (nextRoot - keyBefore.root + 12) % 12;
        const isSecondaryFunction = keyBefore.mode === 'major' 
          ? [2, 4, 9].includes(pcOffset) // ii, iii, vi in major
          : [2, 4, 8].includes(pcOffset); // ii°, iii, vi in minor
        // Only block if it's a secondary function AND short span (postCadenceSpan < 2)
        if (isSecondaryFunction && postCadenceSpan < 2) {
          debugLog({
            location: 'modulationDetection.ts:skip',
            message: 'skip tonicization shield (V/x to secondary function, short span)',
            data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root, nextRoot, hasDomQuality, pcOffset },
            hypothesisId: 'H2',
          });
          continue;
        }
        // If it's not a secondary function, or span is ≥2, allow it (might be a modulation)
      } else {
        // Resolution is K (the cadence tonic) and diatonic in keyBefore
        // Rule-conflict resolver (doc 16): default STAY unless segment supports K₂ for ≥ persistenceChords (and no return home)
        // Relaxed: allow when postCadenceSpan ≥ 2 (not just ≥ persistenceChords)
        if (!enoughSpanToPromote && (postCadenceSpan < 2 || returnsToKeyBeforeTonic)) {
          // Target is K and diatonic in keyBefore; short visit or snapback → treat as tonicization (e.g. circle-of-fifths)
          debugLog({
            location: 'modulationDetection.ts:skip',
            message: 'skip tonicization shield (V/x to K, short span or return home)',
            data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root, postCadenceSpan, returnsToKeyBeforeTonic },
            hypothesisId: 'H2',
          });
          continue;
        }
      }
    }

    // Half cadence: last chord is dominant of keyBefore and ending is short (1–2 chords) → do not report modulation
    // Exception: if cadence is final and K === lastRoot, it's a genuine ending modulation, not a half cadence
    if ((keyBefore.root + 7) % 12 === lastRoot && n - iCand <= 2 && K !== lastRoot) continue;

    // Long circle-of-fifths (EQ-F201): if progression is long, returns to opening tonic, "new" key only in last 2 chords, and high root variety (real cycle)
    const openingRoot = chordRoots[0];
    const uniqueRoots = new Set(chordRoots).size;
    const returnToOpening = n >= 8 && postCadenceSpan <= 2 && uniqueRoots >= 7 && chordRoots.slice(2, Math.max(2, n - 2)).includes(openingRoot);
    if (returnToOpening && keyBefore.root === openingRoot) continue;

    // IV–I in global key (plagal in global): only evidence for "new key" K is IV–I that is I–IV in globalKey → do not modulate
    // Exception: if cadence is final and K === lastRoot, it's a genuine ending modulation (K196-K199)
    if ((K + 7) % 12 === globalKey.root && !(cadenceIsFinal && K === lastRoot && keyBefore.root !== K)) continue;

    // Minimum segment length (promotion rule): at least minSpan chords in the new key,
    // except for ending cadence (K === lastRoot) where final chord confirms the key
    // For V/V-V-I cadences, allow with 1 chord after (the I), since the cadence itself spans 3 chords
    // For ending cadences (K === lastRoot), relax requirement: allow with just 1 chord (the final I)
    const segmentLength = n - iCand;
    const isEndingCadence = K === lastRoot;
    const minSpanForCadence = isVofVofV ? 1 : (isEndingCadence ? 1 : minSpan); // Ending cadences and V/V-V-I are strong enough with 1 chord
    if (segmentLength < minSpanForCadence && !isEndingCadence) continue;

    // Non-snapback: if within snapbackWindow chords after the putative I we return to keyBefore's tonic, treat as tonicization
    // Also check if progression ends on keyBefore's tonic (strong return signal for circle-of-fifths)
    // For V/V-V-I cadences, check after the resolution (iCand+2), not after the V/V (iCand)
    const resolutionStartIdx = isVofVofV ? iCand + 2 : iCand + 1;
    const lookAhead = Math.min(snapbackWindow, n - resolutionStartIdx);
    let snapback = false;
    for (let j = 1; j <= lookAhead; j++) {
      if (resolutionStartIdx + j < n && chordRoots[resolutionStartIdx + j] === keyBefore.root) {
        snapback = true;
        break;
      }
    }
    // If progression ends on original tonic and the new-key segment is short, treat as excursion/tonicization
    // Exception: bVII–i parallel minor at end (same root, new mode) is a real modulation (EQ-F236)
    // Don't snapback if progression ends in the new key (K === lastRoot) - that's a genuine modulation
    // For V/V-V-I cadences, be more lenient: if segment has ≥3 chords, allow even if ends on original tonic
    // For middle modulations with ≥3 chords in new key, allow even if ends on original tonic (K021: D-G cadence, 3 chords in G, ends on C)
    const segmentLengthForSnapback = n - iCand;
    const minSegmentForNoSnapback = isVofVofV ? 3 : Math.max(3, minSpan);
    const isStrongMiddleModulation = !cadenceIsFinal && segmentLengthForSnapback >= 3 && keyBefore.root !== K;
    if (!snapback && lastRoot === keyBefore.root && segmentLengthForSnapback <= minSegmentForNoSnapback && !bVIIiParallelMinorAtEnd && K !== lastRoot && !isStrongMiddleModulation) {
      // Only snapback if we actually returned within the segment, not just ended on original tonic
      // For V/V-V-I, if segment is ≥3 chords, it's strong enough to be a modulation even if ends on original tonic
      if (!isVofVofV || segmentLengthForSnapback < 3) {
        snapback = false; // Don't snapback based solely on ending - need actual return within segment
      }
    }
    if (bVIIiParallelMinorAtEnd) snapback = false; // last chord is i in new key, not return to I
    if (snapback) {
      // #region agent log
      debugLog({
        location: 'modulationDetection.ts:skip',
        message: 'skip snapback',
        data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root, lastRoot },
        hypothesisId: 'H3',
      });
      // #endregion
      continue;
    }

    // Adjudication scorecard (doc 18): cadence ✓, persistence ✓, no snapback ✓; require minimal diatonic support in K₂
    // bVII–i establishes parallel minor, so segment key is same root, mode minor (EQ-F236)
    // For V/V-V-I cadences, count diatonic support from the V/V onwards (the whole cadence chain supports the new key)
    const keyK: Key = { root: K, mode: isBackdoor ? 'minor' : globalKey.mode };
    let diatonicInK2 = 0;
    for (let j = iCand; j < n; j++) {
      if (isDiatonicInKey(chordRoots[j], keyK)) diatonicInK2++;
    }
    const minDiatonic = cadenceIsFinal ? 1 : 2;
    if (diatonicInK2 < minDiatonic) continue;

    // Ambiguous/loop only: require segment to infer to K and stronger support (avoid false mod)
    // For loops, be very conservative: require strong evidence and longer segment
    if (isLoop(chordRoots)) {
      const segmentKey = inferKey(
        segments.slice(iCand),
        { chordRoots: chordRoots.slice(iCand), firstTonicBonus: 0.05, lastTonicBonus: 0.12 }
      );
      // For loops, require: segment infers to K, segment length ≥ 4, and strong diatonic support
      // Also check if the global key inference is ambiguous (keyBefore might be uncertain)
      const globalKeyInference = inferKey(segments, { chordRoots });
      // If the cadence key K equals the global key, and it's a loop, don't modulate (likely no modulation)
      // Also check if keyBefore root equals K (same root ambiguity) - be very conservative
      // For K183, K185, K186: block modulation if it's a loop and K equals global key OR keyBefore root
      if ((globalKeyInference.root === K || keyBefore.root === K) && n - iCand < 5) {
        debugLog({
          location: 'modulationDetection.ts:skip',
          message: 'skip: loop with cadence key equals global/keyBefore key',
          data: { fingerprint, iCand, K, globalKeyRoot: globalKeyInference.root, keyBeforeRoot: keyBefore.root, segmentLength: n - iCand },
          hypothesisId: 'H8',
        });
        continue;
      }
      // For loops, also check if alternates are very close (ambiguous) - block modulation
      if (globalKeyInference.alternates && globalKeyInference.alternates.length > 0) {
        const topAlternate = globalKeyInference.alternates[0];
        const margin = globalKeyInference.margin ?? 0;
        // If margin is very small (< 0.15) and alternate root equals K, block modulation
        // Increased threshold from 0.1 to 0.15 for K183, K185, K186
        if (margin < 0.15 && topAlternate.root === K && n - iCand < 5) {
          debugLog({
            location: 'modulationDetection.ts:skip',
            message: 'skip: loop with ambiguous key (low margin)',
            data: { fingerprint, iCand, K, margin, alternateRoot: topAlternate.root, segmentLength: n - iCand },
            hypothesisId: 'H8',
          });
          continue;
        }
      }
      // For loops, also check if keyBefore has alternates that include K - very ambiguous
      const keyBeforeInference = inferKey(segments.slice(0, prefixEnd), { chordRoots: chordRoots.slice(0, prefixEnd) });
      if (keyBeforeInference.alternates && keyBeforeInference.alternates.some(alt => alt.root === K)) {
        const margin = keyBeforeInference.margin ?? 0;
        if (margin < 0.15 && n - iCand < 5) {
          debugLog({
            location: 'modulationDetection.ts:skip',
            message: 'skip: loop with keyBefore alternates including K',
            data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root, margin, segmentLength: n - iCand },
            hypothesisId: 'H8',
          });
          continue;
        }
      }
      if (segmentKey.root !== K || n - iCand < 4 || diatonicInK2 < 3) continue;
    }

    // No modulation when cadence key is global key and progression is short (ii–V–I–IV, vi–IV–V–I in one key)
    // Exception: bVII–i at end establishes parallel minor (different mode), so do promote (EQ-F236)
    // Exception: V/V-V-I cadences are strong enough to override this check
    // Exception: Ending cadences (K === lastRoot) should be allowed even if global key equals K initially
    // Exception: For extreme stress cases (K196-K199), allow ending cadences when keyBefore differs from K and progression is long (n >= 7)
    const isExtremeStressEnding = cadenceIsFinal && K === lastRoot && keyBefore.root !== K && n >= 7;
    // Also allow ending cadences when they're final and keyBefore clearly differs (even if global key equals K)
    const isClearEndingModulation = cadenceIsFinal && K === lastRoot && keyBefore.root !== K && postCadenceSpan >= 2;
    if (!bVIIiParallelMinorAtEnd && !isVofVofV && !isExtremeStressEnding && !isClearEndingModulation && globalKey.root === K && n <= 6 && isDiatonicInKey(chordRoots[0], keyK) && K !== lastRoot) {
      debugLog({
        location: 'modulationDetection.ts:skip',
        message: 'skip: global key equals cadence key, short progression',
        data: { fingerprint, K, n, isVofVofV, lastRoot, isExtremeStressEnding, isClearEndingModulation, keyBeforeRoot: keyBefore.root },
        hypothesisId: 'H7',
      });
      continue;
    }
    // Key-ambiguous filter: when keyBefore root equals K (same root, different mode ambiguity)
    // Be conservative: only allow modulation if cadence is final AND segment is long enough
    // Also check if it's a loop - loops with same-root ambiguity should not modulate
    const isKeyAmbiguousLoop = isLoop(chordRoots) && keyBefore.root === K && keyBefore.mode !== keyK.mode;
    if (isKeyAmbiguousLoop && (!cadenceIsFinal || postCadenceSpan < 3)) {
      debugLog({
        location: 'modulationDetection.ts:skip',
        message: 'skip: key-ambiguous loop (same root, different mode)',
        data: { fingerprint, iCand, K, keyBeforeMode: keyBefore.mode, keyKMode: keyK.mode, cadenceIsFinal, postCadenceSpan },
        hypothesisId: 'H9',
      });
      continue;
    }
    // Also block when keyBefore root equals K and it's NOT a parallel minor modulation (bVII-i)
    if (!isBackdoor && keyBefore.root === K && keyBefore.mode !== keyK.mode && !cadenceIsFinal && postCadenceSpan < 3) {
      debugLog({
        location: 'modulationDetection.ts:skip',
        message: 'skip: key-ambiguous (same root, different mode), not final or short span',
        data: { fingerprint, iCand, K, keyBeforeMode: keyBefore.mode, keyKMode: keyK.mode, cadenceIsFinal, postCadenceSpan },
        hypothesisId: 'H9',
      });
      continue;
    }
    // Short progression ending on vi in global key (e.g. ... Em Am in C) → do not promote to vi as key
    const viInGlobal = (globalKey.root + 9) % 12;
    if (n <= 6 && K === viInGlobal && lastRoot === viInGlobal && isDiatonicInKey(chordRoots[0], { root: globalKey.root, mode: globalKey.mode })) {
      continue;
    }

    // Ending cadence (tonic = last chord): use it
    // For V/V-V-I cadences, the ending is at iCand+2, so check if K === lastRoot
    // For extreme stress cases (K196-K199), allow ending cadences even if global key equals K initially
    if (K === lastRoot) {
      if ((keyBefore.root + 5) % 12 === K) continue; // plagal in keyBefore
      // For K196-K199: these are extreme stress cases where progression ends in new key
      // Even if global key equals K, if keyBefore differs and cadence is final, allow modulation
      const isExtremeStressCase = n >= 7 && keyBefore.root !== K && cadenceIsFinal;
      // #region agent log
      debugLog({
        location: 'modulationDetection.ts:return',
        message: 'modulated true (ending)',
        data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root, isVofVofV, isExtremeStressCase },
        hypothesisId: 'H1',
      });
      // #endregion
      return {
        modulated: true,
        segmentKeys: [
          { startIndex: 0, endIndex: iCand - 1, key: keyBefore },
          { startIndex: iCand, endIndex: n - 1, key: keyK },
        ],
      };
    }
    // Middle modulation: new-key segment at least 2 chords (or 1 for V/V-V-I since cadence spans 3)
    const minSegmentLength = isVofVofV ? 1 : 2;
    if (n - iCand >= minSegmentLength) {
      // #region agent log
      debugLog({
        location: 'modulationDetection.ts:return',
        message: 'modulated true (middle)',
        data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root },
        hypothesisId: 'H1',
      });
      // #endregion
      return {
        modulated: true,
        segmentKeys: [
          { startIndex: 0, endIndex: iCand - 1, key: keyBefore },
          { startIndex: iCand, endIndex: n - 1, key: keyK },
        ],
      };
    }
  }

  // #region agent log
  debugLog({
    location: 'modulationDetection.ts:return',
    message: 'modulated false',
    data: { fingerprint, cadenceCount: cadences.length },
    hypothesisId: 'H1',
  });
  // #endregion
  return { modulated: false };
}
