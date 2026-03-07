from __future__ import annotations

import sys
from pathlib import Path

import numpy as np


SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))


def synth_kick_snare(
    sr: int,
    duration_sec: float,
    kick_times: list[float],
    snare_times: list[float],
) -> np.ndarray:
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
    rng = np.random.default_rng(42)
    for t0 in snare_times:
        s = int(t0 * sr)
        if s < 0 or s >= n:
            continue
        e = min(n, s + snare_len)
        env = np.exp(-np.linspace(0, 10, e - s))
        y[s:e] += 0.5 * env * (
            rng.standard_normal(e - s).astype(np.float32) * 0.4
            + 0.4 * np.sin(2 * np.pi * 200 * t[s:e])
        )

    return y / (np.abs(y).max() + 1e-6) * 0.9
