# Layer0 — Chord Scale Helper

## Distribution

This app is a **standalone desktop app** that can be managed (install, update, launch) by Antiphon Hub when Hub is present (currently alpha). It runs fully offline and does not require the Hub process after first authorization.

---

## Point of the App

To provide an authoritative harmonic analysis engine that assigns one definitive chord-scale to each chord in a progression and makes that logic visible, accurate, and exportable.

---

## User Outcome

An advanced but frustrated theory-aware songwriter can:

- Import or enter a chord progression.
- See exactly which scale belongs to each chord.
- Understand its Roman numeral function relative to the key.
- View the full scale and chord tones visually.
- Export that framework to use in their DAW.
- Write melodies without fear of harmonic error.
- Finish songs they would otherwise abandon.

---

## One-Sentence Truth

This app gives advanced songwriters one authoritative chord-scale per chord, aligned to the exact moment it occurs in a progression, so they can write melodies without fear of harmonic error.

---

## Non-Negotiables

1. One definitive chord-scale per chord (no ambiguous option lists at MVP).
2. Accuracy over speed (analysis time is secondary to correctness).
3. Internal harmonic consistency (key, Roman numeral, scale, and chord must never contradict).
4. Fully offline desktop operation.
5. Precise beat and measure handling for export accuracy.

---

## Kill List (MVP Identity Boundaries)

This app is not:

- A DAW
- A full MIDI editor
- A full arranger
- A melody generator
- A harmony generator
- A plugin
- A theory curriculum
- A cloud-based tool
- A collaboration platform

It replaces blind guessing inside a DAW piano roll.

---

## MVP Scope

**Core Capabilities**

- MIDI import
- Time signature detection
- Chord detection with beat snapping
- Manual chord entry (button builder + optional syntax)
- Chord duration handling (in beats)
- Key inference
- Borrowed/modal chord handling
- One definitive chord-scale per chord
- Roman numeral display
- Chord cards UI
- Interactive piano scale visualization
- MIDI export (chord progression + scale map)
- Offline operation

---

## Success Criteria (Testable)

**Given:** A MIDI progression with clear harmonic intent

**When:** The user imports it

**The app must:**

- Detect correct time signature
- Correctly infer key (or valid multi-key internal handling)
- Assign one musically coherent chord-scale per chord
- Display correct Roman numerals
- Display accurate scale notes
- Export a MIDI scale map aligned to measure structure

**Failure if:**

- Any scale contains notes contradicting chord quality
- Roman numeral contradicts inferred key
- Scale notes differ from internal computation
- Key detection is clearly incorrect for a straightforward progression

---

## Known Risks & Unknowns

1. Key inference in heavily modal or ambiguous progressions.
2. Handling true modulation vs borrowed chords.
3. Chord detection accuracy from messy MIDI input.
4. Scale selection logic when multiple theoretically valid options exist.
5. Maintaining authoritative output without oversimplifying advanced harmony.
