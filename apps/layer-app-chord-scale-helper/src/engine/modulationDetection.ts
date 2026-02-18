/**
 * Modulation detection: new key confirmed by cadence in that key.
 * MVP: single key + borrowed only; multi-key/segment-key in a later version.
 */

import type { Key } from '../domain/key.js';
import type { RootSemitone } from '../domain/key.js';

export interface ModulationResult {
  /** True if a sustained modulation (new key with cadence) was detected. */
  modulated: boolean;
  /** Per-segment key when modulated (empty for MVP). */
  segmentKeys?: Array<{ startIndex: number; endIndex: number; key: Key }>;
}

/**
 * Detect whether the progression modulates to another key (cadence in new key).
 * MVP: always returns modulated: false. Multi-key and segment-key detection
 * will be added in a later version (see engine spec §4).
 */
export function detectModulation(
  _chordRoots: RootSemitone[],
  _currentKey: Key
): ModulationResult {
  return { modulated: false };
}
