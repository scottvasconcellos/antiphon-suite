## Edge-Case Suites (E001–E050)

This document indexes a set of **edge-case progressions** (E001–E050) designed to stress-test the key/modulation engine under ambiguity. Each edge case is intended to exercise one or more of the three axes:

- **Axis A — Modulation vs tonicization**
- **Axis B — Primary key choice**
- **Axis C — Cadence and multi-step modulation recognition**

The full question sets and options live in separate research notes (see your local `Downloads` docs). This file records how they map into the engine’s categories and axes so they can be promoted into executable tests over time.

### Structure of an edge case

For each `E00x` we track:

- `progression`: chord symbols as an array of strings.
- `axis`: primary axis (A, B, or C) the case is meant to train.
- `categories`: one or more phenomenon tags, e.g. `['tonicization_vs_modulation']`.
- `notes`: short rationale for the chosen ground truth.
- `gt`: intended ground truth in the same spirit as the K-suite:
  - `keyStart`
  - `modulates`
  - optional `segments`

When promoted to executable tests, an E-case will become either:

- A new entry in `KEY_MODULATION_SUITE` with `category` pointing to one of these tags, or
- A separate `edge-case` test that uses the same analysis pipeline but is kept distinct from the K-regression canon.

### Example mappings (subset)

- **E001**
  - Progression: `['C', 'G', 'Am', 'F']`
  - Axis: **B** (primary key choice C vs A minor)
  - Categories: `['ambiguous_loop', 'relative_major_minor']`
  - Notes: No V–I / V–i; test default bias toward major while exposing alternates.

- **E005**
  - Progression: `['C', 'D7', 'G', 'A7', 'D', 'G']`
  - Axis: **A/C** (modulation vs applied-dominant chain; cadence recognition)
  - Categories: `['multistep_modulation', 'tonicization_vs_modulation']`
  - Notes: A7–D–G chain; decide whether and where a C→G modulation is justified.

- **E010**
  - Progression: `['C', 'G', 'C', 'E', 'A', 'D', 'G']`
  - Axis: **C**
  - Categories: `['circle_of_fifths', 'false_cadence']`
  - Notes: Dominant chain that never stabilises clearly in the new key; tests phrase-boundary and cadence rules.

- **E020**
  - Progression: `['C', 'Am', 'F', 'G', 'Am']`
  - Axis: **B**
  - Categories: `['relative_major_minor', 'ending_on_vi']`
  - Notes: Ending on vi without I; tests whether loop key is A minor or C major.

- **E033**
  - Progression: `['E', 'A', 'B', 'E', 'G', 'C', 'D', 'G']`
  - Axis: **C**
  - Categories: `['two_segment', 'hard_modulation']`
  - Notes: Clear E-major then G-major regions; tests recognition of an abrupt modulation.

The remaining E-cases should be mapped in the same way, using the deep research docs as the musical source of truth. As they are promoted into the executable suite, their IDs and mappings should be cross-referenced here so that:

- It is always clear **which axis** each rule is being tested against.
- We can see which categories (parallel_minor, modal, circle_of_fifths, etc.) have strong edge coverage and which need more.

