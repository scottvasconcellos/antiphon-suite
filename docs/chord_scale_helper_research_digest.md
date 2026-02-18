# Chord Scale Helper — Research Digest

Synthesis of existing research and external sources for the harmonic analysis engine. Use this with [chord_scale_helper_research_index.md](chord_scale_helper_research_index.md) and [chord_scale_helper_engine_spec.md](chord_scale_helper_engine_spec.md).

---

## Key inference

- **Krumhansl-Schmuckler:** Compare pitch-class (or chord-root) distribution to 12-D major/minor key profiles; pick key with highest correlation. Archived logic uses profile score.
- **Temperley:** Bayesian key-finding; segment-based analysis; **modulation penalty** between segments. Use for multi-key or per-segment key.
- **Modal / ambiguous:** Key-finding is hardest in modal or ambiguous progressions. Define “tonal center” and “modal ambiguity”; when two keys are close, return alternates or “mixed” with segments.
- **Relative vs parallel minor:** Prefer “vi in major” vs “i in relative minor” using position and cadence; document rule (e.g. cadence in major → major key).
- **Engine inputs:** Profile score (K-S style), diatonic vs borrowed vs chromatic weighting, **cadence analysis** (authentic, plagal, deceptive, iv–V–I, half), first/last chord as tonic, secondary-dominant detection (V of next chord’s root), borrowed-chord penalty. Return best key or MULTIPLE/ambiguous when appropriate.

---

## Chord-scale (one scale per chord)

- **Rule (Open Music Theory):** (1) List all chord tones (including extensions/alterations). (2) Fill gaps with scale steps, avoiding augmented seconds and consecutive half steps. (3) Scale must contain all chord tones (root, 3, 5, 7).
- **Avoid notes:** A scale degree a half-step above a chord tone (e.g. 4 in Ionian over maj7) is an “avoid” on strong beats. **Lydian over maj7** has no avoid note. Prefer scale with no avoid note as **tie-breaker** when multiple scales fit.
- **Jazz chord-scale:** Dominant → Mixolydian (or Lydian Dominant for 7♯11); min7 → Dorian; maj7 → Ionian or Lydian; altered dominant → Altered/Super-Locrian. Engine picks **one** using context (key, function, avoid notes).
- **Systematic coverage:** Use “All chord types, all chord skills” (or equivalent) for chord-type → scale mapping and **priority** table (e.g. maj7: Ionian vs Lydian by context).

---

## Roman numerals and applied / borrowed / modulation

- **Diatonic:** Per key and scale degree (I–vii° in major; i–VII in natural minor, with III, VI, VII). Expected qualities per degree in archived `getExpectedQualities(mode, degreeIndex)`.
- **Borrowed (modal mixture):** From **parallel** key (same tonic, other mode). No cadence in the borrowed key; original tonic stays. Notation: iv, ♭VI, ♭II in major.
- **Secondary dominants (applied):** Major or dom7 whose root is a **perfect 5th above** the **following** chord’s root; that following chord must be diatonic. Notation: V/V, V7/IV, vii°/V. Rule: “Is this chord’s root a 5th above the next chord’s root, and is the next chord’s root a scale degree?” → label as applied dominant to that degree.
- **Modulation vs borrowed:** **Modulation** = new key **confirmed by a cadence** in that key. **Borrowed/tonicization** = chromatic color without a cadence in the new key. Engine needs a **cadence detector** in candidate keys to decide “modulation” vs “borrowed.”
- **Domain:** `RomanNumeral.appliedToDegree` (1–7) for V/X.

---

## Time signature and beat from MIDI

- **Symbolic MIDI:** Beat and downbeat from note onsets; time-signature changes possible with dedicated models.
- **MVP:** If MIDI has no meta events, (a) default 4/4 and use chord boundaries to refine, or (b) integrate a beat/tactus model. Document “MVP = 4/4 default + optional manual override” vs “integrate beat tracker.”
- **Chord boundaries:** Segment by fixed grid vs onset-based vs change-detection; beat-snapping rule (snap to beat N within measure).

---

## Chord recognition from MIDI

- **Pipeline:** (1) Segment time into chord windows (beat-aligned or onset-based). (2) Per window: pitch classes + optional bass = lowest. (3) Root: often bass or most “root-like” from bass + voicing. (4) Quality: major/minor/dim/aug/sus from intervals. (5) Extensions from PC set.
- **Bass = root vs inversion:** Document rule: “bass is root unless PC set implies slash chord”; how to infer inversion (e.g. C/E).
- **PC set → quality:** Table mapping common sets (0,4,7,10 → dom7; 0,3,7,10 → m7) and handle sus, add9, etc.

---

## Vernacular and notation

- **Common variants:** minus vs m, Δ vs maj7, ø vs m7b5, o vs dim, + vs aug. Normalize to canonical symbols so parser and display are consistent (see engine spec §1).

---

## Testing and correctness

- **Ground-truth corpus:** Small set of progressions with authoritative key, Roman numerals, and chord-scale per chord. Use for regression and success criteria (Layer 0: scale doesn’t contradict chord; RN doesn’t contradict key).
