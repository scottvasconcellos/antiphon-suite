# Design System Second-Pass Audit

**Date:** 2026-02-17  
**Scope:** Verify piano roll, piano diagram, guitar/bass fretboards and other full builds are present, exported, and visible.

---

## Verified: Package Contents

### Audio components (all present and exported)

| Component       | File                    | Export | Notes |
|----------------|-------------------------|--------|--------|
| **PianoRoll**  | `audio/PianoRoll.tsx`   | ✅     | Full piano roll: grid, draw/erase, quantize, note drag, expand. |
| **PianoKeyboard** | `audio/PianoKeyboard.tsx` | ✅  | Full 88-key virtual piano: scroll, note press/release, minimap. (This is the “piano diagram” keyboard.) |
| **Fretboard**  | `audio/Fretboard.tsx`   | ✅     | Guitar (6-string) and bass (4-string) with **note selection**: click frets to toggle dots, `onNoteSelect`, Clear All, expand. |
| GrooveGrid     | `audio/GrooveGrid.tsx`  | ✅     | Step sequencer grid. |
| Knob           | `audio/Knob.tsx`        | ✅     | Rotary control. |
| Synthesizer    | `audio/Synthesizer.tsx` | ✅     | Synth UI. |
| Transport      | `audio/Transport.tsx`   | ✅     | Playback controls. |
| Waveform       | `audio/Waveform.tsx`    | ✅     | Waveform display. |

- **Exports:** All 8 audio components are exported from `src/components/audio/index.ts` and re-exported from `src/components/index.ts` and `src/index.ts`. Consumers get them via `@antiphon/design-system` or `@antiphon/design-system/components`.
- **README / USAGE_EXAMPLES:** PianoRoll, PianoKeyboard, Fretboard, and other audio components are documented.

---

## Discrepancies found and fixes

### 1. Storybook did not show piano/fretboard components

- **Issue:** Only **Button** and **Card** had stories. Piano roll, piano keyboard, and guitar/bass fretboards were not visible in Storybook.
- **Fix:** Added stories so they are visible under **Design System/Audio/**:
  - **PianoRoll** – Default, WithNotes
  - **PianoKeyboard** – Default, TwoOctaves, NoNoteNames
  - **Fretboard** – Guitar, Bass, GuitarWithCallback

You can see and interact with these in Storybook after running `pnpm --filter @antiphon/design-system storybook` and opening http://localhost:6006.

### 2. Exports smoke test did not cover audio components

- **Issue:** `tests/exports-smoke.test.ts` only asserted Button, Card, CardHeader, tokens, and two icons. PianoRoll, PianoKeyboard, and Fretboard were not asserted.
- **Fix:** Smoke test now asserts `PianoRoll`, `PianoKeyboard`, and `Fretboard` are exported and callable.

---

## Naming note

- There is no separate **“Piano Diagram”** component. The **PianoKeyboard** component is the full virtual piano (88-key keyboard with white/black keys, scroll, minimap) and is the intended “piano diagram” in the design system.

---

## Knobs, Synthesizer, and design tokens (palette, fonts, hierarchy, spacing)

### Knob
- **Color palette:** Uses CSS variables for track (`--color-border-strong`), value arc (`--color-accent-primary`), indicator (`--color-text-primary`), center cap (`--color-bg-surface-elevated`, `--color-border-strong`), background (`--color-bg-inset`).
- **Fonts / hierarchy:** Label uses `.hardware-label` (design system utility); value uses `.telemetry` (mono, code-style).
- **Spacing:** `gap-2` between label, knob, and value.

### Synthesizer
- **Color palette:** All chrome uses design tokens (`--color-bg-surface`, `--color-border-subtle`, `--color-bg-app-shell`, `--color-bg-inset`, `--color-accent-primary`, `--color-text-muted`, `--color-text-primary`, `--color-overlay-hover`, etc.). **Canvas:** Waveform and ADSR envelope previously used hardcoded `#60a5fa`; they now use `colorValues.accent.primary` and `colorValues.overlay.selected` from `../../tokens/colors` so the palette is the single source of truth.
- **Fonts / hierarchy:** Section titles use `.hardware-label`; buttons and readouts use design system typography. Knobs inside the synth use the same token system.
- **Spacing:** `p-4`, `gap-4`, `mb-3`, `gap-2` for sections and controls (aligned with design system spacing scale).

### Storybook
- **Knob** and **Synthesizer** now have stories under **Design System/Audio/** (Default, sizes, row of knobs; Synthesizer default). You can see palette, fonts, hierarchy, and spacing in the Knob and Synthesizer stories.

---

## Summary

- **Package:** All listed components (including piano roll, piano keyboard, guitar/bass fretboards, Knob, Synthesizer) are in the package and correctly exported; nothing was missing from the build.
- **Visibility:** Storybook now includes Button, Card, PianoRoll, PianoKeyboard, Fretboard, **Knob**, and **Synthesizer**. The smoke test asserts PianoRoll, PianoKeyboard, and Fretboard.
- **Tokens:** Knob and Synthesizer use the design system color palette, fonts (hardware-label, telemetry), hierarchy, and spacing; Synthesizer’s canvas was updated to use accent/overlay from tokens instead of hardcoded hex.
