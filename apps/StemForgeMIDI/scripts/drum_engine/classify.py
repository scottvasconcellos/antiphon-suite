from __future__ import annotations

import math
from typing import TYPE_CHECKING, Iterable

from .config import EngineConfig
from .types import FeatureScales, OnsetFeature, ROLE_ORDER, RoleName, RolePosterior

if TYPE_CHECKING:
    from .backend_hint import BackendHintGrid


def _softmax(logits: list[float], temperature: float) -> list[float]:
    t = max(1e-6, float(temperature))
    scaled = [x / t for x in logits]
    m = max(scaled)
    exps = [math.exp(x - m) for x in scaled]
    z = sum(exps) + 1e-12
    return [e / z for e in exps]


def classify_feature(
    feature: OnsetFeature,
    scales: FeatureScales,
    cfg: EngineConfig,
    *,
    bpm: float | None,
    low_rise: float = 0.0,
    hint_grid: "BackendHintGrid | None" = None,
    low_origin: bool = True,
) -> RolePosterior:
    eps = 1e-12
    total = feature.total_band_e + eps
    sub_share = feature.sub_low_e / total
    mid_share = feature.mid_e / total
    high_share = feature.high_e / total
    sub_mid_ratio = feature.sub_low_e / (feature.mid_e + eps)
    mid_sub_ratio = feature.mid_e / (feature.sub_low_e + eps)

    centroid_n = feature.centroid / scales.max_centroid
    trans_n = feature.transient_ratio / scales.max_transient
    attack_n = feature.attack_energy / scales.max_attack

    kick_conf = min(
        1.0,
        0.5 * (sub_mid_ratio / cfg.kick_sub_mid_ratio_min)
        + 0.5 * (sub_share / cfg.kick_sub_share_min),
    )
    snare_conf = min(
        1.0,
        0.5 * (mid_share / cfg.snare_mid_share_min)
        + 0.5 * max(attack_n / cfg.snare_attack_min, trans_n / cfg.snare_transient_min),
    )
    tops_conf = min(
        1.0,
        0.6 * (high_share / cfg.tops_high_share_min) + 0.4 * centroid_n,
    )
    perc_conf = max(0.05, 1.0 - max(kick_conf, snare_conf, tops_conf))

    if sub_mid_ratio >= cfg.kick_sub_mid_ratio_min and sub_share >= cfg.kick_sub_share_min:
        chosen_role: RoleName = "drums_kick"
    elif high_share >= cfg.tops_high_share_min:
        # High-band energy check fires before snare: hi-hats and cymbals have
        # high_share >> 0.36 while snares stay below (mid-frequency dominant).
        # This prevents broad-spectrum noise bursts from triggering the snare rule.
        chosen_role = "drums_tops"
    elif mid_share >= cfg.snare_mid_share_min and (
        attack_n >= cfg.snare_attack_min or trans_n >= cfg.snare_transient_min
    ):
        chosen_role = "drums_snare"
    elif mid_sub_ratio >= cfg.snare_mid_sub_ratio_min:
        # Mid-energy clearly dominates sub-energy: route to snare before centroid-based
        # tops fallback. Catches snare onsets with low normalized transient/attack scores
        # (e.g. when max_transient scale is inflated by kick transient magnitudes).
        chosen_role = "drums_snare"
    elif centroid_n > 0.5:
        chosen_role = "drums_tops"
    else:
        # Catch-all: any onset that isn't kick or snare goes to tops (hi-hats, cymbals, perc).
        chosen_role = "drums_tops"

    # Frequency-aware per-role gating (Phase 1 A): do not assign role if band share is too weak.
    if cfg.kick_gate_min_sub_share > 0 and chosen_role == "drums_kick" and sub_share < cfg.kick_gate_min_sub_share:
        chosen_role = "drums_snare" if mid_share >= cfg.snare_mid_share_min * 0.5 else "drums_tops"
    if cfg.snare_gate_min_mid_share > 0 and chosen_role == "drums_snare" and mid_share < cfg.snare_gate_min_mid_share:
        chosen_role = "drums_kick" if sub_share >= cfg.kick_sub_share_min * 0.5 else "drums_tops"

    # Per-band origin gate: suppress kick for onsets not detected by the low-band stream.
    # Eliminates hi-hat / cymbal / snare-body onsets being mis-classified as kick.
    # When low_origin=False the onset has no confirmed sub-bass support, so kick is impossible.
    if cfg.enable_low_origin_kick_gate and not low_origin:
        if chosen_role == "drums_kick":
            # Re-assign to the next-best non-kick role by spectral evidence.
            if mid_share >= cfg.snare_mid_share_min * 0.5:
                chosen_role = "drums_snare"
            else:
                chosen_role = "drums_tops"

    kick_logit = 1.5 * kick_conf + (0.9 if chosen_role == "drums_kick" else 0.0)
    snare_logit = 1.5 * snare_conf + (0.9 if chosen_role == "drums_snare" else 0.0)
    tops_logit = 1.5 * tops_conf + (0.9 if chosen_role == "drums_tops" else 0.0)
    perc_logit = 1.5 * perc_conf + (0.9 if chosen_role == "drums_perc" else 0.0)

    # Suppress kick_logit for non-low-origin events so kick_p stays near 0.
    # This prevents the stacked-backbeat logic in merge from accidentally emitting
    # a second kick for snare / tops events that carry incidental low energy.
    if cfg.enable_low_origin_kick_gate and not low_origin:
        kick_logit = -10.0

    if bpm and bpm > 0:
        beat_est = 60.0 / bpm
        beat_idx = int(round(feature.time_sec / beat_est))
        beat_time = beat_idx * beat_est
        near_beat = abs(feature.time_sec - beat_time) <= beat_est * cfg.backbeat_hint_beat_tol_frac
        if near_beat:
            if beat_idx % 2 == 1 and mid_share >= cfg.backbeat_hint_mid_share_min:
                snare_logit += 0.8
            if beat_idx % 2 == 0 and sub_share >= cfg.kick_sub_share_min * 0.85:
                kick_logit += 0.4

    probs = _softmax([kick_logit, snare_logit, tops_logit, perc_logit], temperature=cfg.posterior_temperature)
    role_probs = dict(zip(ROLE_ORDER, probs))
    chosen_p = role_probs[chosen_role]
    runner_up_p = max(v for r, v in role_probs.items() if r != chosen_role)
    margin = chosen_p - runner_up_p

    # Tie-break: when rule margin is low and hint grid is present, use hint probs for kick vs snare.
    if hint_grid is not None and margin < cfg.hint_tiebreak_margin:
        h_kick, h_snare, _h_tops, _h_perc = hint_grid.probs_at_time(feature.time_sec)
        if h_kick >= h_snare and h_kick >= cfg.hint_rescue_min_prob:
            chosen_role = "drums_kick"
            chosen_p = role_probs["drums_kick"]
            runner_up_p = max(role_probs[r] for r in ROLE_ORDER if r != chosen_role)
            margin = chosen_p - runner_up_p
        elif h_snare > h_kick and h_snare >= cfg.hint_rescue_min_prob:
            chosen_role = "drums_snare"
            chosen_p = role_probs["drums_snare"]
            runner_up_p = max(role_probs[r] for r in ROLE_ORDER if r != chosen_role)
            margin = chosen_p - runner_up_p

    return RolePosterior(
        time_sec=feature.time_sec,
        low_e=feature.low_e,
        mid_e=feature.mid_e,
        sub_share=sub_share,
        mid_share=mid_share,
        sub_mid_ratio=sub_mid_ratio,
        kick_p=role_probs["drums_kick"],
        snare_p=role_probs["drums_snare"],
        tops_p=role_probs["drums_tops"],
        perc_p=role_probs["drums_perc"],
        chosen_role=chosen_role,
        chosen_p=chosen_p,
        runner_up_p=runner_up_p,
        margin=margin,
        low_rise=low_rise,
        low_origin=low_origin,
    )


def classify_features(
    features: Iterable[OnsetFeature],
    scales: FeatureScales,
    cfg: EngineConfig,
    *,
    bpm: float | None,
    onset_low_rise: dict[float, float] | None = None,
    hint_grid: "BackendHintGrid | None" = None,
    low_origin_set: "set[float] | None" = None,
) -> list[RolePosterior]:
    out: list[RolePosterior] = []
    low_rise_by_time = onset_low_rise or {}
    for f in features:
        low_rise = float(low_rise_by_time.get(round(float(f.time_sec), 4), 0.0))
        # low_origin=True when gate is disabled (low_origin_set is None) or time is confirmed.
        low_origin = (low_origin_set is None) or (round(float(f.time_sec), 4) in low_origin_set)
        out.append(
            classify_feature(
                f, scales, cfg, bpm=bpm, low_rise=low_rise, hint_grid=hint_grid, low_origin=low_origin
            )
        )
    return out
