"""
Backend hint interface: optional per-frame confidence grid for the drum engine.

Consumed by onsets/classify/merge when present (e.g. for tie-breaking or
second-hit rescue). See .internal_eval/BACKEND_HINT_SPEC.md for the full spec.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class BackendHintGrid:
    """
    Per-frame role probabilities and optional onset strength.
    Shape: probs (T, 4) in order [kick, snare, tops, perc]; values in [0, 1].
    """

    times_sec: tuple[float, ...]
    probs: tuple[tuple[float, float, float, float], ...]
    onset: tuple[float, ...] | None
    sample_rate_hz: int
    hop_sec: float
    version: str = "v0.1"

    def num_frames(self) -> int:
        return len(self.times_sec)

    def probs_at(self, i: int) -> tuple[float, float, float, float]:
        """Kick, snare, tops, perc at frame index i."""
        return self.probs[i]

    def onset_at(self, i: int) -> float:
        """Onset strength at frame i; 0.0 if onset not provided."""
        if self.onset is None:
            return 0.0
        return self.onset[i] if i < len(self.onset) else 0.0

    def probs_at_time(self, t_sec: float) -> tuple[float, float, float, float]:
        """Interpolate [kick, snare, tops, perc] at time t_sec (linear between frames)."""
        if not self.times_sec:
            return (0.0, 0.0, 0.0, 0.0)
        t = float(t_sec)
        if t <= self.times_sec[0]:
            return self.probs[0]
        if t >= self.times_sec[-1]:
            return self.probs[-1]
        # Find frame index such that times_sec[i] <= t < times_sec[i+1]
        for i in range(len(self.times_sec) - 1):
            t0, t1 = self.times_sec[i], self.times_sec[i + 1]
            if t0 <= t <= t1:
                if t1 - t0 <= 1e-9:
                    return self.probs[i]
                alpha = (t - t0) / (t1 - t0)
                p0, p1 = self.probs[i], self.probs[i + 1]
                return (
                    p0[0] + alpha * (p1[0] - p0[0]),
                    p0[1] + alpha * (p1[1] - p0[1]),
                    p0[2] + alpha * (p1[2] - p0[2]),
                    p0[3] + alpha * (p1[3] - p0[3]),
                )
        return self.probs[-1]


def backend_hint_from_numpy(
    times_sec: "np.ndarray",
    probs: "np.ndarray",
    onset: "np.ndarray | None",
    sample_rate_hz: int,
    hop_sec: float,
    version: str = "v0.1",
) -> BackendHintGrid:
    """Build BackendHintGrid from numpy arrays (e.g. from npz or model output)."""
    T = len(times_sec)
    assert probs.shape == (T, 4), "probs must be (T, 4)"
    probs_t: tuple[tuple[float, float, float, float], ...] = tuple(
        (float(probs[t, 0]), float(probs[t, 1]), float(probs[t, 2]), float(probs[t, 3]))
        for t in range(T)
    )
    onset_t: tuple[float, ...] | None = None
    if onset is not None:
        assert len(onset) == T
        onset_t = tuple(float(onset[t]) for t in range(T))
    return BackendHintGrid(
        times_sec=tuple(float(t) for t in times_sec),
        probs=probs_t,
        onset=onset_t,
        sample_rate_hz=sample_rate_hz,
        hop_sec=hop_sec,
        version=version,
    )
