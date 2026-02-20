# STEM Forge Engine — Release Readiness

Checklist and constraints for treating the STEM Forge engine and model brain as **release-ready** (script/CLI level). No Tauri/UI in scope.

---

## 1. Prerequisites

| Dependency | Required | How to verify |
|------------|----------|----------------|
| **Node** (pnpm) | Yes | `node -v`, `pnpm -v` |
| **ffmpeg** | Yes | `ffmpeg -version` or `pnpm run stem-forge:health` |
| **Python 3.10+** | Yes (for audio/MIR) | `.venv/bin/python3` or `python3 --version` |
| **.venv** (Basic Pitch + pretty_midi) | Yes for pipeline | `pip install -r scripts/audio-tools-requirements.txt` |
| **.venv-mir** (Librosa) | Yes if using MIR | `pip install -r scripts/requirements-mir.txt` |
| **Ollama** | Optional (router + music LLM) | `pnpm run stem-forge:health -- --ollama` |
| **RAVE** (midi_to_clone) | Optional (clone step) | Set `RAVE_MODEL_PATH` to a `.ckpt`; use `.venv-clone` or RAVE venv |

---

## 2. Health and smoke

- **Health check:** `pnpm run stem-forge:health` — validates ffmpeg, venv, allowlist; use `--ollama` to also check Ollama.
- **Smoke test:** `pnpm run stem-forge:smoke` — runs pipeline on a minimal WAV and asserts JSON shape (no Ollama/RAVE required).

Release gate: health passes and smoke passes.

---

## 3. Full pipeline (release flow)

```bash
# Use real paths to your WAV files (e.g. ./stems/guitar.wav). --router requires: ollama pull qwen2.5-coder:7b
pnpm run stem-forge:pipeline -- --stems ./stems/guitar.wav ./stems/vocal.wav
pnpm run stem-forge:pipeline -- --stems ./stems/guitar.wav --router --clone --mir
pnpm run stem-forge:pipeline -- --stems ./stems/guitar.wav --router --music-llm
```

Pipeline phases: (1) audio→MIDI for all stems, (2) one router call with enriched stems (duration, noteCount) and registry quality hints, (3) clone (with original as ref when available) and MIR per stem. Optional `--music-llm` adds ChatMusician-style suggestions to the output.

---

## 4. Config and extensions

- **Allowlist:** `scripts/stem-forge-allowlist.json` — `cloneModels`, `routerModel`, `musicModel`. Must have at least one clone model if file exists.
- **Registry:** `scripts/stem-forge-registry.json` — updated after MIR with `quality_score` per model; router uses it to prefer better-performing models when available.
- **Optional extensions:**
  - **Essentia** — `pip install essentia` for key/tempo metrics in `mir_compare.py`.
  - **HeartMuLa** — In allowlist; wire in `midi_to_clone.py` (set `HEARTMULA_SCRIPT`) when backend is ready.
  - **Stem packages** — `@antiphon/guitar-engine`, `drum-module`, `vocal-engine`, `midi-to-audio` are consumed by apps using pipeline output and grid opts; see `STEM_ENGINES_EXPORT_OPTIONS.md`.

---

## 5. AI utilization

- **Router (Qwen):** Receives stems with duration and note count; receives allowlist and registry quality_score hints; returns one model per stem. Fully local via Ollama.
- **Music LLM (ChatMusician / fallback):** Optional `--music-llm` asks for articulations/style suggestions from stem summary. Use for RAVE style prompts or display in a future UI.
- **Graceful degradation:** Omit `--router` and `--music-llm` if Ollama is not running; pipeline still runs with default clone model.

---

## 6. Known limitations

- **No Tauri/desktop app** — Engine is script/Node only; a separate app would call the pipeline and runners.
- **RAVE** — Requires RAVE checkpoint and `rave` package; clone step fails clearly if not set up.
- **HeartMuLa** — In allowlist but not wired; router may select it; script returns clear error.
- **Stem engines (guitar/drum/vocal)** — Packages exist; pipeline does not invoke them; use grid + pipeline output from an app.

---

## 7. Release checklist (summary)

- [ ] `pnpm run stem-forge:health` passes (and `--ollama` if using router/music-llm).
- [ ] `pnpm run stem-forge:smoke` passes.
- [ ] Runbook and FOSS doc are current.
- [ ] Allowlist has at least one clone model; registry is optional.
- [ ] For clone: either RAVE env set or users expect clone to be skipped/default.

When the above hold, the STEM Forge engine and model brain are **release-ready** at the CLI/script level.
