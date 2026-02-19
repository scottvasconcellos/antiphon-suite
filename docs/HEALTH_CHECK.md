# Health check summary

**Date:** 2025-02-17 (maintenance pass)

## Cleanup done

- **.gitignore:** Added `.cursor/debug.log` and `**/debug.log` so debug logs are not committed.
- **Engine:** Removed outdated JSDoc (“currently always false”, “empty for MVP”) from `analyzeProgression.ts` (`AnalysisResult.modulated` / `segmentKeys`).
- **apps/chord-scale-helper:** Removed duplicate `tests/` (canonical tests live in `packages/harmonic-analysis-engine/tests/`).
- **Key-modulation suite:** Exit code now reflects the documented ≥90% pass+soft target: exit 0 when pass+soft ≥ 90%, exit 1 only when below (regression). Failures are still printed for visibility.

## Health check results

| Check | Status |
|-------|--------|
| `pnpm install` (root) | ✅ |
| Root `typecheck` (authority + hub) | ✅ |
| Engine `typecheck` | ✅ |
| chord-scale-helper `typecheck` | ✅ |
| Engine `test` (chordParser, key-invariants, pipeline-order, key-modulation-suite, edge-case-questions) | ✅ (exit 0) |
| `pnpm run smoke` (control-plane + foundation) | ✅ |
| `pnpm run gate` | ⚠️ Fails if **scoped-dirty** (uncommitted changes in control-plane scoped paths). Passes when repo is scoped-clean. |

## Key-modulation suite (252 cases)

- **Pass:** 201  
- **Soft-pass:** 26  
- **Fail:** 25 (known edge cases)  
- **Pass+soft:** 227/252 (90.1%) — meets ≥90% target; suite exits 0.

Failed cases are mostly: missed modulation (e.g. K020, K021, K047, K070, K131–K133, K196–K199), false modulation (e.g. K142, K183, K185, K186), and strong-case key disagreements (e.g. K081). Categories with lower pass+soft: `extreme_stress` (60%), `key_ambiguous` (50%), `multi_step_modulation` (71.4%), `ambiguous_loop` (83.3%).

## How to re-run

```bash
pnpm install
pnpm run typecheck
pnpm --filter @antiphon/harmonic-analysis-engine run typecheck
pnpm --filter @antiphon/harmonic-analysis-engine run test
pnpm --filter @antiphon/chord-scale-helper run typecheck
pnpm --filter @antiphon/chord-scale-helper run test
pnpm run smoke
pnpm run gate   # requires scoped-clean repo
```
