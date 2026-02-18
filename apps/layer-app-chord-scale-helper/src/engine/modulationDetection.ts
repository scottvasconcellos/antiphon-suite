/**
 * Modulation detection: new key confirmed by cadence (V–I or V7–I) in that key.
 * Scans for the rightmost such cadence in a key different from the global key.
 */

import type { Key } from '../domain/key.js';
import type { RootSemitone } from '../domain/key.js';

export interface ModulationResult {
  modulated: boolean;
  segmentKeys?: Array<{ startIndex: number; endIndex: number; key: Key }>;
}

/** Dominant root in any key: (tonic + 7) mod 12. */
function dominantOf(tonic: number): number {
  return (tonic + 7) % 12;
}

/**
 * Detect modulation by finding the rightmost authentic cadence (V–I or V7–I by root motion)
 * in a key different from the current key. Requires at least 2 chords before the cadence
 * so we don't falsely modulate on the first two chords.
 */
export function detectModulation(
  chordRoots: RootSemitone[],
  currentKey: Key
): ModulationResult {
  const n = chordRoots.length;
  if (n < 4) return { modulated: false };

  const globalTonic = currentKey.root;

  // Scan from end backwards for the rightmost cadence in a key other than global
  for (let i = n - 2; i >= 0; i--) {
    const domRoot = chordRoots[i];
    const tonRoot = chordRoots[i + 1];
    // Authentic cadence: dominant root = (tonic + 7) mod 12
    if ((tonRoot + 7) % 12 !== domRoot) continue;
    const cadenceKeyRoot = tonRoot;
    // Same key as global? Skip (no modulation)
    if (cadenceKeyRoot === globalTonic) continue;
    // Require at least 2 chords in the "initial" key
    if (i < 2) continue;

    const newKey: Key = {
      root: cadenceKeyRoot as RootSemitone,
      mode: currentKey.mode,
    };
    const segmentKeys: Array<{ startIndex: number; endIndex: number; key: Key }> = [
      { startIndex: 0, endIndex: i - 1, key: currentKey },
      { startIndex: i, endIndex: n - 1, key: newKey },
    ];
    return { modulated: true, segmentKeys };
  }

  return { modulated: false };
}
