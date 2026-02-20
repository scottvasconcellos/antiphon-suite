# Stem engines: export options and song grid

All exports are keyed off the **song grid** (tempo, meter, measure boundaries). Import MIDI to establish the grid; then use the engines below for each export type.

## Import

- **MIDI** — Use `@antiphon/song-grid`: `parseMidiBufferToGrid(buffer)` or `songGridFromUserInput({ bpm, numerator, denominator })` to create the grid. All downstream engines consume this grid for alignment.

## Export options (by engine)

| Export | Package | API / output |
|--------|---------|--------------|
| **Clean dry guitar/bass** | `@antiphon/guitar-engine` | `analyzeGuitarAudio(audio, { grid, sampleRate })` → `dryStem` (when available) |
| **De-effect guitar** | `@antiphon/guitar-deeffect` | `deeffectGuitar(wetAudio, { grid, sampleRate })` → `dryBuffer` |
| **Drums (kick / snare / tops)** | `@antiphon/drum-module` | `separateDrums(audio, { grid, sampleRate })` → `kick`, `snare`, `tops` stems |
| **Melody MIDI (clean, monophonic)** | `@antiphon/vocal-engine` | `extractMelody(vocalAudio, { grid, sampleRate })` → `melody` (notes for MIDI export) |
| **Vocal layers** | `@antiphon/vocal-engine` | `extractMelody` + optional `lyricsToSung(lyrics, options)` for synthesis |
| **MIDI → audio stems** | `@antiphon/midi-to-audio` | `renderMidiToWav(midiBuffer, { grid, sampleRate })` → WAV |

## UI integration

Layer apps or the Hub can offer:

1. **Import MIDI** — Parse file → grid (and optionally render to WAV via midi-to-audio).
2. **Export** — Per-export buttons or batch: dry guitar, de-effect guitar, kick/snare/tops, melody MIDI, vocal layers. Each uses the current song grid for timing.

See `docs/research/` for each engine’s research brief and implementation status.
