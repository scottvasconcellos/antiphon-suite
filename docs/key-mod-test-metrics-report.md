# Key/Modulation Test Metrics Report

**Date:** 2025-02-17  
**Runs:** Each test type executed; results deterministic.

---

## 1. Percentages (current run)

| Test type | Pass | Soft | Fail | Total | Pass+soft % |
|-----------|------|------|------|-------|-------------|
| **Invariants** (must never modulate) | 9 | 0 | 0 | 9 | **100%** |
| **K-suite** (252-case stress) | 200 | 27 | 25 | 252 | **90.1%** |
| **Edge-case questions** | 5 | 2 | 3 | 10 | **70.0%** |
| **Pipeline-order** | — | — | 0 | — | **pass** |

---

## 2. Academic grades (monitored metrics)

Grading scale: **A+** 97–100%, **A** 93–96, **A-** 90–92, **B+** 87–89, **B** 83–86, **B-** 80–82, **C+** 77–79, **C** 73–76, **C-** 70–72, **D** 60–69, **F** &lt;60.

### Global metrics

| Metric | Pass+soft % | Grade |
|--------|-------------|-------|
| **Invariants** | 100% | **A+** |
| **K-suite (252-case stress test)** | 90.1% | **A-** |
| **Edge-case questions (10 key-detection questions)** | 70.0% | **C-** |

### K-suite by category (pass+soft %)

| Category | Pass+soft % | Grade |
|----------|-------------|-------|
| false_cadence | 100% | **A+** |
| tonicization | 100% | **A+** |
| modal | 100% | **A+** |
| (no category) | 91.1% | **A** |
| extreme_stress | 90.0% | **A-** |
| ambiguous_loop | 83.3% | **B** |
| parallel_minor | 85.7% | **B** |
| multi_step_modulation | 71.4% | **C+** |
| key_ambiguous | 50.0% | **F** |

---

## 3. Summary

- **Invariants:** 9/9 pass. **Grade: A+**
- **K-suite:** 200 pass, 27 soft, 25 fail; 227/252 pass+soft. **Grade: A-**
- **Edge-questions:** 7/10 pass+soft (EQ-F236 missed modulation, EQ-F201 false modulation, EQ-F222 G:maj vs E:min). **Grade: C-**
- **Pipeline-order:** pass.
- **Category weak spots:** key_ambiguous at F; multi_step_modulation at C+.

---

## 4. Post–engine tuning (2025-02-17)

Engine changes applied from assistant recommendations:

- **Parallel minor / Aeolian:** `parallelMinorBoost` from bIII, bVI, no leading tone; guardrail: root stable (≥2 or bookended). **PARALLEL_MODE_MARGIN** so minor wins only when clearly ahead.
- **vi-ending demotion:** When one major key has all chords diatonic, progression ends on its vi, and (opens in major I/IV/V or no V–i to vi) and major has cadence → cap relative-minor score so major wins (K079).
- **First-root prevalence:** Stronger first-root repeat bonus (cap 0.18, 0.06 per repeat).
- **Modulation:** Loop-only promotion margin (segment must infer to K, min span 4, diatonic ≥3). Final-cadence min diatonic = 1.

---

*Generated from: `pnpm exec tsx tests/key-invariants.test.ts`, `tests/key-modulation-suite.test.ts`, `tests/edge-case-questions.test.ts`, `tests/pipeline-order.test.ts`.*
