# Tuning loop — one change per iteration

Per-iteration process so the merged report and iteration logs read as a story of hypotheses, not random tweaks.

## 1. Formulate one hypothesis

From diagnostics (merged failure report, per-family summaries), pick a single, testable claim. Examples:

- "Backend hints will rescue close hits without increasing hallucinations in ENST dry."
- "Using backend only for NMS second-hit rescue will improve FloodSnare without hurting A2MD."
- "Down-weighting snare in obviously kicky sub-band regions will improve precision on star_full."

## 2. Implement one small change

- One config constant, or one structural rule (e.g. one new branch in merge or classify), or one use of backend hints.
- No hidden magic numbers; add new constants to `scripts/drum_engine/config.py`.
- Add or update unit tests for the changed logic in `scripts/tests/`.

## 3. Run dev diagnostics (optional but recommended)

- Run on dev set or a subset; if results are obviously broken, rollback before blind eval.

## 4. Run full gate

- **Blind external**: All families, holdout only, with Contract V1 (affine, minVelocity 40, etc.).
- **Synthetic**: Same as current regression guard.
- Output: candidate ledgers and synthetic ledger for this iteration.

## 5. Apply KEEP/REVERT

- **KEEP** only if: merged real holdout pass rate **increases**, no new regressions in mainstream families, synthetic **≥ 90%**.
- Otherwise **REVERT** and document reason.

## 6. Append to iteration log

- Record: iteration id, hypothesis, change (files + constants), result (holdout %, synthetic %, fixed/regressed counts), decision (KEEP/REVERT).
- Log file: e.g. `.internal_eval/manual_tests/reports/ITERATION_LOG.md` or a dated report per run. This gives a narrative arc across versions.

## Rules

- One change per iteration.
- Promotion is decided only by real blind holdout; synthetic is a guardrail.
- Say "no" to changes that improve synthetic but do not improve real holdout.
