# Architecture

> Describes the current shape of the system. Do not add structure that doesn't exist yet.
> Updated 2026-03-14.

---

## Monorepo Overview

```
antiphon-suite-monorepo/
├── apps/
│   ├── StemForgeMIDI/      — Drum audio → 4-lane MIDI engine (active dev)
│   └── chord-analyzer/     — Chord detection (early stage)
├── packages/
│   ├── hub/                — Antiphon Hub shell/launcher (React)
│   ├── antiphon-design-system/ — Shared design tokens + components
│   ├── midi-utils/         — Shared MIDI utilities
│   └── music-theory/       — Shared music theory helpers
├── docs/                   — Cross-app specs and ADRs
└── tasks/                  — Self-improvement log, lessons
```

Package manager: pnpm workspaces. Python apps use per-app `.venv`.

---

## StemForgeMIDI — Pipeline Architecture

### What it does
Converts drum audio (stem or full mix) into four MIDI lanes:
- `drums_kick` — bass drum (GM pitches 35, 36)
- `drums_snare` — snare (GM pitches 38, 40)
- `drums_tops` — hi-hats and cymbals (GM pitches 42–46)
- `drums_perc` — percussion (GM pitches 49–51)

### Data flow

```
Audio (.wav)
    │
    ▼
[Optional] Demucs htdemucs stem separation
    │  (--use-real-backend; separates drum stem from mix)
    ▼
Onset detection (onsets.py)
    ├── Low-band stream  (20–200 Hz) → kick candidates
    └── Full-band stream             → all candidates
    │
    ▼
[Optional] Onset suppressor (onset_suppressor.py)
    │  (--use-onset-suppressor; logistic classifier on 7 spectral features)
    │  Drops candidates with low kick_p AND low snare_p (not tops-routed)
    ▼
Feature extraction (features.py)
    │  Per-onset: sub_share, mid_share, high_share, sub_mid_ratio,
    │  attack_n, trans_n, centroid_n, low_rise, low_e, mid_e
    ▼
Classification (classify.py)   ← rule order is CRITICAL (see below)
    │  Assigns chosen_role + posteriors (kick_p, snare_p, tops_p, perc_p)
    ▼
[Optional] BackendHintGrid interpolation (backend_hint.py)
    │  (--use-backend-hints; adds per-frame ML probs for tie-break/rescue)
    ▼
[Optional] DrummerKnowledgeRescue (drummer_knowledge.py)
    │  (--use-drummer-knowledge; boosts backbeat snare, downbeat kick)
    ▼
Merge + dual-event inference (merge.py)
    │  Clusters nearby onsets; infers 1 or 2 events per cluster
    ▼
Role NMS (Non-Maximum Suppression)
    │  Kick: kick_nms_window_sec=0.120 (wider to suppress resonance tails)
    │  Other roles: role_nms_sec=0.12
    ▼
Post-NMS filters (applied in order):
    ├── _kick_reverb_snare_filter()   (--enable-kick-reverb-snare-filter)
    │    Arm A: suppress snare near kick if snare sub_share >= 0.35
    │    Arm B: suppress snare near kick if snare sub_share < kick_reverb_low_sub_max (disabled=0.0)
    ├── _kick_grid_suppressor()       (--enable-kick-grid-suppressor — NOT recommended on real stems)
    ├── _kick_sub_share_gate()        (--enable-kick-sub-share-gate)
    │    Suppress kicks with sub_share >= 0.65 AND mid_share <= 0.26
    │    (resonance tail: high sub + low mid = attack gone)
    │    ⚠ NOT propagated to synthetic eval (synth kicks are sub-only)
    └── _snare_sub_share_gate()       (--enable-snare-sub-share-gate — disabled; A2MD FPs are low-sub)
    │
    ▼
MIDI emission (basic_drum_engine.py)
    │  Velocity ≥ 40 (mains-only contract)
    ▼
Output: kick.mid, snare.mid, tops.mid, perc.mid
```

### Classify.py rule order (CRITICAL — do not reorder)

1. `sub_mid_ratio >= 2.0 AND sub_share >= 0.45` → **kick** (primary)
2. *(808 path, disabled)* — impulsive mid-heavy kicks
3. `high_share >= 0.36` → **tops** ← MUST be before snare
4. `mid_share >= 0.18 AND (attack_n >= 0.18 OR trans_n >= 0.25)` → **snare**
5. `mid_sub_ratio >= 1.05` → **snare** ← MUST be before centroid fallback
6. `centroid_n > 0.5` → **tops**
7. catch-all → **tops**

Reordering 3 and 4 causes snares to be routed as tops via centroid fallback.
Reordering 5 and 6 causes snares to be missed when max_transient is inflated.

### Entry point

```bash
# CLI
.venv/bin/python3 scripts/run_stemforge_drum.py --audio drums.wav --output ./out [--bpm 120]

# Engine (JSON stdin → MIDI paths stdout)
.venv/bin/python3 scripts/basic_drum_engine.py
```

### Full gate (run before every KEEP decision)

```bash
.venv/bin/python3 scripts/run_drum_engine_gate.py \
  --use-real-backend \
  --use-onset-suppressor \
  --enable-kick-reverb-snare-filter \
  --enable-kick-sub-share-gate
```

Gate thresholds: synthetic ≥ 90%, real holdout pass = R ≥ 0.90 AND P ≥ 0.85 per lane.
Real denominator: 7 clips (ENST_REAL_001–005, A2MD_REAL_001–002). 10 STAR clips excluded (non-GM MIDI pitches).

### Key external dependencies

| Dependency | Used by | Purpose |
|------------|---------|---------|
| librosa | onsets.py, features.py | Onset detection, spectral feature extraction |
| numpy | features.py, suppress | Spectral computation |
| pretty_midi | basic_drum_engine.py | MIDI writing |
| torch (CPU) | backend_mlv0.py | 3-role CNN inference (BackendHintGrid) |
| onnxruntime | backend_omnizart.py | Omnizart ONNX inference (ENST/E-GMD model) |
| Demucs htdemucs | stem_separator.py | Drum stem extraction (--use-real-backend) |
| scikit-learn | onset_suppressor.py | Logistic classifier for onset suppression |

---

## Antiphon Hub

React + TypeScript launcher app. Early stage. No active architectural decisions yet.
See `packages/hub/` and `docs/ANTIPHON_HUB_SPEC.md`.
