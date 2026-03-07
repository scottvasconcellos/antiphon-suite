# Ground Zero — StemForge MIDI Drum Engine

Single source of truth for product contract, scoring, datasets, and promotion rules. Do not change this document to justify a failing run; change the engine or the data pipeline instead.

---

## 1. Product contract

- **Input**: Mono or stereo audio (WAV or equivalent), any sample rate (engine normalizes internally).
- **Output**: Four MIDI lanes: `drums_kick`, `drums_snare`, `drums_tops`, `drums_perc`. Each lane is a list of (time_sec, velocity) events; velocity in 1–127.
- **Latency**: Offline processing only for v1. Real-time is out of scope.
- **We do NOT support (v1)**:
  - Ghost notes or flams as first-class targets.
  - Cymbal type (ride vs crash vs hi-hat open/closed).
  - Detailed articulations; tops/perc are “onset + velocity” only.
- **Contract**: Mains-only, honest tops onset lane, no cymbal-type claim.

---

## 2. Scoring contract

One rubric for all external benchmark families. Stored in `.internal_eval/external_bench/SCORING_CONTRACT_V1.json` and enforced by the evaluator.

| Field | Value | Meaning |
|-------|--------|--------|
| `syncAlign` | true | Align predicted and reference before scoring. |
| `syncAlignMode` | `"affine"` | Use affine (tempo) alignment. |
| `matchSec` | 0.08 | Max time (seconds) to count a hit as matched. |
| `recallMin` | 0.90 | Minimum recall required per lane for pass. |
| `precisionMin` | 0.85 | Minimum precision required per lane for pass. |
| `minVelocityThreshold` | 40 | Only events with velocity ≥ 40 count (mains-only). |
| `enableAsymmetricPrecisionGate` | false | Do not use asymmetric precision rule. |
| `thresholdPct` | 35.0 | Overall pass threshold (%). |

**Pass**: A clip passes iff kick, snare, tops, and perc each meet recall ≥ recallMin and precision ≥ precisionMin under this config.

---

## 3. Dataset contract

- **Dev set**: Real clips used for tuning and diagnostics. You may look at results and change engine knobs/logic.
- **Blind holdout**: Real clips never used for tuning. Only this set decides promotion. Split is fixed once generated.
- **Synthetic**: Generated or controlled audio with known ground truth. Used as regression guard only; never as promotion criterion.
- **Immutable boundary**: Once a clip is assigned to dev or holdout (by manifest), it never moves. Same seed and holdout ratio for reproducibility (e.g. seed 4242, holdout ratio 0.30).
- **Families**: Each benchmark family (ENST dry, ENST wet, A2MD, STAR full, FloodSnare, MDBDrums) has its own dev/holdout manifests. The merged report aggregates holdout results across families.

Split manifests (dev/holdout clip IDs per family) live under `.internal_eval/external_bench/<family>/` and are referenced by the Ground Zero doc so the boundary is explicit and auditable.

---

## 4. Promotion rules (KEEP vs REVERT)

- **Promotion metric**: Merged real blind holdout pass rate (percentage of holdout clips that pass under Contract V1). Target: **35%** for MVP.
- **Guardrail**: Synthetic pass rate must remain **≥ 90%**. If synthetic drops below 90%, REVERT regardless of holdout.
- **KEEP** an iteration only if:
  1. Merged external real holdout pass rate **increases** vs baseline.
  2. No new regressions (e.g. no spike in regressed clip count in mainstream families).
  3. Synthetic pass rate **≥ 90%**.
- **REVERT** otherwise. Document the reason (e.g. “holdout unchanged”, “synthetic 72% &lt; 90%”) in the iteration report.

---

## 5. Family priority (for optimization order)

1. **Mainstream (optimize first)**: ENST dry, ENST wet, A2MD, STAR full.
2. **Tracked later**: FloodSnare (close-hit stress), MDBDrums (style extremes).

Promotion is still decided by the **merged** holdout metric; per-family breakdown is for diagnosis and to avoid gaming one corner (e.g. only FloodSnare improving).

---

## 6. One-sentence MVP success

**“At least 35% of real holdout clips fully pass under Contract V1, and synthetic stays ≥ 90%.”**

Every change either moves that number or gets reverted.

---

## 7. Backend hint interface (optional)

The engine may optionally consume **per-frame role probabilities** from an external backend (heuristic or learned). See:

- `.internal_eval/BACKEND_HINT_SPEC.md` — input/output and serialization.
- `scripts/drum_engine/backend_hint.py` — `BackendHintGrid` and `backend_hint_from_numpy()`.

Use is gated: any change that uses hints must improve merged holdout and keep synthetic ≥ 90%.

---

## 8. Tuning loop and ML backend

- **Tuning loop**: One change per iteration, full gate every time, KEEP/REVERT from merged holdout + synthetic. See `.internal_eval/TUNING_LOOP.md`.
- **Iteration log**: Append-only table at `.internal_eval/manual_tests/reports/ITERATION_LOG.md`.
- **ML backend v0**: Architecture and scope for a minimal learned hint model in `.internal_eval/ML_BACKEND_V0_SPEC.md`.

---

## 9. Plan of attack (when lost or off track)

Phased plan and **summary table** are in **`docs/DRUM_ENGINE_PLAN_OF_ATTACK.md`**. Use it to see current phase, exit conditions, and order: Phase 0 (preconditions) → 1 (hint plumbing) → 2 (one backend) → 3 (stem-first) → 4 (eval hardening) → 5–6 (optional training/baselines/LLM).
