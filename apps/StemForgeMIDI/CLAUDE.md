# CLAUDE.md — Onboarding notes for Claude Code

Plain-text notes to orient quickly on this project. Do not delete or strip critical sections.

---

## What this project does

StemForge MIDI drum engine: turns drum audio (stems or full mix) into four MIDI lanes — **kick**, **snare**, **tops**, **perc** — via a hybrid pipeline:

- **Deterministic core** (onsets → features → classify → merge → MIDI)
- **Optional backend hints** (per-frame role probs from an ML/heuristic backend)
- **Optional stem-first** (e.g. Demucs → drum stem → engine)

**Success** = merged real holdout ≥35% pass under Contract V1, and synthetic ≥90%. See GROUND_ZERO and the Plan of Attack for details.

---

## Single source of truth

**GROUND_ZERO_STEMFORGE_MIDI.md** — product contract, scoring contract, datasets, promotion rules.

- Do **not** edit it to justify a failing run; change the engine or the data pipeline instead.
- All evaluators and gates must use the same scoring contract (matchSec, recallMin, precisionMin, minVelocityThreshold) defined there.

---

## Table of Steps / when lost

**docs/DRUM_ENGINE_PLAN_OF_ATTACK.md** — phased plan and summary table.

Use it to see:
- Current phase (0 → 1 → 2 → 3 → 4 → 5–6 optional)
- “Done when” for each phase
- Order of work and promotion rule (merged holdout + synthetic ≥90%)

When off track, re-read the summary table and exit conditions there.

---

## Conventions

- **One change per iteration.** One structural or config change, then full gate; KEEP only if merged holdout improves (or holds) and synthetic ≥90%.
- **Full gate every time.** Run `scripts/run_drum_engine_gate.py` (synthetic + manual + real) before claiming success.
- **Scoring (Contract V1):** matchSec 0.08, recall ≥0.90, precision ≥0.85 per lane, min velocity 40 (mains-only). Stored in `.internal_eval/external_bench/SCORING_CONTRACT_V1.json`.
- **Python:** Use the app `.venv` for scripts (e.g. `.venv/bin/python3`). Engine entrypoint: `scripts/basic_drum_engine.py` — JSON on stdin, MIDI paths on stdout.
- **Tuning loop:** See `.internal_eval/TUNING_LOOP.md`. Iteration log: `.internal_eval/manual_tests/reports/ITERATION_LOG.md`.

---

## Do not touch / be careful

- **Holdout clip set is immutable** once in manifests. Do not move clips between dev and holdout to improve numbers.
- **Do not add logic that reads key MIDI paths at inference.** The engine must not receive reference MIDI; evaluation compares output to key in a separate step (blind protocol).
- **Eval scripts must use the same scoring contract** (GROUND_ZERO §2). Do not relax or change thresholds in one script without aligning the rest.
- **Do not change GROUND_ZERO** to match a failing run; fix the engine or pipeline.

---

## Key paths

- **Engine core:** `scripts/drum_engine/` — onsets, features, classify, merge, config, backend_hint.
- **Gate:** `scripts/run_drum_engine_gate.py` — runs synthetic, manual blind, real-stem evals; enforces thresholds.
- **Eval data & config:** `.internal_eval/` — packs (synthetic), manifests (manual_tests, real_stems), ledgers, BACKEND_HINT_SPEC.md, ML_BACKEND_V0_SPEC.md.
- **Backend v0:** `python-tools/ml_backend_v0.py` — train/infer backend hints (train from packs, infer to .npz); model in `python-tools/ml_backend_models/`.
- **Contract & plan:** `GROUND_ZERO_STEMFORGE_MIDI.md`, `docs/DRUM_ENGINE_PLAN_OF_ATTACK.md`.

---

## Quick start (MVP CLI)

```bash
# MIDI only
.venv/bin/python3 scripts/run_stemforge_drum.py --audio drums.wav --output ./out

# MIDI + resynthesized audio stems (kick.wav / snare.wav / tops.wav)
.venv/bin/python3 scripts/run_stemforge_drum.py --audio drums.wav --output ./out --samples ./samples

# With BPM hint
.venv/bin/python3 scripts/run_stemforge_drum.py --audio drums.wav --output ./out --bpm 120
```

Sample kit layout expected by `--samples`: one-shot WAV files named `kick*.wav`, `snare*.wav`, `tops*.wav` (or `hat*.wav`, `cymbal*.wav`). See `scripts/drum_engine/resynth.py` for full pattern matching.

---

## Current state (as of iter 028)

- **Phase 1 MVP: COMPLETE** — synthetic gate 100% (50/50) with full K/S/T scoring.
- **Phase 2:** ML backend v0 wired (neutral A/B). Need precision tuning on real stems before revisiting.
- **Phase 3:** Engine accepts drumStemPath/useDrumStem. No Demucs-in-pipeline yet.
- **Phase 4:** STAR + ENST + A2MD in manifests. Real holdout 0% — precision ~0.04–0.53 (over-detection on full-mix; needs ML or stem separation).

**Next focus:** Precision tuning in merge/classify (reduce over-firing on real full-mix stems), then merged holdout report and more dataset families.
