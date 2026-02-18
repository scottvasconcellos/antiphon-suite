/**
 * Borrowed (modal mixture) and applied-dominant detection.
 * Identifies parallel-mode chords (e.g. iv, ♭VI in major) and V/X (secondary dominant).
 */

import type { ChordQuality } from '../domain/chord.js';
import type { Key } from '../domain/key.js';
import type { RootSemitone } from '../domain/key.js';

const MAJOR_PC_TO_DEGREE: Record<number, number> = { 0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7 };
const MINOR_PC_TO_DEGREE: Record<number, number> = { 0: 1, 2: 2, 3: 3, 5: 4, 7: 5, 8: 6, 10: 7 };

const MAJOR_DIATONIC_QUALITY: Record<number, string> = { 1: 'major', 2: 'minor', 3: 'minor', 4: 'major', 5: 'major', 6: 'minor', 7: 'dim' };
const MINOR_DIATONIC_QUALITY: Record<number, string> = { 1: 'minor', 2: 'dim', 3: 'major', 4: 'minor', 5: 'minor', 6: 'major', 7: 'dim' };

function pcOffset(root: RootSemitone, keyRoot: RootSemitone): number {
  return (root - keyRoot + 12) % 12;
}

function chordQualityCategory(q: ChordQuality): string {
  if (q === 'maj' || q === 'maj7' || q === 'maj7#11' || q === 'mmaj7') return 'major';
  if (q === 'min' || q === 'min7') return 'minor';
  if (q === 'dim' || q === 'dim7') return 'dim';
  if (q === 'm7b5') return 'halfdim';
  if (q === '7' || q === '7#11' || q === '7alt' || q === '7b9') return 'dominant';
  if (q === 'aug') return 'aug';
  return 'major';
}

/**
 * True if the chord is diatonic in the parallel mode but not in the current key mode
 * (e.g. iv, ♭VI, ♭II in major; or III, VI, VII in minor as borrowed from major).
 */
export function isBorrowedChord(key: Key, root: RootSemitone, quality: ChordQuality): boolean {
  const offset = pcOffset(root, key.root);
  const pcToDegree = key.mode === 'major' ? MAJOR_PC_TO_DEGREE : MINOR_PC_TO_DEGREE;
  const diaton = key.mode === 'major' ? MAJOR_DIATONIC_QUALITY : MINOR_DIATONIC_QUALITY;
  const parallelDiaton = key.mode === 'major' ? MINOR_DIATONIC_QUALITY : MAJOR_DIATONIC_QUALITY;
  const parallelPcToDegree = key.mode === 'major' ? MINOR_PC_TO_DEGREE : MAJOR_PC_TO_DEGREE;

  const degree = pcToDegree[offset];
  const parallelDegree = parallelPcToDegree[offset];
  const cat = chordQualityCategory(quality);

  if (degree !== undefined && diaton[degree] === cat) return false;
  if (parallelDegree !== undefined && parallelDiaton[parallelDegree] === cat) return true;
  return false;
}

/**
 * If this chord's root is a P5 above nextChordRoot and next chord root is diatonic in key,
 * return the scale degree (1–7) of that next chord (i.e. applied dominant to that degree).
 */
export function getAppliedToDegree(
  key: Key,
  root: RootSemitone,
  quality: ChordQuality,
  nextChordRoot: RootSemitone | null
): number | undefined {
  if (nextChordRoot === null) return undefined;
  const domCat = chordQualityCategory(quality);
  if (domCat !== 'dominant') return undefined;
  const p5Above = (nextChordRoot + 7) % 12;
  if (root !== p5Above) return undefined;
  const offset = pcOffset(nextChordRoot, key.root);
  const pcToDegree = key.mode === 'major' ? MAJOR_PC_TO_DEGREE : MINOR_PC_TO_DEGREE;
  return pcToDegree[offset];
}
