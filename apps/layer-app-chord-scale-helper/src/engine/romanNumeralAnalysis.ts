/**
 * Roman numeral analysis from key and chord (root + quality).
 */

import type { ChordQuality } from '../domain/chord.js';
import type { Key } from '../domain/key.js';
import type { RootSemitone } from '../domain/key.js';
import type { RomanNumeral, RomanNumeralQuality } from '../domain/romanNumeral.js';

/** Diatonic scale degrees in major: PC offset from key root → degree 1–7. */
const MAJOR_PC_TO_DEGREE: Record<number, number> = { 0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7 };
/** Diatonic scale degrees in minor (natural): PC offset → degree. */
const MINOR_PC_TO_DEGREE: Record<number, number> = { 0: 1, 2: 2, 3: 3, 5: 4, 7: 5, 8: 6, 10: 7 };

/** Diatonic chord quality per degree in major (degree 1–7). */
const MAJOR_DIATONIC: Record<number, RomanNumeralQuality> = {
  1: 'major', 2: 'minor', 3: 'minor', 4: 'major', 5: 'major', 6: 'minor', 7: 'diminished',
};
/** Diatonic chord quality per degree in minor. */
const MINOR_DIATONIC: Record<number, RomanNumeralQuality> = {
  1: 'minor', 2: 'diminished', 3: 'major', 4: 'minor', 5: 'minor', 6: 'major', 7: 'diminished',
};

const RN_SYMBOLS_MAJOR: Record<number, string> = { 1: 'I', 2: 'ii', 3: 'iii', 4: 'IV', 5: 'V', 6: 'vi', 7: 'vii°' };
const RN_SYMBOLS_MINOR: Record<number, string> = { 1: 'i', 2: 'ii°', 3: 'III', 4: 'iv', 5: 'v', 6: 'VI', 7: 'vii°' };

function chordQualityToRNQuality(q: ChordQuality): RomanNumeralQuality {
  switch (q) {
    case 'maj':
    case 'maj7':
    case 'maj7#11':
    case 'mmaj7':
      return 'major';
    case 'min':
    case 'min7':
      return 'minor';
    case 'dim':
    case 'dim7':
      return 'diminished';
    case 'm7b5':
      return 'half-diminished';
    case '7':
    case '7#11':
    case '7alt':
    case '7b9':
      return 'dominant';
    case 'aug':
      return 'augmented';
    case 'sus2':
    case 'sus4':
      return 'major'; // treat sus as major context
    default:
      return 'major';
  }
}

/** Semitone offset from key root (0–11). */
function pcOffset(root: RootSemitone, keyRoot: RootSemitone): number {
  return (root - keyRoot + 12) % 12;
}

/**
 * Compute Roman numeral for a single chord in the given key.
 */
export function getRomanNumeral(
  key: Key,
  root: RootSemitone,
  quality: ChordQuality
): RomanNumeral {
  const offset = pcOffset(root, key.root);
  const pcToDegree = key.mode === 'major' ? MAJOR_PC_TO_DEGREE : MINOR_PC_TO_DEGREE;
  const diatonic = key.mode === 'major' ? MAJOR_DIATONIC : MINOR_DIATONIC;
  const symbols = key.mode === 'major' ? RN_SYMBOLS_MAJOR : RN_SYMBOLS_MINOR;

  const degree = pcToDegree[offset];
  const rnQuality = chordQualityToRNQuality(quality);

  if (degree !== undefined) {
    const diaton = diatonic[degree];
    const symbol = symbols[degree];
    const isDominant = quality === '7' || quality === '7#11' || quality === '7alt' || quality === '7b9';
    const isApplied = isDominant && diaton !== 'major' && degree !== 5;
    if (isApplied) {
      return {
        symbol: `V7/${degree}`,
        degree: 5,
        quality: 'dominant',
        appliedToDegree: degree,
      };
    }
    const borrowed = rnQuality !== diaton;
    let sym = symbol;
    if (isDominant && degree === 5) sym = 'V7';
    else if (isDominant && degree === 1) sym = key.mode === 'major' ? 'I7' : 'i7';
    return {
      symbol: sym,
      degree,
      quality: rnQuality,
      ...(borrowed && { borrowed: true }),
    };
  }

  // Chromatic: borrowed or applied
  for (let d = 1; d <= 7; d++) {
    const diatonicRoot = key.mode === 'major'
      ? (key.root + [0,2,4,5,7,9,11][d - 1]) % 12
      : (key.root + [0,2,3,5,7,8,10][d - 1]) % 12;
    const domRoot = (diatonicRoot + 7) % 12;
    if (root === domRoot && (quality === '7' || quality === '7b9' || quality === '7alt')) {
      return { symbol: `V7/${d}`, degree: 5, quality: 'dominant', appliedToDegree: d };
    }
  }

  return {
    symbol: '?',
    degree: 0,
    quality: rnQuality,
    borrowed: true,
  };
}
