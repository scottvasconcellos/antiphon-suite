# Phase 1 Quick Win — Iteration Report (A + B)

**Plan:** Drum Engine Quick Win, Roadmap, and LLM Evaluation  
**Date:** 2025-02-19  
**Scope:** Frequency-aware per-role gating (A) + stronger stacked-backbeat handling (B). Rules-only; one iteration, then gate.

---

## 1. Code changes (exact)

### Config (`scripts/drum_engine/config.py`)

- **Frequency gate (A):** Added `kick_gate_min_sub_share: float = 0.0`, `snare_gate_min_mid_share: float = 0.0`. When > 0, kick assignment requires `sub_share >= kick_gate_min_sub_share`; snare requires `mid_share >= snare_gate_min_mid_share`. Default 0 = disabled.
- **Stacked backbeat (B):** Added `stacked_low_min: float = 0.30`, `stacked_mid_min: float = 0.18`. In merge, when a cluster has strong low + strong mid in a short window, dual emit (kick + snare) is forced even if the normal dual path would not trigger.

### Classify (`scripts/drum_engine/classify.py`)

- **Frequency gate (A):** After initial `chosen_role` assignment, if `kick_gate_min_sub_share > 0` and `chosen_role == "drums_kick"` and `sub_share < kick_gate_min_sub_share`, demote to snare (if mid_share sufficient) or tops or perc. If `snare_gate_min_mid_share > 0` and `chosen_role == "drums_snare"` and `mid_share < snare_gate_min_mid_share`, demote to kick or tops or perc.

### Merge (`scripts/drum_engine/merge.py`)

- **Stacked backbeat (B):** After computing `dual_ok`, if `not dual_ok` and cluster span ≤ `dual_cluster_span_sec` and `max_sub_share >= stacked_low_min` and `max_mid_share >= stacked_mid_min`, set `dual_ok = True` (stacked backbeat override) and emit both kick and snare.

### Tests

- **`scripts/tests/test_classify.py`:** `test_frequency_gate_demotes_kick_when_sub_share_below_gate`, `test_frequency_gate_demotes_snare_when_mid_share_below_gate`.
- **`scripts/tests/test_merge.py`:** `test_stacked_backbeat_override_emits_both_kick_and_snare`.

---

## 2. Gate run (Phase 1.3)

To complete the iteration gate:

1. **Prerequisites:** Synthetic drum packs in `.internal_eval/packs` (run `drum_pack_generator.py` if needed). Dev/holdout manifests and key MIDI for blind manual eval.
2. **Run:**
   - Dev: blind dev eval → e.g. `dev_iter_023.json`.
   - Holdout: blind holdout eval → e.g. `holdout_iter_023.json`.
   - Synthetic: `run_internal_eval.py` → ledger (e.g. `gate_synthetic_ledger.json` or iteration-specific).
   - Progress: `analyze_drum_eval_progress.py` holdout vs baseline (e.g. iter_022).
3. **Decision:** **KEEP** only if: holdout pass rate improves, no new holdout regressions, synthetic ≥ 90%. Otherwise **REVERT** and document why.

**Gate run in this environment:** Not executed — synthetic packs and/or holdout run manifests are not present. When available, run:

```bash
cd apps/StemForgeMIDI
python3 scripts/run_drum_engine_gate.py --synthetic-threshold 90
```

Then run blind manual eval for dev/holdout and `analyze_drum_eval_progress.py` with the new ledgers vs baseline.

---

## 3. Placeholder results (fill after gate run)

| Metric            | Before (baseline) | After (Phase 1) | Delta   |
|-------------------|-------------------|-----------------|--------|
| Dev pass rate %   | —                 | —               | —      |
| Holdout pass rate % | 4.28            | —               | —      |
| Synthetic pass rate % | 92             | —               | —      |
| Fixed clips       | —                 | —               | —      |
| Regressed clips   | —                 | —               | —      |
| **Decision**      | —                 | **PENDING**     | KEEP/REVERT after gate |

---

## 4. Summary

- **(A)** Frequency-aware gating is implemented and tested; defaults are 0 (off) so behavior is unchanged until tuned.
- **(B)** Stacked backbeat override is implemented and tested; dual emit when cluster has strong low + strong mid in a short window.
- **Phase 1.3 gate:** Run when synthetic packs and dev/holdout manifests exist; then update this report and ITERATION_LOG with actual numbers and KEEP/REVERT.

All engine changes live under `scripts/drum_engine/`. Promotion by real holdout only; synthetic ≥ 90% guardrail.
