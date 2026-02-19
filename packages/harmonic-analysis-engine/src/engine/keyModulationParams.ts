/**
 * Key/modulation pipeline parameters (single place to tune).
 * Starter kit from doc 23: min span, snapback window, change penalty, cooldown.
 */

export interface KeyModulationParams {
  /** Chords after cadence in K₂ required to promote modulation (default 3). */
  modulationMinSpanChords: number;
  /** If we return to K₁ within this many chords after cadence, demote to tonicization (default 2). */
  snapbackWindowChords: number;
  /** Key-change penalty: require new key to win by margin for N chords (default 0.3). */
  keyChangePenalty: number;
  /** After a key switch, block another switch for this many chords unless panic override (default 4). */
  cooldownAfterSwitchChords: number;
  /** Margin above which we commit to a new key (two-track); below this, keep prior key (default 0.2). */
  commitMarginThreshold: number;
  /** Hysteresis: margin required to enter new key (default 0.25). */
  hysteresisEnter: number;
  /** Hysteresis: margin required to exit back to prior key (default 0.15). */
  hysteresisExit: number;
  /** Panic override: during cooldown, allow switch if margin exceeds this (default 0.5). */
  panicMarginThreshold: number;
  /** Min persistence: new key must lead for this many consecutive chords to promote (default 3). */
  persistenceChords: number;
}

export const DEFAULT_KEY_MODULATION_PARAMS: KeyModulationParams = {
  modulationMinSpanChords: 3,
  snapbackWindowChords: 2,
  keyChangePenalty: 0.3,
  cooldownAfterSwitchChords: 4,
  commitMarginThreshold: 0.2,
  hysteresisEnter: 0.25,
  hysteresisExit: 0.15,
  panicMarginThreshold: 0.5,
  persistenceChords: 3,
};
