# CURRENT.md — StemForgeMIDI: What's In Flight

Last updated: 2026-03-14 (iter 041)

---

## Where we are

**Synthetic gate:** 100% (50/50) — COMPLETE. Not the bottleneck.
**Real holdout:** 0/7 ENST+A2MD (10 STAR excluded). Kick precision and A2MD snare precision remain the two separate blockers.

---

## What was just done (iter 039–041)

**Iter 039 — Measurement fix** — KEPT:
- Added `eval_excluded: true` to all 10 STAR_REAL_* clips in manifest.json
- Gate denominator now 7 (ENST+A2MD only); STAR clips print `[EXCLUDED]` but still run
- Added `--dump-kick-events` and `--dump-snare-events` diagnostic flags to run_real_stem_eval.py
- Added `--enable-kick-sub-share-gate`, `--enable-snare-sub-share-gate`, `--enable-808-kick-path` flags propagated through gate → eval → engine
- Corresponding config.py fields + merge.py gates + classify.py 808 path (all disabled by default)

**Iter 040 — Kick FP diagnostic** — ZERO ENGINE RISK:
- Ran `--dump-kick-events` on all ENST clips
- **Finding:** FP kicks have HIGH sub_share (0.57–0.69) — NOT low. They are resonance re-detections 100–500ms after the true kick. TP kicks overlap at sub_share 0.47–0.68. A sub_share-floor gate does NOT work (original plan was wrong).
- Revised approach: combined resonance gate (sub_share >= HIGH AND mid_share <= LOW)

**Iter 041 — Kick resonance gate** — KEPT:
- `_kick_sub_share_gate()` redesigned: suppress kicks with `sub_share >= 0.65 AND mid_share <= 0.26`
- This targets resonance tails specifically: high sub (decaying fundamental) + low mid (attack gone)
- CRITICAL DISCOVERY: synthetic kicks are purely sub-based (low mid) — spectral gate BREAKS synthetic. Fixed by NOT propagating `--enable-kick-sub-share-gate` to synthetic eval in run_drum_engine_gate.py
- Result: ENST kick precision +0.06/+0.05/+0.02 on clips 001-003. Synthetic 100%.
- 808 kick path tested (--enable-808-kick-path): NO EFFECT on ENST_004. Root cause is onset detection failure (continuous sub-bass masks kick onsets), not classification.

**Recommended eval flags:** `--use-real-backend --use-onset-suppressor --enable-kick-reverb-snare-filter --enable-kick-sub-share-gate`

---

## Diagnosed root causes (important — do not re-diagnose)

### ENST kick FP root cause
- FP kicks are resonance tails firing 100–500ms after genuine kicks
- sub_share distribution: FP 0.37–0.69, TP 0.47–0.68 (overlap — no clean spectral separator)
- Resonance gate catches FPs with sub >= 0.65 AND mid <= 0.26; misses ~60% of FPs (sub 0.37–0.63)
- NMS widening: risky (0.165 caused recall regression on ENST_005 double kicks)
- Remaining FP elimination requires a new discriminating feature (e.g. low_rise, temporal direction)

### ENST_004 kick recall (R=0.06)
- Root cause: **onset detection failure**, not classification. Continuous sub-bass (disco/funk style) masks kick onset peaks in the low-band stream. Only 1/~17 kicks generates a detectable onset.
- Demucs stem separation (--use-real-backend): tried, neutral.
- 808 kick path (--enable-808-kick-path): tried, neutral. Confirmed: issue is pre-classify.
- Currently unsolvable without different onset detection algorithm for dense sub-bass environments.

### A2MD snare FP root cause
- FP snares have LOW sub_share (0.03–0.25) and HIGH mid_share (0.55–0.83)
- They are MID-DOMINANT OVER-DETECTIONS — guitar bleed or similar masquerading as snares
- `_snare_sub_share_gate` (ceiling gate) does NOT help — targets different failure mode (high-sub bass bleed)
- These FP snares are being emitted via dual_ok path (kick near mid-dominant event → stacked pair)
- The kick_reverb_snare_filter doesn't catch them (their sub_share < 0.35 threshold)
- Fix path: suppress near-kick snares with VERY LOW sub_share (< 0.15) that are likely bleed events

---

## Next required work

### 1. A2MD snare fix (iter 042) — highest impact if it works
- Target: A2MD_001 S P 0.25, A2MD_002 S P 0.08 → need 0.85
- Approach: add a second condition to `_kick_reverb_snare_filter`: also suppress near-kick snares with sub_share < 0.15 (extremely low sub = non-drum bleed, not a genuine simultaneous snare)
- This extends the existing filter without new infrastructure
- Risk: might suppress genuine simultaneous kick+snare at low sub_share; check ENST TP snare sub_share distribution first
- Config: `kick_reverb_min_snare_sub_check: bool = False`, `kick_reverb_low_sub_max: float = 0.12`

### 2. ENST kick FP — temporal direction gate (iter 043)
- Add `low_rise` to `--dump-kick-events` CSV output first (diagnostic, zero engine risk)
- Hypothesis: genuine kicks have high low_rise; resonance tails have low low_rise (gradual decay)
- If confirmed: post-NMS gate — after each kick event, suppress subsequent kicks within 300ms that have low_rise < threshold

### 3. ENST snare improvements (iter 044+)
- ENST_002: S P 0.82 (need 0.85) — marginal
- ENST_003: S P 0.73 (need 0.85) — moderate gap
- ENST_005: S P 0.54 (need 0.85) — large gap

---

## Real holdout per-clip snapshot (iter 041, canonical flags: --use-real-backend --use-onset-suppressor --enable-kick-reverb-snare-filter --enable-kick-sub-share-gate)

| Clip | K R | K P | S R | S P | Blocker |
|------|-----|-----|-----|-----|---------|
| ENST_REAL_001 | 0.91 | 0.48 | 1.00 | 0.83 | kick P (need +0.37) |
| ENST_REAL_002 | 0.77 | 0.53 | 0.90 | 0.82 | kick P, snare P borderline |
| ENST_REAL_003 | 0.83 | 0.60 | 0.77 | 0.74 | kick P, snare R+P |
| ENST_REAL_004 | 0.06 | 1.00 | 0.89 | 0.64 | kick R=0.06 (onset detection failure) |
| ENST_REAL_005 | 0.87 | 0.79 | 0.52 | 0.54 | kick P +0.06, snare large gap |
| A2MD_REAL_001 | 0.88 | 0.62 | 1.00 | 0.25 | snare P crater |
| A2MD_REAL_002 | 0.76 | 0.51 | 0.95 | 0.08 | snare P crater, kick P |

Target: R ≥ 0.90, P ≥ 0.85 per lane. 10 STAR clips excluded (eval mismatch, non-GM MIDI pitches).

---

## Promotion rule (do not change)

KEEP a change only if: real holdout improves (or holds) **and** synthetic ≥ 90%.
One change per iteration. Full gate every time.
