#!/usr/bin/env python3
"""
Generate synthetic drum packs for internal eval.

Creates .internal_eval/packs with N packs: each pack has {id}_key.json and {id}.wav.
Schema matches run_internal_eval.py: id, bpm, duration_sec, kick_times, snare_times, style.
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path

import numpy as np

SCRIPT_DIR = Path(__file__).resolve().parent
APP_ROOT = SCRIPT_DIR.parent

SR = 22050


def _synth_kick_snare(
    sr: int,
    duration_sec: float,
    kick_times: list[float],
    snare_times: list[float],
    rng: random.Random,
    tops_times: list[float] | None = None,
) -> np.ndarray:
    """Same recipe as tests/helpers.synth_kick_snare for consistency."""
    n = int(duration_sec * sr)
    t = np.arange(n, dtype=np.float32) / sr
    y = np.zeros(n, dtype=np.float32)

    kick_len = int(0.08 * sr)
    for t0 in kick_times:
        s = int(t0 * sr)
        if s < 0 or s >= n:
            continue
        e = min(n, s + kick_len)
        env = np.exp(-np.linspace(0, 10, e - s))
        y[s:e] += 0.85 * env * np.sin(2 * np.pi * 60 * t[s:e])

    snare_len = int(0.08 * sr)
    for t0 in snare_times:
        s = int(t0 * sr)
        if s < 0 or s >= n:
            continue
        e = min(n, s + snare_len)
        env = np.exp(-np.linspace(0, 10, e - s))
        # Sine-dominant snare: 200 Hz body + small noise wire.
        # Ratio 0.65 sine : 0.15 noise keeps spectral centroid ~1200 Hz (well below
        # the 4000 Hz tops_centroid_abs_hz threshold), so the classifier won't
        # mistake the snare for a hi-hat.
        noise = np.array([rng.gauss(0, 1) for _ in range(e - s)], dtype=np.float32)
        y[s:e] += 0.5 * env * (0.15 * noise + 0.65 * np.sin(2 * np.pi * 200 * t[s:e]))

    # Hi-hat / cymbal hits: short highpass noise burst, clearly high-frequency
    hihat_len = int(0.05 * sr)
    for t0 in (tops_times or []):
        s = int(t0 * sr)
        if s < 0 or s >= n:
            continue
        e = min(n, s + hihat_len)
        env = np.exp(-np.linspace(0, 20, e - s))
        noise = np.array([rng.gauss(0, 1) for _ in range(e - s)], dtype=np.float32)
        y[s:e] += 0.35 * env * noise

    ymax = np.abs(y).max()
    if ymax > 1e-6:
        y = y / ymax * 0.9
    return y


def _backbeat_pattern(bpm: float, duration_sec: float, rng: random.Random) -> tuple[list[float], list[float], list[float]]:
    """4/4 backbeat: kick on 1 and 3, snare on 2 and 4, closed hi-hat on every 8th note."""
    beat_sec = 60.0 / bpm
    kick_times: list[float] = []
    snare_times: list[float] = []
    tops_times: list[float] = []
    t = 0.0
    beat_idx = 0
    while t < duration_sec - 0.01:
        if beat_idx % 2 == 0:
            kick_times.append(t)
        else:
            snare_times.append(t)
        # Hi-hat only on the upbeat (8th-note offset) to avoid spectral contamination
        # when a hat onset and kick/snare onset share the same feature analysis window.
        half = t + beat_sec * 0.5
        if half < duration_sec - 0.01:
            tops_times.append(half)
        beat_idx += 1
        t += beat_sec
    return (kick_times, snare_times, tops_times)


def _fill_pattern(bpm: float, duration_sec: float, rng: random.Random) -> tuple[list[float], list[float], list[float]]:
    """Backbeat plus a few extra snare hits (simple fill)."""
    kick_times, snare_times, tops_times = _backbeat_pattern(bpm, duration_sec, rng)
    beat_sec = 60.0 / bpm
    # Add 2–4 extra snare hits in second half at half-beat (8th note) offsets.
    # Using half-beat positions guarantees no collision with the regular beat grid
    # (kick on even beats, snare on odd beats), so every extra hit is a unique,
    # audibly detectable onset that the engine can independently identify.
    n_extra = rng.randint(2, 4)
    start_beat = int(duration_sec / beat_sec * 0.5)
    for i in range(n_extra):
        # Use 3/4-beat offset so extra snares fall between the half-beat hat (0.5)
        # and the next downbeat (1.0). This keeps snare and hat feature windows
        # fully separate (0.25 * beat_sec apart ≥ 100ms feature window at most BPMs).
        t = (start_beat + i + 0.75) * beat_sec
        if t < duration_sec - 0.02 and t > 0.1:
            snare_times.append(t)
    snare_times.sort()
    return (kick_times, snare_times, tops_times)


def _sparse_pattern(bpm: float, duration_sec: float, rng: random.Random) -> tuple[list[float], list[float], list[float]]:
    """Fewer hits: every other bar or so. Quarter-note hi-hats."""
    beat_sec = 60.0 / bpm
    kick_times = []
    snare_times = []
    tops_times = []
    t = 0.0
    beat_idx = 0
    while t < duration_sec - 0.01:
        if beat_idx % 4 == 0:
            kick_times.append(t)
        if beat_idx % 4 == 2:
            snare_times.append(t)
        # Hi-hat on the upbeat (half-beat offset) to keep spectral features isolated.
        half = t + beat_sec * 0.5
        if half < duration_sec - 0.01:
            tops_times.append(half)
        beat_idx += 1
        t += beat_sec
    return (kick_times, snare_times, tops_times)


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate synthetic drum packs for internal eval")
    ap.add_argument(
        "--packs-dir",
        type=str,
        default="",
        help="Output directory (default: APP_ROOT/.internal_eval/packs)",
    )
    ap.add_argument("--num-packs", type=int, default=50, help="Number of packs to generate")
    ap.add_argument("--seed", type=int, default=4242, help="RNG seed for reproducibility")
    args = ap.parse_args()

    packs_dir = Path(args.packs_dir).resolve() if args.packs_dir else (APP_ROOT / ".internal_eval" / "packs").resolve()
    packs_dir.mkdir(parents=True, exist_ok=True)

    rng = random.Random(args.seed)
    pattern_fns = [
        ("backbeat", _backbeat_pattern),
        ("fill", _fill_pattern),
        ("sparse", _sparse_pattern),
    ]

    for i in range(1, args.num_packs + 1):
        pack_id = f"pack_{i:03d}"
        bpm = 90 + (i * 37) % 41  # 90–130 range, deterministic
        duration_sec = 5.0 + (i * 11) % 11  # 5–15 s
        style_name, pattern_fn = pattern_fns[i % len(pattern_fns)]
        kick_times, snare_times, tops_times = pattern_fn(bpm, duration_sec, rng)

        key = {
            "id": pack_id,
            "bpm": float(bpm),
            "duration_sec": float(duration_sec),
            "kick_times": kick_times,
            "snare_times": snare_times,
            "tops_times": tops_times,
            "style": style_name,
        }
        key_path = packs_dir / f"{pack_id}_key.json"
        with open(key_path, "w") as f:
            json.dump(key, f, indent=2)

        audio = _synth_kick_snare(SR, duration_sec, kick_times, snare_times, rng, tops_times=tops_times)
        wav_path = packs_dir / f"{pack_id}.wav"
        try:
            import scipy.io.wavfile as wavfile

            wavfile.write(str(wav_path), SR, (audio * 32767).astype(np.int16))
        except ImportError:
            import wave

            with wave.open(str(wav_path), "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(SR)
                wf.writeframes((audio * 32767).astype(np.int16).tobytes())

    print(f"Generated {args.num_packs} packs in {packs_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
