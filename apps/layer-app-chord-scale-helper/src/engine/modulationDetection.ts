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
  chordQualities?: string[]
): ModulationResult {
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
  if (n < 4 || segments.length !== n) return { modulated: false };

  const lastRoot = chordRoots[n - 1];
  const prefixInferOpts = { firstTonicBonus: 0.15, lastTonicBonus: 0.02 };

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

  // Collect all cadence positions (i, tonic); include V-I (authentic) and bVII-i (backdoor in minor, but only for parallel minor modulations)
  // Skip backdoor/tritone-sub dominants when chord has dominant quality (those are substitutions, not cadences)
  const cadences: Array<{ i: number; cadenceKeyRoot: RootSemitone; isBackdoor: boolean }> = [];
  for (let idx = n - 2; idx >= 0; idx--) {
    const domRoot = chordRoots[idx];
    const tonRoot = chordRoots[idx + 1];
    const isBackdoorSub = isBackdoorToTonic(domRoot, tonRoot);
    const isTritone = isTritoneSubToTonic(domRoot, tonRoot);
    // Skip backdoor/tritone substitutions when they have dominant quality (they're V substitutes, not cadences)
    if ((isBackdoorSub || isTritone) && (!chordQualities || chordQualities.length !== n || hasDominantQuality(chordQualities[idx]))) continue;
    // Accept authentic V-I cadences
    if (isAuthenticCadence(domRoot, tonRoot)) {
      cadences.push({ i: idx, cadenceKeyRoot: tonRoot as RootSemitone, isBackdoor: false });
      continue;
    }
    // Accept bVII-i cadences ONLY for parallel minor modulations (same root, different mode)
    // This is a special case: bVII-i in minor keys can establish a parallel minor modulation
    // Only if: 1) chord doesn't have dominant quality (bVII-i uses major chord, not bVII7)
    //          2) The tonic is the same root as keyBefore (parallel minor)
    //          3) There's a sustained minor region (at least 2 chords including the cadence)
    if (isBackdoorCadence(domRoot, tonRoot) && (!chordQualities || chordQualities.length !== n || !hasDominantQuality(chordQualities[idx]))) {
      // We'll check if it's parallel minor later in the loop - for now, mark it
      cadences.push({ i: idx, cadenceKeyRoot: tonRoot as RootSemitone, isBackdoor: true });
    }
  }

  for (const { i: iCand, cadenceKeyRoot: K, isBackdoor } of cadences) {
    if (iCand < 2) continue;
    let prefixEnd = iCand;
    let keyBefore = inferKey(segments.slice(0, prefixEnd), { chordRoots: chordRoots.slice(0, prefixEnd), ...prefixInferOpts });
    while (prefixEnd >= 2 && keyBefore.root === K) {
      prefixEnd--;
      keyBefore = inferKey(segments.slice(0, prefixEnd), { chordRoots: chordRoots.slice(0, prefixEnd), ...prefixInferOpts });
    }
    if (prefixEnd < 2 || keyBefore.root === K) {
      // For bVII-i cadences, allow parallel minor (same root, different mode)
      if (isBackdoor && keyBefore.root === K && keyBefore.mode === 'major') {
        // This is a parallel minor modulation - continue processing
      } else {
      // #region agent log
      debugLog({
        location: 'modulationDetection.ts:skip',
        message: 'skip keyBeforeEqK or prefixEnd',
        data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root, prefixEnd },
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
    if (chordQualities && chordQualities.length === n && iCand + 1 < n) {
      const resolutionQuality = chordQualities[iCand + 1];
      const resolutionRoot = chordRoots[iCand + 1];
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
          const isFinalCadence = iCand + 1 === n - 1;
          const returnsToOriginal = !isFinalCadence && iCand + 2 < n && 
            chordRoots.slice(iCand + 2, Math.min(iCand + 5, n)).includes(keyBefore.root);
          if (!isFinalCadence || returnsToOriginal) {
            // This is likely V/X → X where X is a secondary function, not a modulation
            debugLog({
              location: 'modulationDetection.ts:skip',
              message: 'skip secondary function cadence',
              data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root, resolutionRoot, pcOffset, isFinalCadence, returnsToOriginal },
              hypothesisId: 'H5',
            });
            continue;
          }
        }
      }
    }

    // Secondary dominant (V/X): V–I where the "I" is diatonic in keyBefore and chord i has dominant quality → tonicization, skip
    // BUT: Only filter if the resolution chord is NOT the tonic of the cadence key K (if nextRoot === K, it's a real modulation)
    // Also: if the cadence resolves and we return to keyBefore's tonic soon after (within 2-3 chords), it's tonicization
    if (chordQualities && chordQualities.length === n) {
      const qI = chordQualities[iCand];
      const nextRoot = chordRoots[iCand + 1];
      if (hasDominantQuality(qI) && isDiatonicInKey(nextRoot, keyBefore) && nextRoot !== K) {
        // Check if we return to keyBefore's tonic soon after this cadence
        const returnToOriginal = iCand + 2 < n && chordRoots.slice(iCand + 2, Math.min(iCand + 5, n)).includes(keyBefore.root);
        if (returnToOriginal) {
          // #region agent log
          debugLog({
            location: 'modulationDetection.ts:skip',
            message: 'skip secondaryDominant (returns to original)',
            data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root, nextRoot, quality: qI },
            hypothesisId: 'H2',
          });
          // #endregion
          continue;
        }
        // Standard secondary dominant filter: resolution is diatonic in keyBefore and not the cadence tonic
        // #region agent log
        debugLog({
          location: 'modulationDetection.ts:skip',
          message: 'skip secondaryDominant',
          data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root, nextRoot, quality: qI },
          hypothesisId: 'H2',
        });
        // #endregion
        continue;
      }
    }

    // Half cadence: last chord is dominant of keyBefore and ending is short (1–2 chords) → do not report modulation
    if ((keyBefore.root + 7) % 12 === lastRoot && n - iCand <= 2) continue;

    // IV–I in global key (plagal in global): only evidence for "new key" K is IV–I that is I–IV in globalKey → do not modulate
    if ((K + 7) % 12 === globalKey.root) continue;

    // Minimum segment length: at least 2 chords in the new key (pivot + I, or V + I)
    if (n - iCand < 2) continue;

    // Non-snapback: if within 1–2 chords after the putative I we return to keyBefore's tonic, treat as tonicization
    // Also check if progression ends on keyBefore's tonic (strong return signal for circle-of-fifths)
    const lookAhead = Math.min(2, n - (iCand + 1));
    let snapback = false;
    for (let j = 1; j <= lookAhead; j++) {
      if (iCand + j < n && chordRoots[iCand + j] === keyBefore.root) {
        snapback = true;
        break;
      }
    }
    // If progression ends on original tonic and the new-key segment is short, treat as excursion/tonicization
    if (!snapback && lastRoot === keyBefore.root && n - iCand <= 3) {
      snapback = true;
    }
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

    // Backdoor/tritone in current key: if cadence is bVII7–I or tritone-sub–I relative to keyBefore, already filtered above; relative to K we skip when we treated as cadence in K — we only add cadences that are authentic V–I, so backdoor/tritone to K would not be in cadences. So no extra check here.

    // Ending cadence (tonic = last chord): use it
    if (K === lastRoot) {
      if ((keyBefore.root + 5) % 12 === K) continue; // plagal in keyBefore
      const newKey: Key = { root: K, mode: globalKey.mode };
      // #region agent log
      debugLog({
        location: 'modulationDetection.ts:return',
        message: 'modulated true (ending)',
        data: { fingerprint, iCand, K, keyBeforeRoot: keyBefore.root },
        hypothesisId: 'H1',
      });
      // #endregion
      return {
        modulated: true,
        segmentKeys: [
          { startIndex: 0, endIndex: iCand - 1, key: keyBefore },
          { startIndex: iCand, endIndex: n - 1, key: newKey },
        ],
      };
    }
    // Middle modulation: new-key segment at least 2 chords
    if (n - iCand >= 2) {
      const newKey: Key = { root: K, mode: globalKey.mode };
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
          { startIndex: iCand, endIndex: n - 1, key: newKey },
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
