# FOSS and Local LLM Stack (Canonical Reference)

This document is the **authoritative spec** for FOSS tools, local LLMs, and stem-engine wiring in this Mac-only, Apple Silicon context. All AI must be local and FOSS; no cloud LLMs or proprietary APIs.

**Install path preference:** Homebrew/CLI → GitHub → dmg as last resort.

---

## 1. Role & context

- **Platform:** Mac-only, Apple Silicon.
- **ARC order:** **FOUNDATION → OPERATIONS → STEM ENGINES.** Foundation ~95%, Operations ~90%, Stem engines ~40%. New stem work can reuse or clone the harmonic engine from Antiphon; conceptually the stem app can be separate.
- **AI mandate:** All AI must be local and FOSS. No cloud LLMs.
- **Orchestration:** Tauri/Node backend → Python subprocesses (audio/MIDI/MIR) → Ollama HTTP (local LLMs) → `ffmpeg` CLI (encode/decode).

---

## 2. FOSS tools: names, URLs, install, integration

### 2.1 Audio → MIDI: Basic Pitch

- **Name:** Basic Pitch (Spotify)
- **URL:** https://github.com/spotify/basic-pitch
- **Role:** Audio → MIDI with pitch bends and polyphony (guitar, voice, keys).
- **Install (Python, macOS, Apple Silicon):**
  - Python 3.10 (e.g. via `pyenv` or system).
  - Create a venv: `python3 -m venv .venv`, `source .venv/bin/activate`.
  - `pip install basic-pitch`
- **Integration:** Node/Tauri backend spawns a Python script (e.g. `scripts/audio_to_midi.py`) that accepts a WAV/AIFF path, calls Basic Pitch to produce a `.mid`, and returns MIDI path + JSON metadata (note count, range, duration) via stdout.

### 2.2 MIDI processing: pretty-midi

- **Name:** pretty-midi
- **URL:** https://pypi.org/project/pretty-midi
- **Role:** Clean/quantize/humanize MIDI output from Basic Pitch.
- **Install:** Same venv as Basic Pitch: `pip install pretty-midi`.
- **Integration:** After Basic Pitch, `audio_to_midi.py` (or `midi_clean.py`) uses pretty-midi to remove micro-notes, lightly quantize (respecting bends), and humanize velocities. Script returns cleaned MIDI path + stats to Node.

### 2.3 Neural synthesis / cloning: RAVE

- **Name:** RAVE (Realtime Audio Variational autoEncoder)
- **URL:** https://github.com/acids-ircam/RAVE
- **Role:** High-quality real-time neural audio synthesis; main FOSS instrument clone engine (e.g. emo guitar).
- **Install (Python, separate venv recommended):**
  - `git clone https://github.com/acids-ircam/RAVE.git`
  - `cd RAVE && python3 -m venv .venv && source .venv/bin/activate`
  - `pip install -r requirements.txt`
- **Integration:** Script `midi_to_clone.py`: inputs MIDI path, optional reference WAV, model ID (e.g. `rave-guitar`); loads RAVE model; renders clone WAV; outputs clone path. Node calls it with model ID chosen by the router LLM.

### 2.4 Optional neural generator: HeartMuLa / HeartLib

- **Name:** HeartMuLa / HeartLib
- **Info:** Open-source Suno-like local AI music generator.
- **Links:** Intro (e.g. sonusahani.com/blogs/heartmula-local-ai-music-generator); community/GitHub via Reddit r/HeartMula.
- **Role:** Optional FOSS alternative for style-heavy or full-section regeneration.
- **Install:** Follow GitHub README (venv + `pip install -r requirements.txt`).
- **Integration:** Optional model in registry (`type: "midi_to_audio_clone"` or similar). `midi_to_clone.py` can route to HeartMuLa when the router LLM selects it (within deterministic allowlist).

### 2.5 MIR / evaluation: Librosa & Essentia

- **Librosa**
  - **URL:** https://librosa.org
  - **Role:** MIR for audio analysis (spectral centroid, tempo, onset, similarity).
  - **Install:** `pip install librosa`
  - **Integration:** `mir_compare.py`: inputs original WAV, clone WAV; uses Librosa for metrics (e.g. spectral centroid difference, RMS); returns JSON metrics to Node for updating model `quality_score`.

- **Essentia (optional)**
  - **URL:** https://essentia.upf.edu
  - **Role:** Advanced MIR (key/tempo etc.) if needed.
  - **Install:** Follow Essentia macOS install (`pip install essentia` or prebuilt wheels).
  - **Integration:** Same `mir_compare.py` or separate script for advanced metrics.

### 2.6 Infra: ffmpeg

- **Name:** ffmpeg
- **URL:** https://ffmpeg.org
- **Role:** Decode/encode/resample audio; ensure uniform formats.
- **Install:** `brew install ffmpeg`
- **Integration:** Node backend spawns `ffmpeg` for converting stems to 48 kHz, 16/24-bit WAV and for cutting/merging stems as needed. **Implemented:** `scripts/ffmpeg-normalize.mjs` (normalize to 48 kHz mono 16-bit WAV); `pnpm run stem-forge:normalize -- <input> [output]`.

---

## 3. Local LLM stack (FOSS only)

### 3.1 Runtime: Ollama

- **Name:** Ollama
- **URL:** https://ollama.com (runtime only)
- **Role:** Local runner for all LLMs (router and music models) on Apple Silicon.
- **Install:** `brew install ollama` (dmg from website as last resort).
- **Integration:** App talks to Ollama via HTTP: `http://localhost:11434/api/chat` or `/api/generate`. Node: `scripts/ollama-client.mjs` (ollamaChat, runRouter, runMusicLlm, ollamaHealth).

### 3.2 Router LLM: Qwen2.5-Coder-7B

- **Name:** Qwen2.5-Coder-7B (or closest Qwen coder variant)
- **Source:** Open-source on Hugging Face; run via Ollama.
- **Install:** `ollama pull qwen2.5-coder:7b`
- **Role:** Routing/orchestration only. Decides which FOSS model(s) to use per stem/task (e.g. `rave-guitar` vs `basic-pitch-only`) from a deterministic allowlist provided by Node. Returns structured JSON only; no side effects. Also handles non-musical reasoning (processing strategies, settings, explanations).
- **Integration:** Node builds JSON (stems: instrument, mono/poly, length, complexity; allowed models per stem from registry). Node POSTs to Ollama (Qwen) with this JSON and a routing prompt. Qwen returns JSON (e.g. `{ stemId, audioToMidi, clone }`). Node validates: if chosen model not in allowlist → ignore and fall back to default.

### 3.3 Music LLM: ChatMusician / MusicGPT-7B

- **Name:** ChatMusician (or MusicGPT equivalent)
- **GitHub:** https://github.com/hf-lin/ChatMusician | **HF:** https://huggingface.co/m-a-p/ChatMusician
- **Role:** Music-specific expert only (not a router). Suggests articulations (slides, hammer-ons, accents), style prompts for RAVE/HeartMuLa (e.g. “Midwest emo, bright, wide vibrato”), harmony voicings if asked. Never decides *which* FOSS engine to use; only *how* to use it.
- **Install:** Prefer Ollama if a community model exists (`ollama pull chatmusician:7b` or similar). Else: Python/transformers in a separate venv with Metal backend.
- **Integration:** Node calls ChatMusician via Ollama (preferred) or a local HTTP server around a Python transformers script. Used only when the pipeline needs musical reasoning, not for every stem.

---

## 4. Orchestration contracts

### 4.1 Python script contracts

- **`scripts/audio_to_midi.py`**
  - In: JSON `{ audioPath }` (optional: `outputPath` for MIDI output path).
  - Steps: Basic Pitch → pretty-midi (light clean: drop micro-notes, preserve bends).
  - Out: JSON `{ midiPath, noteCount, pitchRange, duration }`. On error: JSON `{ error }` on stderr, exit 1.
  - **Local setup:** From the **repo root** (e.g. `cd /path/to/antiphon-suite-monorepo`), then: `python3 -m venv .venv && source .venv/bin/activate && pip install -r scripts/audio-tools-requirements.txt`. Node runner uses `.venv/bin/python3` if present. **Pressure test:** `pnpm run test:audio-to-midi` (no venv required for validation tests; full pipeline needs Basic Pitch installed).

- **`scripts/midi_clean.py`** (can be merged into `audio_to_midi`)
  - In: `{ midiPath }`.
  - Out: `{ cleanedMidiPath, stats }`.

- **`scripts/midi_to_clone.py`**
  - In: `{ midiPath, refAudioPath?, modelId }` (modelId from registry, e.g. `rave-guitar`).
  - Steps: Load RAVE (or HeartMuLa) and render clone.
  - Out: `{ clonePath }`. **Implemented:** Script exists; fails with clear error until RAVE is installed. Node runner: `scripts/midi-to-clone-runner.mjs`.

- **`scripts/mir_compare.py`**
  - In: `{ originalPath, clonePath }`.
  - Steps: Librosa; compute metrics (spectral centroid diff, loudness diff).
  - Out: `{ metrics: { spectralCentroidDiff, loudnessDiff } }`. **Implemented:** Script + `scripts/requirements-mir.txt`. Node runner: `scripts/mir-compare-runner.mjs`.

Node backend spawns these scripts with the venv activated (or via a wrapper).

### 4.2 LLM orchestration via Ollama

- **Router (Qwen):** `POST http://localhost:11434/api/chat`. System prompt: router; must output JSON only. User content: JSON describing stems + allowed models per stem. Response: JSON mapping stem IDs to chosen model IDs and optional settings. Node validates chosen models against allowlists.
- **Music reasoning (ChatMusician):** Same endpoint; input = theory summary, MIDI snippet, desired style; output = text and/or JSON for articulations and style prompts. All local; no external calls.

---

## 5. ARC & implementation order (after this doc is in place)

1. Implement **`audio_to_midi`** using Basic Pitch + pretty-midi.
2. Add **Ollama + Qwen routing** (allowlist → Qwen → validated JSON).
3. Implement **`midi_to_clone`** using RAVE for at least one instrument.
4. Implement **`mir_compare`** with Librosa to update FOSS model `quality_score`.
5. Add **ChatMusician** for articulations/prompts once the above is stable.

**Runbook:** See `docs/STEM_FORGE_RUNBOOK.md` for commands (pipeline, normalize, router, MIR) and venv setup.

Keep this doc up to date so the codebase and future work “understand, connect, and fully utilize” each FOSS tool and local LLM in the pipeline.
