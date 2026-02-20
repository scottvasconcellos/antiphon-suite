# STEM Forge Engine — Runbook

How to run and extend the STEM Forge engine (audio→MIDI, clone, MIR, local LLM). No UI; engine and model brain only. See `FOSS_AND_LOCAL_LLM_STACK.md` for the full stack.

---

## Prerequisites

- **Node** — For all runners and pipeline (pnpm/node from repo root).
- **Python 3.10+** — For audio and MIR scripts. Use venvs per script family.
- **ffmpeg** — `brew install ffmpeg` for stem normalization.
- **Ollama** (optional) — `brew install ollama` and `ollama pull qwen2.5-coder:7b` (and optionally a music model) for router and music LLM.

---

## Venvs

| Venv | Purpose | Install |
|------|---------|---------|
| `.venv` | Audio→MIDI (Basic Pitch + pretty_midi) | `python3 -m venv .venv && source .venv/bin/activate && pip install -r scripts/audio-tools-requirements.txt` |
| `.venv-mir` | MIR compare (Librosa) | `python3 -m venv .venv-mir && source .venv-mir/bin/activate && pip install -r scripts/requirements-mir.txt` |
| `.venv-clone` | RAVE / midi_to_clone (when implemented) | Separate RAVE repo venv; point runner at it or symlink. |

Runners resolve Python in order: `.venv-clone`, `.venv-mir`, `.venv`, then `python3` on PATH.

---

## Open the STEM Forge app

From repo root:

```bash
pnpm run stem-forge:app
```

Then open **http://localhost:5174** in your browser. Upload stems, process all to MIDI, optionally enable clone/MIR/router, then download MIDI and clones. Backing vocals / lyrics section is in the UI (lyric timing from MIDI coming next).

---

## Commands (from repo root)

### 1. Normalize a stem (ffmpeg)

```bash
node scripts/ffmpeg-normalize.mjs path/to/stem.wav [out.wav] [--rate 48000] [--bits 16]
```

Output defaults to `path/to/stem_normalized.wav`. Use before Audio→MIDI if your source is not 48 kHz mono 16-bit.

### 2. Audio → MIDI (Basic Pitch)

```bash
node -e "
const { runAudioToMidi } = await import('./scripts/audio-to-midi-runner.mjs');
runAudioToMidi('./path/to/stem.wav').then(r => console.log(r)).catch(e => console.error(e.message));
"
```

Or use the pipeline (below) which calls this for each stem.

### 3. Full stem pipeline (audio→MIDI, optional router, clone, MIR)

Use **real paths** to your WAV files (not placeholders). Run from repo root.

```bash
# Replace with your own .wav paths or use a folder
pnpm run stem-forge:pipeline -- --stems ./my-stems/guitar.wav ./my-stems/vocal.wav
pnpm run stem-forge:pipeline -- --stems-dir ./my-stems

# Optional: --router needs Ollama + model (run once: ollama pull qwen2.5-coder:7b)
pnpm run stem-forge:pipeline -- --stems ./my-stems/guitar.wav --router --clone --mir
```

The pipeline runs in three phases: (1) audio→MIDI for all stems, (2) one router call with enriched stems (duration, noteCount) and registry quality hints, (3) clone and MIR per stem. Clone receives the original stem as ref when available. Use `--music-llm` to add music LLM suggestions to output. Output: JSON with `stems`, optional `router`, optional `musicSuggestions`.

### 4. MIR compare (original vs clone WAV)

Requires `.venv-mir` with librosa/soundfile. Optional: `pip install essentia` for key and tempo metrics (keyOriginal, keyClone, keyMatch, tempoOriginal, tempoClone, tempoDiff).

```bash
node -e "
const { runMirCompare } = await import('./scripts/mir-compare-runner.mjs');
runMirCompare('./original.wav', './clone.wav').then(r => console.log(r)).catch(e => console.error(e.message));
"
```

### 5. Ollama router and music LLM

```bash
node -e "
const { ollamaHealth, runRouter, runMusicLlm } = await import('./scripts/ollama-client.mjs');
const ok = await ollamaHealth();
console.log('Ollama up:', ok);
if (ok) {
  const choices = await runRouter({ stems: [{ stemId: 's0', instrument: 'guitar' }] });
  console.log('Router choices:', choices);
  const text = await runMusicLlm({ summary: 'Guitar stem, 4 bars', desiredStyle: 'clean' });
  console.log('Music LLM:', text.slice(0, 200));
}
"
```

### 6. MIDI clean (standalone)

```bash
pnpm run stem-forge:midi-clean -- path/to/file.mid
```

Or programmatically: `runMidiClean('./path/to/file.mid')` from `scripts/midi-clean-runner.mjs`.

### 7. Cut / merge stems (ffmpeg)

```bash
node -e "
const { cutStem, mergeStems } = await import('./scripts/ffmpeg-cut-merge.mjs');
cutStem('./in.wav', './out.wav', 0, 30).then(r => console.log(r));   // first 30s
mergeStems(['./a.wav','./b.wav'], './merged.wav').then(r => console.log(r));
"
```

---

## Song grid (tempo/meter)

The **song grid** is the source of truth for tempo and meter; stem engines (e.g. `@antiphon/midi-to-audio`) consume it. It lives in `packages/song-grid`:

- **From MIDI:** `parseMidiBufferToGrid(midiBuffer)` — reads tempo/meter from MIDI.
- **From user:** `songGridFromUserInput({ bpm, timeSignature: '4/4' })` — fixed tempo/meter.

The pipeline accepts optional grid hints for future stem-engine steps: `--bpm 120`, `--time-sig 4/4`, `--grid-file path/to/grid.json`. When wiring `midi-to-audio` or other stem engines, the pipeline can pass grid (from MIDI or these opts) to the engine.

**Stem engines wiring:** After the pipeline produces `midiPath` (and optionally grid from `--bpm`/`--time-sig`), you can render MIDI→WAV using `@antiphon/midi-to-audio` (see `docs/STEM_ENGINES_EXPORT_OPTIONS.md`). From Node: build or run the package (e.g. from `packages/midi-to-audio`) with a grid from `@antiphon/song-grid` (e.g. `parseMidiBufferToGrid(midiBuffer)` or `songGridFromUserInput({ bpm: gridOpts.bpm, timeSignature: gridOpts.timeSig })`). The pipeline does not invoke stem packages itself; it outputs paths and grid opts for a separate app or script to consume.

---

## Config

- **Allowlist and model names** — Edit `scripts/stem-forge-allowlist.json`. Keys: `cloneModels` (array of allowed model IDs for router), `routerModel`, `musicModel`. If the file is missing, defaults in `ollama-client.mjs` are used. Optional clone models include `heartmula` (HeartMuLa; see FOSS doc §2.4); wire in `midi_to_clone.py` when you add that backend.
- **Registry (optional)** — `scripts/stem-forge-registry.json` holds `[ { id, type, quality_score?, path? } ]`. Updated by the pipeline after MIR. If empty, allowlist is still used for routing; registry adds quality_score and path per model.

---

## What’s not in this repo

## ChatMusician / music LLM fallback

The pipeline uses **Ollama** for the music LLM (articulations, style prompts). If you don't use Ollama:

- **Skip router/music LLM:** Run the pipeline without `--router`. Clone step will use the default model from the allowlist (e.g. `basic-pitch-only`). No LLM calls.
- **Python/transformers fallback:** You can run a small HTTP server that wraps a local model (e.g. Hugging Face `transformers`) and proxy Ollama-style `/api/chat` to it. Set `OLLAMA_BASE` (or pass `baseUrl` to `runMusicLlm`) to that server. The runbook does not include a ready-made ChatMusician server; this is an optional integration.

---

## What's not in this repo

- **Tauri app** — No desktop app here; the engine is script/Node only. A Tauri (or Electron) app would call these runners.
- **RAVE render** — `midi_to_clone.py` loads the RAVE checkpoint when `RAVE_MODEL_PATH` is set: with `refAudioPath`, it encodes/decodes the reference; without ref, it generates audio from noise for the MIDI duration. Requires the `rave` package (from RAVE repo or acids-rave) and torch.
- **Chord Scale Helper / other apps** — Out of scope; this runbook is for the STEM Forge engine only.

**Health check:** `pnpm run stem-forge:health` (optional `--ollama`). **Smoke test:** `pnpm run stem-forge:smoke`. **Release checklist:** See `docs/STEM_FORGE_RELEASE_READINESS.md`.
