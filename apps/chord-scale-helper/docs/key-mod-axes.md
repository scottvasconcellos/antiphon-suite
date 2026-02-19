## Key/Modulation Engine Axes (A/B/C)

This engine’s behaviour is organised around **three independent analysis axes**. Every new heuristic, weight, or threshold MUST declare which axis (or axes) it touches.

- **Axis A — Modulation vs tonicization**
  - Question: *“Does the key change at all, or are we still in the same key with tonicizations/colour?”*
  - Examples:
    - I–IV–V–I and diatonic loops in a single key → **no modulation**.
    - Short V/X → X (secondary dominant) that immediately returns to the original tonic → **tonicization only**.
    - A sustained new-key region with its own cadence and at least a minimal span (e.g. pivot + V–I, or ii–V–I) → **modulation**.

- **Axis B — Primary key choice under ambiguity**
  - Question: *“Given multiple plausible keys, which key label should be primary?”*
  - Examples:
    - Relative major/minor ambiguity (C vs A minor) when there is no clear V–I / V–i.
    - Parallel major/minor / Picardy-style situations (C vs C minor).
    - Modal vs major/minor readings (C vs C mixolydian; E minor vs G major).

- **Axis C — Cadence and multi-step modulation recognition**
  - Question: *“Where and how does the key change, and which cadential pattern justifies a segment boundary?”*
  - Examples:
    - Simple V–I or V7–I cadences as candidates for new-key segments.
    - ii–V–I chains and extended dominant sequences (…, E7–A7–D7–G …).
    - Pivot-chord modulations where one chord belongs functionally to both keys.

### Examples by axis

- **Axis A (modulation vs tonicization)**
  - Pure diatonic I–IV–V–I in any key must NEVER produce a modulation.
  - Pure circle-of-fifths loop (e.g. C–Am–Dm–G–C–E–A–D–G–C) that starts and ends on the same tonic must NOT be treated as modulation.
  - Single borrowed iv (Fm in C) or single V/V without a new-key cadence should be treated as **colour** only.

- **Axis B (primary key choice)**
  - Loops like C–G–Am–F or Am–F–C–G–Am can be heard in C or A minor. Without a strong minor cadence, prefer **C major** but expose A minor as an alternate.
  - Parallel-major/minor “Picardy” situations (ending on C after a mainly C-minor palette) should explicitly record both C major and C minor in posteriors, even if one must be primary.
  - Modal candidates (mixolydian, dorian, etc.) should be tracked as alternates or tagged explicitly rather than silently forced to major/minor when evidence is weak.

- **Axis C (cadence and multi-step recognition)**
  - ii–V–I patterns (Dm–G–C) carry more cadential weight than histogram alone and should bias segmentation.
  - Multi-step modulations (e.g. B7–Em, C#7–F#m, G7–Cm) require recognising an extended dominant leading to a **new** tonic with at least a minimal span (2+ chords).
  - Phrase boundaries matter: a V–I at the end of a phrase carries more weight than the same two chords mid-phrase.

### Rule-change checklist (must be answered for every engine change)

When adding or changing a heuristic in the key/modulation engine, answer these questions in the PR / design note:

1. **Which axis does this rule touch?**
   - A (modulation vs tonicization)?
   - B (primary key choice)?
   - C (cadence / multi-step recognition)?
2. **Which categories / phenomena are affected?**
   - Examples: `parallel_minor`, `modal`, `circle_of_fifths`, `tonicization_vs_modulation`, `multi_step_modulation`, `false_cadence`, `ambiguous_loop`.
3. **Which K-cases and E-cases is this rule meant to help?**
   - List specific IDs: e.g. K020, K021, K162; E005, E033, etc.
4. **Which K/E cases might this hurt if the rule over-fires?**
   - Identify nearby patterns that rely on *not* modulating or on keeping a different primary key.
5. **What are the concrete musical thresholds or conditions?**
   - e.g. “Require ≥2 chords in the new key after a V–I before calling it a modulation.”
   - e.g. “Do not treat vi tonicizations as modulations unless there is an explicit V–i cadence and the phrase ends on i.”
6. **How will we validate the change?**
   - Which category suites will be re-run?
   - What per-category metrics (pass/soft/fail) do we expect to improve, and which must remain stable?

### Using external research docs

The following documents are considered source material for these axes and thresholds:

- `(A) Distinguishing “true modulation” from toniciza.md`
- `(B) Choosing the “primary key” in ambiguous _ para.md`
- `Cadence and Multi-Step Modulation Recognition.md`
- `deep-research-report*.md`

When you introduce or adjust a rule:

- **Cite** the relevant document and section (where possible).
- **Distil** the musical reasoning into one or two clear, testable conditions.
- **Tie** each condition to at least one K-case and (optionally) one E-case in the suite.

