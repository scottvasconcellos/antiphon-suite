# Chord Scale Helper — Research Index

References used to inform the harmonic analysis engine (Operations arc). Listed by source and which capability they inform.

| Source | Arc / capability |
|--------|-------------------|
| **Scholarly Sources/Chord Scale Helper/App Purpose.rtf** | Product intent, user outcome, “chord-scale per chord” and DAW export. |
| **Scholarly Sources/Chord Scale Helper/Competitor Products.pdf** | Operations: competitive landscape, feature boundaries. |
| **Scholarly Sources/Chord Scale Helper/All court types, all court skills, systematic brea.pdf** | Operations: chord/scales, systematic coverage. |
| **Scholarly Sources/Chord Scale Helper/is there a way to common use or vernacular that mu.pdf** | Operations: vernacular naming, common-practice choices. |
| **Scholarly Sources/Chord Scale Helper/Modal Key Detection.pdf** | Operations: key inference, modal/ambiguous progressions. |
| **Archived/Chord Scale Helper (HTML drafts, chord-scale-react)** | Logic and data-structure reference only; branding/layout obey monorepo design system. |

## Suggested supplement

- **Temperley:** “A Bayesian Approach to Key-Finding”; segment-based analysis and modulation penalty; key-finding code (e.g. temperley-keyb) if available.
- **Open Music Theory (or equivalent):** Applied chords, modal mixture, modulation; formal definitions for secondary dominant, borrowed, and cadence-in-new-key.
- **Avoid notes:** Wikipedia “Avoid note” + jazz pedagogical sources; list avoid notes per mode; “prefer Lydian over Ionian for maj7” as tie-breaker.
- **Beat/tactus from MIDI:** Transformer or CRNN beat-tracking on symbolic MIDI; MVP vs integrate beat tracker.
- **Chord/MIDI analysis:** BACHI, MusicLang, or similar for chord-boundary and root/quality/bass stages.
- **Research digest:** [chord_scale_helper_research_digest.md](chord_scale_helper_research_digest.md) — synthesis of the above and plan for engine spec.
