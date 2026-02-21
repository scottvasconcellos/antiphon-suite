# Drum Engine — In-App (StemForge MIDI)

StemForge MIDI’s drum engine runs **entirely in-app**: no Docker, no separate “pack” to install. It turns a drums stem into four MIDI files (kick, snare, tops, perc) that match the source length and tempo.

---

## How it works

- **Onset detection:** Librosa (hop 256, backtrack) so note times line up with transients.
- **Features per onset:** Low/mid/high band energy, spectral centroid, transient sharpness, attack energy.
- **Cross-referencing:** Several classification rules (snare-priority, kick-priority, balanced) run on the same onsets; onsets within 30 ms are merged and the **majority vote** picks the role (kick/snare/tops/perc). That keeps one process but uses multiple “opinions” for robustness.
- **Tempo:** BPM is estimated from the same audio (or taken from the beat grid when the pipeline provides it) so the DAW grid matches the source. When the pipeline passes **beat_times**, a **variable tempo map** is written into each MIDI file (per-beat BPM from consecutive beat times), so the DAW grid follows the audio even when tempo changes.
- **Length:** Each of the four MIDI tracks gets an end anchor at the **exact audio duration**, so in the DAW all four tracks are the same length as the original stem and don’t run long or short.

---

## Script and pipeline

- **Script:** `scripts/basic_drum_engine.py`  
  Input: JSON `{ "audioPath", "outputDir?", "bpm?", "beat_times?" }`.  
  Output: four paths `drums_kick`, `drums_snare`, `drums_tops`, `drums_perc`.
- **Runner:** `scripts/basic-drum-engine-runner.mjs` → `runBasicDrumEngine(audioPath, options)`.
- The main pipeline uses this engine for drums (no external apps).

---

## Testing

- **Internal test:** `scripts/test_basic_drum_engine.py` generates a ground-truth WAV (backbeat, fills, triplets, polyrhythm, dense 32nd-note-style fill), runs the engine, and compares onset recall and role accuracy in an unbiased way. Run from the app dir:  
  `python scripts/test_basic_drum_engine.py`  
  Optional: `--write-wav path.wav`, `--keep` to keep output MIDI.

See also: [STEM_FORGE_APP_SPEC.md](STEM_FORGE_APP_SPEC.md) § Drum Engine, [SCRIPT_CONTRACTS.md](SCRIPT_CONTRACTS.md).
