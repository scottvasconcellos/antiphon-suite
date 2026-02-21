# Advanced drum engine and Omnizart (no Docker)

## What the advanced files are

- **`scripts/advanced_drum_engine.py`** — Runs **Omnizart** drum transcription via a **dedicated venv** (`.venv-omnizart`, no Docker), then splits the single MIDI into our four role files and aligns length/tempo to the source audio. Output filenames include `_omnizart` so you can tell which set is which.
- **`scripts/advanced-drum-engine-runner.mjs`** — Node helper: `runAdvancedDrumEngine(audioPath, { outputDir })` → four MIDI paths.

So the advanced path is: **Omnizart does the transcription; we do splitting and tempo/duration alignment.** We use a **separate Python 3.8 venv** so Omnizart (TensorFlow 2.5) doesn’t conflict with the main app.

---

## Using Omnizart (in-app, no Docker)

1. **Create the venv and install Omnizart**
   - From the app root (e.g. `apps/StemForgeMIDI`):  
     `python3.8 -m venv .venv-omnizart` (or `py -3.8 -m venv .venv-omnizart` on Windows)  
     `.venv-omnizart/bin/pip install omnizart` (and download checkpoints if required by Omnizart).
   - The main app runs `advanced_drum_engine.py` with the **main** venv (which has `pretty_midi`, `librosa`). That script then **subprocess-calls** `.venv-omnizart/bin/python -m omnizart drum transcribe ...` to do the transcription, reads the output MIDI, and runs the split/align step in-process.

2. **Run it**
   - If `.venv-omnizart` exists, `runAdvancedDrumEngine(audioPath, { outputDir })` runs Omnizart and returns the four paths (`*_omnizart_drums_*.mid`).
   - If the venv is missing, the script returns a clear error (no Docker fallback).

See also [DRUM_ENGINE_FOUR_PROCESSES.md](DRUM_ENGINE_FOUR_PROCESSES.md) for the full picture (basic, Omnizart, ADT-lib, DrummerScore) and merge plan.
