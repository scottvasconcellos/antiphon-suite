from __future__ import annotations

import numpy as np

from .config import EngineConfig
from .types import FeatureScales, OnsetFeature


def _safe_rms(x: np.ndarray) -> float:
    if x.size == 0:
        return 0.0
    return float(np.sqrt(np.mean(x ** 2)) + 1e-12)


def _p95(vals: list[float]) -> float:
    a = np.array(vals, dtype=float)
    if np.any(a > 0):
        return float(np.percentile(a[a > 0], 95))
    return 1.0


def extract_onset_features(
    y: np.ndarray,
    sr: int,
    onset_times: list[float],
    cfg: EngineConfig,
) -> list[OnsetFeature]:
    import librosa

    win_samples = int(sr * cfg.feature_win_sec)
    n_fft = min(2048, win_samples)
    if n_fft < 64:
        n_fft = 64
    hop_stft = min(512, n_fft // 2)

    features: list[OnsetFeature] = []
    for t in onset_times:
        start_sample = max(0, int((t - 0.01) * sr))
        end_sample = min(len(y), start_sample + win_samples)
        if end_sample <= start_sample:
            end_sample = min(len(y), start_sample + 1024)
        segment = y[start_sample:end_sample]
        if segment.size < 64:
            features.append(OnsetFeature(float(t), 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0))
            continue

        S = np.abs(librosa.stft(segment, n_fft=n_fft, hop_length=hop_stft))
        power = (S ** 2).mean(axis=1)

        def band_energy(lo_hz: float, hi_hz: float) -> float:
            lo_bin = max(0, int(lo_hz * n_fft / sr))
            hi_bin = min(len(power), int(hi_hz * n_fft / sr) + 1)
            return float(np.sqrt(power[lo_bin:hi_bin].sum() + 1e-12))

        sub_low_e = band_energy(cfg.sub_kick_lo, cfg.sub_kick_hi)
        low_e = band_energy(cfg.low_band_lo, cfg.low_band_hi)
        mid_e = band_energy(cfg.mid_band_lo, cfg.mid_band_hi)
        high_e = band_energy(cfg.high_band_lo, cfg.high_band_hi)
        centroid = float(librosa.feature.spectral_centroid(S=S, sr=sr).mean()) if S.size else 0.0

        t_center = int(t * sr)
        trans_w = int(cfg.transient_win_sec * sr)
        attack_w = int(cfg.attack_win_sec * sr)
        after_start = t_center
        after_end = min(len(y), t_center + trans_w)
        before_start = max(0, t_center - trans_w)
        before_end = t_center

        rms_after = _safe_rms(y[after_start:after_end])
        rms_before = _safe_rms(y[before_start:before_end])
        transient_ratio = rms_after / rms_before if rms_before > 0 else 1.0

        attack_end = min(len(y), t_center + attack_w)
        attack_energy = _safe_rms(y[after_start:attack_end])

        features.append(
            OnsetFeature(
                time_sec=float(t),
                sub_low_e=sub_low_e,
                low_e=low_e,
                mid_e=mid_e,
                high_e=high_e,
                centroid=centroid,
                transient_ratio=transient_ratio,
                attack_energy=attack_energy,
            )
        )
    return features


def compute_scales(features: list[OnsetFeature]) -> FeatureScales:
    max_low = _p95([f.low_e for f in features])
    max_mid = _p95([f.mid_e for f in features])
    max_centroid = _p95([f.centroid for f in features])
    max_transient = _p95([f.transient_ratio for f in features])
    max_attack = _p95([f.attack_energy for f in features])
    max_total = _p95([f.total_band_e for f in features])
    return FeatureScales(
        max_low=max(1.0, max_low),
        max_mid=max(1.0, max_mid),
        max_centroid=max(1.0, max_centroid),
        max_transient=max(1.0, max_transient),
        max_attack=max(1.0, max_attack),
        max_total=max(1.0, max_total),
    )


def filter_by_energy(
    features: list[OnsetFeature],
    scales: FeatureScales,
    cfg: EngineConfig,
) -> list[OnsetFeature]:
    min_total = cfg.candidate_energy_p95_frac * scales.max_total
    return [f for f in features if f.total_band_e >= min_total]
