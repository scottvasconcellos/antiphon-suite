# Chord Scale Helper — Engine Spec

Single reference for the harmonic analysis engine (Operations arc). Informed by research index and domain types in `apps/layer-app-chord-scale-helper/src/domain/`.

## 1. Chord parser and vernacular

- **Input:** Chord symbol string (e.g. `Dm7`, `G7`, `CΔ`, `F#m7b5`, `Bb/C`).
- **Output:** `{ root: RootSemitone, quality: ChordQuality, bass?: RootSemitone, normalizedSymbol: string }`.
- **Root:** Letter (A–G) + optional `#` or `b`; mapped to 0–11 (C=0). Double sharps/flats not required for MVP.
- **Quality:** Canonical set from domain `ChordQuality`: `maj`, `maj7`, `min`, `min7`, `7`, `m7b5`, `dim`, `dim7`, `sus2`, `sus4`, `aug`, `maj7#11`, `7#11`, `7alt`, `7b9`, `mmaj7`.
- **Vernacular (normalize to canonical):**
  - Triad: `C`, `Cmaj`, `CΔ` → `maj`; `Cm`, `Cmin` → `min`; `Cdim`, `Co` → `dim`; `Caug`, `C+` → `aug`.
  - Seventh: `Cmaj7`, `CΔ7`, `CM7` → `maj7`; `Cm7`, `Cmin7` → `min7`; `C7` → `7`; `Cm7b5`, `Cø`, `Cø7` → `m7b5`; `Cdim7`, `Co7` → `dim7`; `Cmmaj7`, `CmΔ7` → `mmaj7`.
  - Extensions/alterations: `Cmaj7#11`, `CΔ#11` → `maj7#11`; `C7#11` → `7#11`; `C7alt` → `7alt`; `C7b9` → `7b9`.
  - Sus: `Csus2`, `Csus4` → `sus2`, `sus4`.
- **Slash:** `Chord/Bass` → bass root parsed same as root; chord root and quality from left part.
- **Display:** `normalizedSymbol` uses sharp spellings and canonical quality (e.g. `C#m7` not `Dbm7` for 0x0E semitone; MVP may keep input spelling or normalize to sharps).

## 2. Time signature (text)

- Input: optional `timeSignature?: "4/4" | "3/4" | "6/8" | ...`; default `4/4`.
- Output: `TimeSignature { numerator, denominator }`.

## 3. Key inference

- **Algorithm:** Combine (a) profile score (Krumhansl-Schmuckler or Temperley-style), (b) diatonic vs borrowed vs chromatic weighting, (c) cadence analysis (authentic, plagal, deceptive, iv–V–I, half), (d) first/last chord as tonic bonus, (e) secondary-dominant detection (V of next chord’s root), (f) borrowed-chord penalty (e.g. parallel-mode match). Optional: Temperley-style segment-based analysis with modulation penalty.
- **Output:** `Key` with `confidence`; when ambiguous, `Key.alternates` (runner-up keys) or multi-key/segment-key in a later version.
- **Modal/ambiguous:** When two keys are close, return alternates or “mixed”; document tonal-center and ambiguity handling (see research digest).

## 4. Roman numerals and applied/borrowed/modulation

- **Input:** key + chord list (and optional next-chord for applied detection). **Output:** RN per chord; degree 1–7; quality; `borrowed`; `appliedToDegree` for V/X.
- **Diatonic:** I–vii° in major; i–VII in natural minor (with III, VI, VII). Expected qualities per degree.
- **Secondary dominant:** Root = P5 above **next** chord’s root and next chord’s root is diatonic → label applied (e.g. V/V → `appliedToDegree: 2`). Notation: V/V, V7/IV, vii°/V.
- **Borrowed (modal mixture):** From parallel key (same tonic, other mode); no cadence in borrowed key. Notation: iv, ♭VI, ♭II in major. Set `RomanNumeral.borrowed`.
- **Modulation vs borrowed:** Modulation = new key confirmed by **cadence** in that key. Borrowed = chromatic color without cadence. Cadence detector in candidate key required to decide; MVP may output single key + borrowed and document “multi-key in later version.”

## 5. Chord-scale selection

- **Rule:** (1) List chord tones. (2) Scales that contain all chord tones; avoid augmented seconds and consecutive half steps. (3) **One** scale per chord: use CHORD_SCALE_MAP (quality × degree × context).
- **Tie-breakers:** (1) Prefer scale with **no avoid note** (half-step above chord tone). (2) Lydian over Ionian for maj7. (3) Fixed priority (e.g. Dorian for ii, Mixolydian for V7, Altered for 7alt).
- **Implemented:** `getChordScale` in `engine/chordScaleSelector.ts`; extend with avoid-note table and explicit tie-breaker order.

## 6. Consistency

- **Invariants:** Key vs Roman numerals vs scale vs chord quality must never contradict. Scale must contain all chord tones; RN consistent with key (or marked applied/borrowed).
- **On failure:** Reject or mark key/analysis as ambiguous and surface (e.g. `ConsistencyResult.valid === false`, `errors[]`).
- **Implemented:** `checkConsistency`, `scaleContainsChordTones`, `romanNumeralConsistentWithKey` in `engine/consistencyChecker.ts`.

## 7. Time signature and chord from MIDI

- **Time signature from MIDI:** `getTimeSignatureFromMidiMeta(meta)` — if meta present and valid, use it; else 4/4 default. Implemented in `engine/midiTimeSignature.ts`.
- **Chord boundaries:** Segment by fixed grid (beat-aligned) or onset-based or change-detection; beat-snapping rule (snap to beat N within measure).
- **Chord detection (MIDI):** `getChordFromPitchClassSet(pitchClasses, bassNote)` — bass = root heuristic; quality from PC-set table (0,4,7,10 → 7, etc.). Implemented in `engine/chordFromPitchClassSet.ts`. Full pipeline: segment → PC set + bass → this function → Chord with BeatSpan when combined with segment timing.

## 8. MIDI export

- `buildScaleMapForExport(analyzed)` — returns `ScaleMapEntry[]` (startBeat, durationBeats, chordId, chordSymbol, scaleName, romanNumeralSymbol) aligned to progression for MIDI or DAW export. Implemented in `engine/midiExport.ts`.

---

*See also [chord_scale_helper_research_digest.md](chord_scale_helper_research_digest.md) and plan architecture (BorrowedModalDetection, ModulationDetection, ConsistencyChecker).*
