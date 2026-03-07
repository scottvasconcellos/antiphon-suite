# Drum Engine — Plan of Attack

**Goal:** Reliable, contract-passing MIDI from arbitrary drum audio (stems or full mix) via a hybrid pipeline: deterministic core + optional learned hints + optional stem-first path.

**Success (from [GROUND_ZERO_STEMFORGE_MIDI.md](../GROUND_ZERO_STEMFORGE_MIDI.md)):** ≥35% merged real holdout pass under Contract V1; synthetic ≥90%. Stretch: higher holdout and “any drum audio” (including full mix) with stem-first.

**When you’re lost or off track:** Use the summary table below and the exit conditions to see where you are and what “done” looks like for each phase.

---

## Summary table (reference)

| Phase | What we do | Done when |
|-------|------------|-----------|
| **0** | Preconditions | Synthetic packs exist (`.internal_eval/packs/`); manifests point to real paths; single scoring contract; full gate runs; baseline % in `ITERATION_LOG.md`. |
| **1** | Hint plumbing | Engine accepts optional `BackendHintGrid`; classify uses hints for tie-break, merge for rescue; `probs_at_time(t)`; tests; gate with hints off = baseline. |
| **2** | One backend | Backend eval (score candidates on holdout); one OSS backend wired (Omnizart/OaF/ADTLib); wrapper → `BackendHintGrid`; optional engine integration; gate with hints on; KEEP only if holdout improves and synthetic ≥90%. |
| **3** | Stem-first | Demucs (maintained fork) as optional pre-step; one path: audio → Demucs → drums stem → engine → MIDI; gate passes with stem-first on. |
| **4** | Eval hardening | All families have dev/holdout manifests; single merged holdout report; promotion = merged holdout % + synthetic ≥90%; real-stem vs external clarified in docs. |
| **5** | Optional: training & baselines | ML training pipeline (if OSS underperforms); run Omnizart/ADTLib/OaF as standalone in gate for comparison. |
| **6** | Optional: LLM music brain | Post-MIDI only (tags, humanization); no impact on ADT gate. |

**Order:** 0 → 1 → 2 → 3 → 4 → (5, 6 optional).

**Promotion rule (every phase):** Merged real holdout must improve (or stay same when appropriate); synthetic must stay ≥90%; no spike in regressions. Otherwise REVERT.

---

## Key references in this repo

- **Contract and promotion:** [GROUND_ZERO_STEMFORGE_MIDI.md](../GROUND_ZERO_STEMFORGE_MIDI.md) (§2 scoring, §4 promotion, §7 backend hint).
- **Hint contract:** [.internal_eval/BACKEND_HINT_SPEC.md](../.internal_eval/BACKEND_HINT_SPEC.md); implementation `scripts/drum_engine/backend_hint.py`.
- **Tuning discipline:** [.internal_eval/TUNING_LOOP.md](../.internal_eval/TUNING_LOOP.md) (one change per iteration, full gate, KEEP/REVERT).
- **ML backend shape:** [.internal_eval/ML_BACKEND_V0_SPEC.md](../.internal_eval/ML_BACKEND_V0_SPEC.md).
- **Scoring config:** [.internal_eval/external_bench/SCORING_CONTRACT_V1.json](../.internal_eval/external_bench/SCORING_CONTRACT_V1.json).
- **Gate script:** `scripts/run_drum_engine_gate.py`.
- **Researcher refinements** (backend output mismatch, A/B gating, Demucs fork, backend eval before wiring): Cursor plan `drum_engine_competitor_research_and_hybrid_pivot` §7.

---

## One-sentence summary

Get to “clean accurate MIDI from any drum audio” by: (0) making the gate and baseline solid, (1) wiring optional BackendHintGrid into classify/merge, (2) plugging in one OSS backend and gating on holdout + synthetic, (3) adding optional stem-first for full mix, (4) locking promotion to merged holdout + synthetic, then (5–6) optionally adding training, baselines, and LLM post-MIDI.
