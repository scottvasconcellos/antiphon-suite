# Key/Modulation Test Metrics Report

**Date:** 2025-02-17  
**Runs:** Each test type executed twice. Results were identical across runs (deterministic).

---

## 1. Percentages (both runs)

| Test type | Run 1 | Run 2 |
|-----------|-------|-------|
| **Invariants** (pass % — must never modulate) | 7/9 **(77.8%)** | 7/9 **(77.8%)** |
| **K-suite** (pass+soft / 252) | 220/252 **(87.3%)** | 220/252 **(87.3%)** |
| **Edge-case questions** (pass+soft / 10) | 7/10 **(70.0%)** | 7/10 **(70.0%)** |

---

## 2. Academic grades (monitored metrics)

Grading scale: **A+** 97–100%, **A** 93–96, **A-** 90–92, **B+** 87–89, **B** 83–86, **B-** 80–82, **C+** 77–79, **C** 73–76, **C-** 70–72, **D** 60–69, **F** &lt;60.

### Global metrics

| Metric | Pass+soft % | Grade |
|--------|-------------|--------|
| **Invariants** (no false modulation on “never modulate” progressions) | 77.8% | **C+** |
| **K-suite (252-case stress test)** | 87.3% | **B+** |
| **Edge-case questions (10 key-detection questions)** | 70.0% | **C-** |

### K-suite by category (pass+soft %)

| Category | Pass+soft % | Grade |
|----------|-------------|--------|
| false_cadence | 100% | **A+** |
| multi_step_modulation | 100% | **A+** |
| (no category) | 90.1% | **A-** |
| ambiguous_loop | 83.3% | **B** |
| modal | 80.0% | **B-** |
| tonicization | 66.7% | **D** |
| extreme_stress | 60.0% | **D** |
| parallel_minor | 57.1% | **F** |
| key_ambiguous | 50.0% | **F** |

---

## 3. Summary

- **Invariants:** 2 failures (INV_circle_C, INV_circle_G — circle-of-fifths loops reported as modulating). **Grade: C+**
- **K-suite:** 32 hard fails, 27 soft; 220/252 pass+soft. **Grade: B+**
- **Edge-questions:** 3 fails (EQ-F211 parallel minor, EQ-F236 missed modulation, EQ-F201 false modulation). **Grade: C-**
- **Category weak spots:** key_ambiguous and parallel_minor at F; extreme_stress and tonicization at D. false_cadence and multi_step_modulation at A+.

---

*Generated from: `pnpm exec tsx tests/key-invariants.test.ts`, `tests/key-modulation-suite.test.ts`, `tests/edge-case-questions.test.ts` (each run twice).*
