/**
 * Roman numeral function relative to key.
 * Foundation domain — types only.
 */

export type RomanNumeralQuality = 'major' | 'minor' | 'diminished' | 'half-diminished' | 'dominant' | 'augmented';

/** Roman numeral relative to key (e.g. "I", "ii", "V7", "bII"). */
export interface RomanNumeral {
  /** Symbol (e.g. "I", "ii", "V7", "bII"). */
  symbol: string;
  /** Scale degree 1–7 (or 0 for non-diatonic). */
  degree: number;
  quality: RomanNumeralQuality;
  /** True if borrowed or modal (e.g. bII, iv). */
  borrowed?: boolean;
  /** When secondary dominant (e.g. V/V), the degree of the tonicized chord 1–7. */
  appliedToDegree?: number;
}
