/**
 * One chord-scale per chord: select scale from key, chord root, quality, and degree.
 * Tie-breaker: prefer scale with no avoid note (e.g. Lydian over Ionian for maj7).
 */

import type { ChordQuality } from '../domain/chord.js';
import type { Key } from '../domain/key.js';
import type { RootSemitone } from '../domain/key.js';
import type { Scale } from '../domain/scale.js';

/** Mode scales: intervals in semitones from root. */
const SCALE_INTERVALS: Record<string, number[]> = {
  Ionian: [0, 2, 4, 5, 7, 9, 11],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  Aeolian: [0, 2, 3, 5, 7, 8, 10],
  Locrian: [0, 1, 3, 5, 6, 8, 10],
  'Altered': [0, 1, 3, 4, 6, 8, 10],
  'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
};

/** Avoid notes per chord quality: semitone above a chord tone (scale degree to avoid on strong beats). Ionian maj7: 5 is half-step above 4. */
const AVOID_NOTE_INTERVALS: Partial<Record<ChordQuality, number[]>> = {
  maj7: [5],
  maj: [5],
  'maj7#11': [],
  mmaj7: [5],
  min7: [6],
  min: [6],
  '7': [4, 11],
  '7#11': [11],
  '7alt': [],
  '7b9': [11],
};

function makeScale(name: string): Scale {
  const intervals = SCALE_INTERVALS[name];
  return {
    id: name.toLowerCase().replace(/\s/g, '-'),
    name,
    intervals: intervals ?? [0, 2, 4, 5, 7, 9, 11],
  };
}

/** True if the scale does not contain any avoid note for this chord quality (tie-breaker). */
export function scaleHasNoAvoidNote(scale: Scale, quality: ChordQuality): boolean {
  const avoid = AVOID_NOTE_INTERVALS[quality];
  if (!avoid || avoid.length === 0) return true;
  const set = new Set(scale.intervals);
  return !avoid.some((a) => set.has(a));
}

/**
 * Select one scale for the chord. Degree is 1–7 in key (from Roman numeral).
 * Tie-breakers: (1) prefer scale with no avoid note; (2) Lydian over Ionian for maj7.
 */
export function getChordScale(
  _key: Key,
  _root: RootSemitone,
  quality: ChordQuality,
  degree: number
): Scale {
  if (degree === 0) return makeScale('Ionian');
  switch (quality) {
    case 'maj':
    case 'maj7':
    case 'maj7#11':
    case 'mmaj7':
      return degree === 4 ? makeScale('Lydian') : makeScale('Lydian');
    case 'min':
    case 'min7':
      return degree === 2 || degree === 6 ? makeScale('Dorian') : makeScale('Aeolian');
    case '7':
    case '7#11':
    case '7b9':
      if (degree === 5) return makeScale('Mixolydian');
      return makeScale('Mixolydian');
    case '7alt':
      return makeScale('Altered');
    case 'm7b5':
    case 'dim':
    case 'dim7':
      return makeScale('Locrian');
    case 'sus2':
    case 'sus4':
      return makeScale('Mixolydian');
    case 'aug':
      return makeScale('Lydian');
    default:
      return makeScale('Ionian');
  }
}
