# STEM Forge Engine — Status Report

**Scope:** This agent works only on the STEM Forge engine. It does not touch Chord Scale Helper, Chord Scale Pro, or any other app.

**Note:** The STEM Forge engine codebase (audio-processor, batchProcessor, run_batch, RAVE, etc.) lives in a **separate repo/workspace** from this one (antiphon-suite-monorepo). Open that workspace to continue engine work. The summary below is from prior work on that codebase.

---

## What’s been done so far

- **ARC 1 — Audio → MIDI:** Python 3.10 venv, Basic Pitch runnable, optional integration test; task % and docs updated.
- **ARC 2 — Song detail & batch:** Song detail/global structure engine; batch processing with worker threads; analysis → user choices (types, resolve, merge); UI pipeline and per-stem choices.
- **ARC 3 — Clone path:** Python script + Node `cloneMIDIToAudio`; Tauri command for real batch run + run-batch script; file picker for stems; MIR compare (Librosa) for model `quality_score`.
- **ChatMusician / music LLM:** Routing, “Get articulations” in UI, RAVE inference in `midi_to_clone.py`, user override for music LLM in per-stem choices; MIR compare wired in; quality score and clone path in UI; “Run clone & quality only” button + Tauri command; registry `quality_score` update; `registryPath` in app config; clone progress (script stderr + Tauri emit); batch progress (stderr emit to frontend); minimal settings UI (registry path, etc.); settings: `modelsDirectory`, `deviceProfile`; export project (project.json) from pipeline state.
- **Tests & quality:** 90%+ coverage bar (vitest), TESTING.md, hardened tests (batch error paths, stem-choice edge cases, coverage exclusions for spawn wrappers); stemChoices test fix (user override musicLLM empty string → reflected in plan).

---

## Where we are (by area)

| Area | Status | % (approx) |
|------|--------|-------------|
| Audio → MIDI (Basic Pitch) | Done: script, Node spawn, integration test | **100%** |
| Song detail / global structure | Done: computeSongDetail, tests | **100%** |
| Batch processor | Done: worker threads, error paths, tests | **100%** |
| Stem choices / routing / merge | Done: resolveStemPlans, user overrides, midi_only, tests | **100%** |
| MIDI → clone (RAVE) | Done: midi_to_clone.py, Node spawn, progress emit | **100%** |
| MIR compare (quality_score) | Done: Librosa script, wired into pipeline | **100%** |
| Music LLM (ChatMusician) | Done: routing, articulations, UI, overrides | **100%** |
| Registry operations | Done: quality_score update, registryPath in config | **100%** |
| Settings UI | Done: registry path, modelsDirectory, deviceProfile | **100%** |
| Run-batch / clone-only | Done: Tauri commands, resolvedPlans, UI | **100%** |
| Export project | Done: project.json from pipeline state | **100%** |
| Test suite & docs | Done: 90%+ coverage, TESTING.md, exclusions | **100%** |

**Overall engine (features in scope):** ~**100%** of the planned arcs and items above are implemented and tested.

---

## What’s left to do (optional / next)

- **Polish & robustness:** More edge-case tests, error messaging, logging.
- **Performance:** Larger batches, caching, or tuning if needed.
- **New features:** Any new pipeline steps or integrations you define (e.g. more MIR metrics, extra LLM flows, or export formats).
- **Docs:** Keep PROGRESS.md and user-facing docs in sync with behavior.

No major arcs are left from the original plan; remaining work is incremental and depends on your priorities.

---

## Percentages summary

- **Done (implemented + tested):** ~**100%** of the STEM Forge engine scope described above.
- **Remaining (optional/next):** 0% required; any further work is additive (polish, performance, new features, docs).

To continue working on the engine, open the **STEM Forge engine** workspace (the repo that contains `packages/audio-processor`, `batchProcessor`, `stemChoices`, `run_batch`, Python scripts, Tauri app, etc.) and ask for the next task there.
