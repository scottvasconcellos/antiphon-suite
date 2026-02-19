# Key/Modulation Engine: Theories and Suspicions (Non–100% Tests)

**Date:** 2025-02-17  
**Current baseline (post-tuning):** Invariants 9/9 (100%, **A+**), K-suite 227/252 pass+soft (90.1%, **A-**), Edge-case 7/10 (70%, **C-**), Pipeline-order pass.

This document lists **theories and suspicions** for why accuracy is not optimal on the tests that are not at 100%.

---

## 1. K-suite failures (25 failed cases)

### 1.1 Missed modulation (16 cases)

**Cases:** K016, K020, K021, K034, K045, K047, K070, K072, K073, K074, K089, K131, K132, K133, K154, K165, K168, K196.

**Theories:**

- **Promotion rule too strict:** Min span (3 chords), snapback check, diatonic support, or dominant-chain collapsing may be filtering out short but genuine modulations (e.g. brief move to dominant or relative at the end).
- **Short dominant establishment:** Progressions that establish a new key with only 2–3 chords (e.g. A–D–G in G) may not meet the “minimum span” or “diatonic support” bar, so the engine keeps a single key.
- **Applied-dominant runs:** Long runs of V/x that resolve into a new key might be collapsed by dominant-chain logic, so the actual key change is never promoted.
- **Inertia/cooldown:** Key-change penalty or hysteresis may be keeping the engine in the starting key when a clear cadence in a new key appears late.
- **K034 (Db:maj start, C Db Ab Eb Bb):** First chord C is not in Db; ground truth may mean “establishment in Db” rather than a literal first-chord key; engine may infer C:min and never promote Db.

### 1.2 Wrong primary key, no modulation (6 cases)

**Cases:** K079 (C:maj vs A:min), K081 (C:maj vs G:maj), K151 (C:min vs C:maj), K155 (E:min vs E:maj).

**Theories:**

- **K079 (F C Dm G Em Am):** vi-ending rule may suppress modulation, but global key is still inferred from the full progression; ending on Am pulls inferKey toward A:min. Need to either (a) bias against “vi as global key when it appears only at the end” or (b) use an “all diatonic in one key” hint so C wins.
- **K081 (inversions in C, ends Dm–G):** Final V–I (G) gets cadence bonus; C has first-chord and prevalence bonuses but not enough to beat G. Inversions (e.g. G/B, C/E) don’t reduce the weight of G as tonic.
- **K151 / K155 (parallel minor, aeolian):** Mode is inferred from chord qualities on the tonic; when there is no minor triad on the tonic (e.g. C major triads in C minor context), Stage 5 and inferKey stay major. Need mode from scale/function (bIII, no leading tone, minor profile) or a dedicated parallel-minor/aeolian path.

### 1.3 False modulation (3 cases)

**Cases:** K183, K185, K186.

**Theories:**

- **Ambiguous / competing keys:** key_ambiguous or ambiguous_loop cases where one strong cadence (e.g. D–G) is promoted even when the piece is intentionally in the other key or bi-tonal. Need a “margin” or “competing key” check before promoting (e.g. require K2 clearly ahead of K1, or require segment length / profile support).
- **Modal/loop bias:** In modal or repeating loops, a single strong V–I may be over-weighted; the engine may need to prefer “no modulation” when both keys are strongly supported and the progression is short or repetitive.

---

## 2. Edge-case question failures (3 failed)

**Cases:** EQ-F211 (C:min vs C:maj), EQ-F236 (missed modulation), EQ-F201 (false modulation).

**Theories:**

- **EQ-F211:** Same as K151 — parallel minor; no minor triad on tonic, so engine stays major. Same direction: use bIII / flat-side profile or scale function for mode.
- **EQ-F236:** Same as “missed modulation” in K-suite — promotion or span/support rules too strict for the given progression.
- **EQ-F201:** Same as “false modulation” — competing key or ambiguous loop; one cadence promoted when ground truth is single key or the other key.

---

## 3. Summary by failure type

| Type | Count (K-suite) | Main suspicion |
|------|------------------|----------------|
| Missed modulation | 16 | Promotion/min-span/diatonic/dominant-chain too strict; inertia/cooldown |
| Wrong primary (no mod) | 6 | vi-ending vs inferKey; last-chord/cadence overweighted; parallel minor/aeolian mode not inferred |
| False modulation | 3 | Competing key / margin check missing; ambiguous or modal loops |

---

## 4. Suggested next steps (prioritized)

1. **Parallel minor / aeolian (K151, K155, EQ-F211):** Use bIII, flat-side profile, or “no leading tone” to set mode when chord-quality-on-tonic is ambiguous.
2. **K079:** Prefer global key where all chords are diatonic when progression is short and vi-ending rule has already suppressed modulation.
3. **K081:** Increase first-tonic/prevalence weight or reduce last-chord weight when the first chord root appears multiple times (inversions).
4. **Missed modulations:** Relax min span or diatonic support for “clear cadence in new key” (e.g. strong V–I at end with 2+ chords in new key), or add an “end cadence” exception.
5. **False modulations (K183, K185, K186):** Require a margin (e.g. K2 score − K1 score above threshold) or “segment length / profile support for K2” before promoting in key_ambiguous / ambiguous_loop.

---

*Generated from current engine behavior and failure lists in key-modulation-suite and edge-case-questions tests.*
