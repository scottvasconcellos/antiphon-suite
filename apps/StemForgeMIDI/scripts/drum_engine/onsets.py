from __future__ import annotations

from typing import Iterable

import numpy as np

from .config import EngineConfig


def _is_far_from_existing(candidates: list[float], t: float, min_sep: float) -> bool:
    return not any(abs(t - x) < min_sep for x in candidates)


def _append_candidates(
    out: list[float],
    times: Iterable[float],
    *,
    duration_sec: float,
    min_sep: float,
) -> None:
    for t in times:
        ft = float(t)
        if 0 <= ft < duration_sec - 0.01 and _is_far_from_existing(out, ft, min_sep):
            out.append(ft)


def _compute_low_rise_env(low_env: np.ndarray) -> np.ndarray:
    if low_env.size == 0:
        return low_env
    rise = np.maximum(0.0, np.diff(low_env, prepend=low_env[0]))
    if rise.size > 4:
        # Light smoothing suppresses one-frame flicker while preserving kick transients.
        rise = np.convolve(rise, np.array([0.25, 0.5, 0.25], dtype=float), mode="same")
    return rise


def _low_rise_peak_frames(low_rise_env: np.ndarray, rise_thresh: float) -> list[int]:
    if low_rise_env.size < 3:
        return []
    return [
        i
        for i in range(1, len(low_rise_env) - 1)
        if low_rise_env[i] >= rise_thresh
        and low_rise_env[i] >= low_rise_env[i - 1]
        and low_rise_env[i] >= low_rise_env[i + 1]
    ]


def detect_onset_candidates(
    y: np.ndarray,
    sr: int,
    *,
    duration_sec: float,
    bpm: float | None,
    cfg: EngineConfig,
) -> list[float]:
    onset_times, _, _low_origin = detect_onset_candidates_with_low_rise(
        y,
        sr,
        duration_sec=duration_sec,
        bpm=bpm,
        cfg=cfg,
    )
    return onset_times


def detect_onset_candidates_with_low_rise(
    y: np.ndarray,
    sr: int,
    *,
    duration_sec: float,
    bpm: float | None,
    cfg: EngineConfig,
) -> tuple[list[float], dict[float, float], set[float]]:
    """
    Return onset candidates in seconds from full, low, and mid-band streams.
    Adds guarded beat/half-beat candidates only when low-band supports them.
    Also returns:
      - per-onset normalized low-rise strength (kick-biased transient proxy)
      - low_origin_set: set of onset times (rounded to 4dp) confirmed by the
        low-band (kick-biased) detector stream.  Used by classify to gate kick
        assignment to events that actually have sub-bass / low energy support.
    """
    import librosa

    hop_length = 256
    onset_frames = librosa.onset.onset_detect(
        y=y, sr=sr, units="frames", backtrack=True, hop_length=hop_length, delta=0.01
    )
    onset_times = list(librosa.frames_to_time(onset_frames, sr=sr, hop_length=hop_length))
    onset_times = [float(t) for t in onset_times]
    low_rise_env = np.array([], dtype=float)
    low_rise_scale = 1.0
    # Accumulate raw times detected by the low-band stream (before dedup).
    _low_origin_raw: list[float] = []

    try:
        full_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop_length)
        if full_env.size > 2:
            med_full = float(np.median(full_env))
            p95_full = float(np.percentile(full_env, 95))
            full_thresh = (
                med_full + cfg.full_onset_med_p95_frac * (p95_full - med_full)
                if p95_full > med_full
                else med_full + 1e-6
            )
            maxima = (
                i
                for i in range(1, len(full_env) - 1)
                if full_env[i] >= full_thresh
                and full_env[i] >= full_env[i - 1]
                and full_env[i] >= full_env[i + 1]
            )
            full_times = librosa.frames_to_time(list(maxima), sr=sr, hop_length=hop_length)
            _append_candidates(onset_times, full_times, duration_sec=duration_sec, min_sep=0.015)
    except Exception:
        pass

    try:
        S = np.abs(librosa.stft(y, n_fft=1024, hop_length=hop_length))
        freqs = librosa.fft_frequencies(sr=sr, n_fft=1024)
        low_lo = max(0, int(cfg.low_band_lo * 1024 / sr))
        low_hi = min(len(freqs), int(cfg.low_band_hi * 1024 / sr) + 1)
        mid_lo = max(0, int(cfg.mid_band_lo * 1024 / sr))
        mid_hi = min(len(freqs), int(cfg.mid_band_hi * 1024 / sr) + 1)

        low_env = np.sqrt((S[low_lo:low_hi] ** 2).sum(axis=0)).astype(float)
        mid_env = np.sqrt((S[mid_lo:mid_hi] ** 2).sum(axis=0)).astype(float)
        low_rise_env = _compute_low_rise_env(low_env)

        low_frames = librosa.onset.onset_detect(
            onset_envelope=low_env, sr=sr, units="frames", hop_length=hop_length, delta=0.02
        )
        low_times = librosa.frames_to_time(low_frames, sr=sr, hop_length=hop_length)
        _low_origin_raw.extend(float(t) for t in low_times)
        _append_candidates(onset_times, low_times, duration_sec=duration_sec, min_sep=0.015)

        if mid_env.size > 0:
            mid_frames = librosa.onset.onset_detect(
                onset_envelope=mid_env, sr=sr, units="frames", hop_length=hop_length, delta=0.01
            )
            mid_times = librosa.frames_to_time(mid_frames, sr=sr, hop_length=hop_length)
            _append_candidates(onset_times, mid_times, duration_sec=duration_sec, min_sep=0.015)

            med_mid = float(np.median(mid_env))
            p95_mid = float(np.percentile(mid_env, 95))
            mid_thresh = med_mid + 0.08 * (p95_mid - med_mid) if p95_mid > med_mid else med_mid + 1e-6
            mid_maxima = (
                i
                for i in range(1, len(mid_env) - 1)
                if mid_env[i] >= mid_thresh
                and mid_env[i] >= mid_env[i - 1]
                and mid_env[i] >= mid_env[i + 1]
            )
            mid_max_times = librosa.frames_to_time(list(mid_maxima), sr=sr, hop_length=hop_length)
            _append_candidates(onset_times, mid_max_times, duration_sec=duration_sec, min_sep=0.02)

        med_low = float(np.median(low_env))
        p95_low = float(np.percentile(low_env, 95))
        low_thresh = (
            med_low + cfg.low_med_p95_frac * (p95_low - med_low) if p95_low > med_low else med_low + 1e-6
        )
        first_frame_thresh = (
            med_low + cfg.low_first_frame_frac * (p95_low - med_low) if p95_low > med_low else med_low + 1e-6
        )
        if low_env.size > 0 and low_env[0] >= first_frame_thresh:
            _low_origin_raw.append(0.0)
            _append_candidates(onset_times, [0.0], duration_sec=duration_sec, min_sep=0.02)

        low_maxima_frames = [
            i
            for i in range(1, len(low_env) - 1)
            if low_env[i] >= low_thresh and low_env[i] >= low_env[i - 1] and low_env[i] >= low_env[i + 1]
        ]
        low_max_times = librosa.frames_to_time(low_maxima_frames, sr=sr, hop_length=hop_length)
        _low_origin_raw.extend(float(t) for t in low_max_times)
        _append_candidates(onset_times, low_max_times, duration_sec=duration_sec, min_sep=0.02)

        if low_env.size > 1 and low_env[-1] >= low_thresh and low_env[-1] >= low_env[-2]:
            end_t = float(librosa.frames_to_time(len(low_env) - 1, sr=sr, hop_length=hop_length))
            _low_origin_raw.append(end_t)
            _append_candidates(onset_times, [end_t], duration_sec=duration_sec, min_sep=0.02)

        if low_rise_env.size > 2:
            med_rise = float(np.median(low_rise_env))
            p95_rise = float(np.percentile(low_rise_env, 95))
            rise_thresh = (
                med_rise + cfg.low_rise_med_p95_frac * (p95_rise - med_rise)
                if p95_rise > med_rise
                else med_rise + 1e-6
            )
            rise_frames = _low_rise_peak_frames(low_rise_env, rise_thresh)
            rise_times = librosa.frames_to_time(rise_frames, sr=sr, hop_length=hop_length)
            _low_origin_raw.extend(float(t) for t in rise_times)
            _append_candidates(
                onset_times,
                rise_times,
                duration_sec=duration_sec,
                min_sep=cfg.low_rise_candidate_min_sep,
            )
            low_rise_scale = max(1e-6, p95_rise)

        beat_est = None
        if bpm and bpm > 0:
            beat_est = 60.0 / bpm
        elif len(onset_times) >= 2:
            gaps = [onset_times[i + 1] - onset_times[i] for i in range(len(onset_times) - 1)]
            if gaps:
                beat_est = float(np.min(gaps))
                if beat_est > 0.5:
                    beat_est /= 2.0

        if beat_est and 0.2 < beat_est < 3.0 and low_env.size > 0:
            grid_thresh = (
                med_low + cfg.grid_med_p95_frac * (p95_low - med_low) if p95_low > med_low else med_low + 1e-6
            )
            half_grid_thresh = (
                med_low + cfg.half_grid_med_p95_frac * (p95_low - med_low)
                if p95_low > med_low
                else med_low + 1e-6
            )
            t = 0.0
            while t < duration_sec - 0.01:
                frame_idx = int(t * sr / hop_length)
                if 0 <= frame_idx < len(low_env) and low_env[frame_idx] >= grid_thresh:
                    _low_origin_raw.append(t)
                    _append_candidates(onset_times, [t], duration_sec=duration_sec, min_sep=0.025)
                t += beat_est

            t = 0.0
            while t < duration_sec - 0.01:
                frame_idx = int(t * sr / hop_length)
                if 0 <= frame_idx < len(low_env) and low_env[frame_idx] >= half_grid_thresh:
                    _low_origin_raw.append(t)
                    _append_candidates(onset_times, [t], duration_sec=duration_sec, min_sep=0.02)
                t += beat_est / 2.0
    except Exception:
        pass

    onset_times = [t for t in onset_times if 0 <= t < duration_sec - 0.01]
    onset_times.sort()
    onset_low_rise: dict[float, float] = {}
    if low_rise_env.size > 0:
        for t in onset_times:
            frame_idx = int(t * sr / hop_length)
            if 0 <= frame_idx < len(low_rise_env):
                rise_n = float(low_rise_env[frame_idx] / low_rise_scale)
            else:
                rise_n = 0.0
            onset_low_rise[round(t, 4)] = max(onset_low_rise.get(round(t, 4), 0.0), rise_n)
    else:
        onset_low_rise = {round(t, 4): 0.0 for t in onset_times}

    # Build low_origin_set: any final onset time within low_origin_tol_sec of a raw low-band detection.
    # Using cfg.low_origin_tol_sec (default 20 ms) to account for librosa frame alignment differences.
    tol = cfg.low_origin_tol_sec
    _low_raw_sorted = sorted(set(_low_origin_raw))
    low_origin_set: set[float] = set()
    for ot in onset_times:
        key = round(ot, 4)
        # Binary-search-style scan (list is sorted) — correct for typical sizes.
        for lr in _low_raw_sorted:
            if lr > ot + tol:
                break
            if abs(ot - lr) <= tol:
                low_origin_set.add(key)
                break

    return onset_times, onset_low_rise, low_origin_set
