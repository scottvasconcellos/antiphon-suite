# STEM Forge Engine — Gap Analysis (Why Not Usable Yet)

**Scope:** STEM Forge engine and model brain only. See `FOSS_AND_LOCAL_LLM_STACK.md` for the target stack.

---

## 1. Current state (engine release-ready at CLI level)

- **Single pipeline.** Audio→MIDI runs in isolation (script + Node runner). There is no flow that does: stems in → audio_to_midi → (optional) midi_to_clone → mir_compare → quality/registry update. Nothing orchestrates the full FOSS chain.
- **No app surface.** The stack is “Tauri/Node backend → Python → Ollama.” There is no Tauri app in this repo and no Node CLI or server that exposes “run stem pipeline” to a user. The Hub is for Layer 0 (auth/entitlements); it does not run stem processing.
- **Clone and MIR are missing.** You cannot go MIDI→clone (RAVE) or compare original vs clone (Librosa) because the scripts and runners are not implemented. So the “brain” (router LLM + music LLM) has nothing to route to except Basic Pitch.
- **Local LLM is not wired.** No Ollama client, no Qwen router, no ChatMusician. The model brain (routing + music reasoning) is unimplemented, so the app cannot decide which model to use per stem or suggest articulations/style.

**Bottom line:** Only the Audio→MIDI leg exists and is callable. Clone, MIR, and LLM layers are missing, and nothing ties them into one usable pipeline or UI.

---

## 2. What have we failed to hook up?

- **audio_to_midi.py** → Hooked up via `audio-to-midi-runner.mjs`. Not hooked into any larger pipeline (no “after this, run midi_to_clone” or “send result to router”).
- **midi_to_clone.py** → Not present. No RAVE (or HeartMuLa) script, no Node runner, no integration.
- **mir_compare.py** → Not present. No Librosa script, no Node runner, no quality_score feedback loop.
- **Ollama** → Not hooked up. No `localLlmClient` (or equivalent) that POSTs to `http://localhost:11434/api/chat` or `/api/generate`. Router and music LLM are never called.
- **Model registry / allowlist** → Documented (“allowed models per stem from registry”) but not implemented. No JSON or module that defines allowlists for the router to validate against.
- **ffmpeg** → Documented for decode/encode/resample and stem cut/merge. No script or Node code that invokes ffmpeg for stems. Stem engines (guitar, drum, vocal, midi-to-audio) are not wired to a common ffmpeg normalization step.
- **Song grid** → `@antiphon/song-grid` exists and is the documented source of truth for tempo/meter. It is not wired into the audio_to_midi or any stem pipeline in this repo (no “align to grid” step in the runners).

---

## 3. What FOSS from the plans was forgotten?

| Planned (FOSS_AND_LOCAL_LLM_STACK.md) | Status in repo |
|---------------------------------------|----------------|
| Basic Pitch + pretty_midi              | Implemented (`audio_to_midi.py`, requirements, runner) |
| midi_clean (pretty_midi only)          | Implemented (`midi_clean.py`, `midi-clean-runner.mjs`) |
| RAVE (midi_to_clone)                   | Implemented: load checkpoint, ref or duration-from-MIDI, write WAV |
| HeartMuLa (optional)                   | In allowlist; script returns clear error when selected (not wired) |
| Librosa (mir_compare)                  | Implemented (`mir_compare.py`, `requirements-mir.txt`, `mir-compare-runner.mjs`) |
| Essentia (optional)                    | Optional branch in mir_compare (key/tempo when installed) |
| ffmpeg                                | Implemented: normalize (`ffmpeg-normalize.mjs`), cut/merge (`ffmpeg-cut-merge.mjs`) |
| Ollama runtime                         | Implemented (`ollama-client.mjs`: ollamaChat, runRouter, runMusicLlm, ollamaHealth) |
| Qwen2.5-Coder (router)                 | Implemented (runRouter, allowlist validation; optional mono/poly, length, complexity per stem) |
| ChatMusician / Music GPT (music LLM)   | Implemented (runMusicLlm); runbook documents fallback and skip-if-Ollama-down |
| Registry / quality_score               | Implemented (`stem-forge-registry.json`, `quality-score.mjs`, pipeline updates after MIR) |
| Song grid in pipeline                  | Pipeline accepts `--bpm`, `--time-sig`, `--grid-file`; runbook documents stem-engine wiring |

So: **Foundation and operations are in place.** RAVE render and optional Essentia branch are implemented. See `STEM_FORGE_RELEASE_READINESS.md` for release checklist.

---

## 4. Weak links / missing music models in the local LLM (Ollama) system

- **Ollama client** — Implemented; health via `stem-forge:health --ollama`.
- **Router (Qwen)** — Implemented: Even with an Ollama client, there is no “router” step: no prompt that takes stems + allowlist and returns which model to use per stem, and no validation of the response against the allowlist.
- **Music LLM (ChatMusician) not implemented.** No path for “get articulations” or “style prompts for RAVE.” ChatMusician may not be available as a one-line `ollama pull`; the doc allows a Python/transformers fallback. That fallback is not implemented.
- **Model discovery.** The doc assumes “Ollama if a community model exists.” There is no list of recommended Ollama model names for router vs music, no health check that the expected models are loaded, and no graceful degradation (e.g. “run without LLM if Ollama unavailable”).
- **Structured output.** Router must return JSON; music LLM returns text/JSON. No parsing or schema validation is implemented, so even if we add a client, the pipeline would not reliably consume LLM output.

**Weak links in order:** (1) No Ollama client at all, (2) No router + allowlist, (3) No music LLM path, (4) No ChatMusician/Ollama model name or fallback, (5) No structured output handling.

---

## 5. What is being done to fix it (implemented)

1. **Gap doc** — This file: answers why the app is not usable, what’s not hooked up, what FOSS is missing, and where the LLM system is weak.
2. **midi_to_clone.py** — Added per contract (midiPath, refAudioPath?, modelId → clonePath). Fails with clear message until RAVE is wired. Node runner: `scripts/midi-to-clone-runner.mjs`.
3. **mir_compare.py** — Added per contract; uses Librosa. Requirements: `scripts/requirements-mir.txt`. Node runner: `scripts/mir-compare-runner.mjs`.
4. **Ollama client** — Added `scripts/ollama-client.mjs` (ollamaChat, runRouter, runMusicLlm, ollamaHealth; allowlist validation).
5. **Requirements and runners** — requirements-mir.txt; Node runners for midi_to_clone and mir_compare (same venv pattern as audio_to_midi).
6. **Allowlist** — Inline in ollama-client.mjs (STEM_CLONE_ALLOWLIST); router response validated against it.

**Also done:** Single pipeline (`run-stem-pipeline.mjs`, `pnpm run stem-forge:pipeline`), ffmpeg normalize and cut/merge (`ffmpeg-normalize.mjs`, `ffmpeg-cut-merge.mjs`), configurable allowlist and registry (`stem-forge-allowlist.json`, `stem-forge-registry.json`, `quality-score.mjs`), MIDI clean (`midi_clean.py`, `midi-clean-runner.mjs`), pipeline grid opts (`--bpm`, `--time-sig`, `--grid-file`), HeartMuLa in allowlist, RAVE env placeholder in `midi_to_clone.py`, runbook and ARC map (`docs/STEM_FORGE_RUNBOOK.md`, `docs/STEM_FORGE_ARC_MAP.md`).

**Still to do (engine only):** RAVE (or HeartMuLa) render implementation inside `midi_to_clone.py` when `RAVE_MODEL_PATH` is set; optional Essentia branch in `mir_compare.py`. Pipeline and registry are in place (e.g. “run full stem pipeline” CLI or Tauri command) Registry and pipeline are in place. UI and Tauri app remain out of scope for the engine; the goal is to make the STEM Forge engine and model brain callable and ready to use.
