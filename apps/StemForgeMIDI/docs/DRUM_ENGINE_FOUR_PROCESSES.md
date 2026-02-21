# Drum engine: four processes and merge plan

We have **four** drum transcription sources. Each can be run **individually** so you can compare which set is which. If one or more don’t work well alone, we can merge them (e.g. median or best-of per section).

---

## 1. Basic drum engine (in-app, always available)

- **What:** Our in-app engine: Librosa onsets + spectral features + role classification, no Docker, no extra install.
- **Script:** `scripts/basic_drum_engine.py`
- **Runner:** `scripts/basic-drum-engine-runner.mjs` (used by the main pipeline and `run_drum_engine.mjs`).
- **Output:** Four MIDIs: `{stem}_drums_kick.mid`, `_drums_snare`, `_drums_tops`, `_drums_perc` (no suffix; this is the default set).

---

## 2. Omnizart (in-app via venv, no Docker)

- **What:** Omnizart does the transcription; we split its single MIDI into four role files and align length/tempo to the source audio.
- **Script:** `scripts/advanced_drum_engine.py` — runs Omnizart from a **dedicated venv** (`.venv-omnizart` with Python 3.8 and `pip install omnizart`), then splits and names with `_omnizart`.
- **Runner:** `scripts/advanced-drum-engine-runner.mjs`.
- **Output:** Four MIDIs: `{stem}_omnizart_drums_kick.mid`, etc., so you can tell which set is Omnizart.
- **Setup:** Create `.venv-omnizart` with Python 3.8, then `pip install omnizart`. No Docker.

---

## 3. ADT-lib

- **What:** ADTLib (Kick, Snare, Hi-hat) → we map to our four roles (tops = hi-hat, perc = empty) and write MIDIs with same length/tempo as audio.
- **Script:** `scripts/adtlib_drum_engine.py`
- **Runner:** `scripts/adtlib-drum-engine-runner.mjs`. Uses `.venv-drum-pack` if present (ADTLib needs madmom, TensorFlow, etc.).
- **Output:** Four MIDIs: `{stem}_adtlib_drums_kick.mid`, `_adtlib_drums_snare`, `_adtlib_drums_tops`, `_adtlib_drums_perc`.
- **Setup:** In a venv (e.g. `.venv-drum-pack`): `pip install ADTLib librosa pretty-midi numpy` (and their deps: madmom, tensorflow, etc.).

---

## 4. DrummerScore

- **What:** DrummerScore is **notebook-based** (Jupyter). You run their `main.ipynb` on your drum stem to get a labeled MIDI; we then **convert** that MIDI into our four-role format.
- **Script:** `scripts/drummerscore_drum_engine.py` — input is the **MIDI path** from DrummerScore (not the audio). Optionally pass `audioPath` for duration/tempo from the source audio.
- **Runner:** `scripts/drummerscore-drum-engine-runner.mjs` — pass `midiPath` (and optional `outputDir`, `audioPath`).
- **Output:** Four MIDIs: `{stem}_drummerscore_drums_kick.mid`, etc.
- **Setup:** Clone [DrummerScore](https://github.com/skittree/DrummerScore), run `main.ipynb` on your stem, then run our script with the resulting MIDI.

---

## Trying each process individually

- **Basic:**  
  `node scripts/run_drum_engine.mjs <path-to-drums.wav> [output-dir]`  
  → default set (no suffix).

- **ADT-lib:**  
  From Node: `runAdtlibDrumEngine(audioPath, { outputDir })`  
  Or run the script with JSON stdin (see script docstring).  
  → `*_adtlib_drums_*.mid`.

- **Omnizart:**  
  Create `.venv-omnizart` (Python 3.8, `pip install omnizart`), then:  
  `runAdvancedDrumEngine(audioPath, { outputDir })`  
  → `*_omnizart_drums_*.mid`.

- **DrummerScore:**  
  Run DrummerScore’s `main.ipynb` to get a MIDI, then:  
  `runDrummerScoreDrumEngine(midiPath, { outputDir, audioPath })`  
  → `*_drummerscore_drums_*.mid`.

---

## Merge plan (if the others don’t work well alone)

When we want all four to “talk to each other”:

1. Run all four processes on the same stem (when available: basic, Omnizart venv, ADT-lib venv, DrummerScore MIDI).
2. Each produces onset lists (time + role) per role. Normalize to a common time grid (e.g. from beat_times or fixed hop).
3. For each time slot and role, combine the four outputs: e.g. **median** time, **majority vote** or **average** for velocity, or “best of” per section (e.g. by confidence or agreement).
4. Write a single set of four MIDIs (e.g. `{stem}_merged_drums_*.mid`) with the combined result.

The exact merge logic (median vs average, how to handle missing data, sections) can be tuned once we see how ADT-lib and DrummerScore behave on your stems.
