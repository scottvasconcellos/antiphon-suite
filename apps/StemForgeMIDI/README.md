# StemForge MIDI — Drum Engine

Offline, deterministic drum transcription: splits drum audio into **kick / snare / tops** MIDI lanes and optionally renders clean audio stems from your own sample kit. No cloud, no ML model required for MIDI output.

## Quick start

```bash
# 1. Install dependencies (once)
python3 -m venv .venv
.venv/bin/pip install librosa pretty-midi numpy soundfile scipy

# 2. MIDI only — outputs kick.mid, snare.mid, tops.mid, perc.mid
.venv/bin/python3 scripts/run_stemforge_drum.py \
    --audio  /path/to/drums.wav \
    --output ./out

# 3. MIDI + resynthesized audio stems (kick.wav / snare.wav / tops.wav)
.venv/bin/python3 scripts/run_stemforge_drum.py \
    --audio   /path/to/drums.wav \
    --output  ./out \
    --samples /path/to/your/sample-kit/

# 4. With a BPM hint (improves grid alignment in the DAW)
.venv/bin/python3 scripts/run_stemforge_drum.py \
    --audio  /path/to/drums.wav \
    --output ./out \
    --bpm    120
```

## Sample kit layout

When using `--samples`, the directory should contain one-shot WAVs matched by name prefix:

```
samples/
  kick.wav        # or kick_hard.wav, kick_soft.wav, …
  snare.wav       # or snare_rim.wav, snare_ghost.wav, …
  tops.wav        # or hat_closed.wav, cymbal.wav, …
```

Velocity layers are auto-selected by hit intensity. See `scripts/drum_engine/resynth.py` for full matching rules.

## Output

| File | Contents |
|------|----------|
| `drums_kick.mid` | Kick drum MIDI (GM note 36) |
| `drums_snare.mid` | Snare drum MIDI (GM note 38) |
| `drums_tops.mid` | Hi-hats / cymbals MIDI (GM note 42) |
| `drums_perc.mid` | Other percussion MIDI (GM note 47) |
| `kick.wav` *(optional)* | Resynthesized kick audio stem |
| `snare.wav` *(optional)* | Resynthesized snare audio stem |
| `tops.wav` *(optional)* | Resynthesized tops audio stem |

## How it works

1. **Onset detection** — dual-band (low + full spectrum) candidate pool with low-rise energy confirmation
2. **Feature extraction** — sub/mid/high band energy shares, spectral centroid, transient sharpness, attack energy
3. **Classification** — rule-based: kick (sub-dominant) → tops (high-band dominant) → snare (mid-dominant) → catch-all tops
4. **Merge** — cluster-aware NMS, dual-event stacked backbeat inference, BPM-aware backbeat hint
5. **MIDI write** — PrettyMIDI, velocity-mapped, tempo-tagged for direct DAW import
6. **Resynth** *(optional)* — velocity-layered sample selection, soundfile render

## Development

```bash
# Run the full quality gate (synthetic + real-stem benchmarks)
.venv/bin/python3 scripts/run_drum_engine_gate.py

# Run only synthetic eval (50 packs, 100% pass = Phase 1 MVP)
.venv/bin/python3 scripts/run_internal_eval.py

# Regenerate synthetic packs
.venv/bin/python3 scripts/drum_pack_generator.py --num-packs 50 --seed 4242
```

See `CLAUDE.md` for engine internals and `docs/DRUM_ENGINE_PLAN_OF_ATTACK.md` for the phased roadmap.
