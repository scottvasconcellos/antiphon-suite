from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class EngineConfig:
    # Bands (Hz)
    sub_kick_lo: float = 20.0
    sub_kick_hi: float = 80.0
    low_band_lo: float = 20.0
    low_band_hi: float = 200.0
    mid_band_lo: float = 200.0
    mid_band_hi: float = 2000.0
    high_band_lo: float = 2000.0
    high_band_hi: float = 12000.0

    # Onset and clustering (tuned for real stems: fewer candidates → higher precision)
    merge_sec: float = 0.04
    role_nms_sec: float = 0.12
    role_nms_beat_frac: float = 0.22
    role_nms_min_sec: float = 0.035
    low_med_p95_frac: float = 0.09
    low_first_frame_frac: float = 0.10
    grid_med_p95_frac: float = 0.20
    half_grid_med_p95_frac: float = 0.16
    full_onset_med_p95_frac: float = 0.18
    low_rise_med_p95_frac: float = 0.22
    low_rise_candidate_min_sep: float = 0.015
    candidate_energy_p95_frac: float = 0.18

    # Role scores
    kick_sub_mid_ratio_min: float = 2.0
    kick_sub_share_min: float = 0.45
    snare_mid_share_min: float = 0.18
    # Frequency-aware per-role gating (Phase 1 A): require minimum band share to assign role.
    # Set to 0.0 to disable. When > 0, kick assignment requires sub_share >= this; snare requires mid_share >= this.
    kick_gate_min_sub_share: float = 0.0
    snare_gate_min_mid_share: float = 0.0
    snare_mid_sub_ratio_min: float = 1.05
    snare_attack_min: float = 0.18
    snare_transient_min: float = 0.25
    tops_high_share_min: float = 0.36

    # Dual-event model (explicit two-hit inference; relaxed slightly for real stacked backbeats)
    dual_kick_min_p: float = 0.34
    dual_snare_min_p: float = 0.22
    # Stacked backbeat override (Phase 1 B): when cluster has strong low + strong mid, emit both kick and snare.
    # stacked_mid_min = 0.35 for kick-only clusters (room resonance mid_share is 0.10–0.25).
    # For mixed-origin clusters (confirmed kick + confirmed non-kick in same cluster), merge.py
    # applies a 0.60 multiplier → effective threshold 0.21, matching genuine simultaneous hits.
    stacked_low_min: float = 0.30
    stacked_mid_min: float = 0.35
    dual_max_sep_sec: float = 0.045
    dual_same_time_sec: float = 0.010
    dual_cluster_span_sec: float = 0.060
    close_hit_keep_min_sep: float = 0.020
    close_hit_second_vel_frac: float = 0.78
    close_hit_second_low_rise_min: float = 0.26
    close_hit_second_low_rise_conf_min: float = 0.26
    close_hit_second_low_rise_margin_min: float = 0.02
    # Snare-specific close-hit guard to reduce weak secondary overfire in
    # 20-30 ms windows while preserving strong stacked mains.
    snare_close_hit_second_vel_frac: float = 0.86
    snare_close_hit_second_conf_min: float = 0.24
    # Experimental: keep disabled in default path until it proves non-regression
    # on manual holdout.
    enable_snare_close_double_inference: bool = False
    tops_to_snare_min_p_mult: float = 1.15
    tops_to_snare_mid_share_mult: float = 1.8
    tops_to_snare_score_ratio: float = 0.80

    # Emission confidence calibration (reduce over-detection on real stems)
    enable_emit_confidence_floor: bool = False
    emit_min_kick_conf: float = 0.22
    emit_min_snare_conf: float = 0.26
    emit_min_tops_conf: float = 0.30
    emit_min_perc_conf: float = 0.28
    emit_backbeat_relax_conf: float = 0.03
    emit_kick_sub_relax_conf: float = 0.03
    emit_force_single_margin: float = 0.04
    min_velocity_threshold: int = 40

    # Asymmetric precision gate (advisory debug + optional suppression)
    enable_asymmetric_precision_gate: bool = False
    kick_precision_min_margin: float = 0.08
    snare_precision_min_margin: float = 0.06
    kick_precision_min_sub_share: float = 0.24
    snare_precision_min_mid_share: float = 0.16
    precision_gate_low_sub_margin_penalty: float = 0.03
    precision_gate_low_mid_margin_penalty: float = 0.03
    snare_precision_backbeat_relax: float = 0.02
    precision_gate_force_single_margin: float = 0.03

    # Posterior shaping
    posterior_temperature: float = 1.5
    backbeat_hint_mid_share_min: float = 0.12
    backbeat_hint_beat_tol_frac: float = 0.22

    # Per-band origin gate: only assign kick role to onsets detected by the low-band stream.
    # Eliminates hi-hat/cymbal/tom onsets being mis-classified as kick on full drum kit audio.
    # Set to False to disable (falls back to unified onset pool, old behaviour).
    enable_low_origin_kick_gate: bool = True
    # Tolerance window (seconds) for matching onset times to their band-of-origin detector.
    # 20 ms covers a ±1 librosa frame at hop=256/sr=22050 (11.6 ms per frame).
    low_origin_tol_sec: float = 0.020

    # Backend hint (optional): tie-break when rule margin is low; rescue second hit when hint prob is high.
    hint_tiebreak_margin: float = 0.15
    hint_rescue_min_prob: float = 0.40

    # Tops classification: absolute spectral centroid threshold (Hz).
    # Onsets with centroid >= this value are routed to tops before the snare rule fires,
    # preventing broad-spectrum noise bursts (hi-hats) from being mistaken for snare.
    # Hi-hats: centroid ~5000-8000 Hz; snares: centroid ~300-2000 Hz; safe boundary at 4000 Hz.
    tops_centroid_abs_hz: float = 4000.0

    # Transient gate: drop onset candidates whose raw transient_ratio (rms_after/rms_before)
    # is below this value.  Set to 0.0 to disable.
    # NOTE: This gate is DISABLED by default.  The onset detector fires slightly after the
    # actual transient peak, so the "before" window often captures the loudest part of
    # a short hit (hi-hats, light snares), yielding ratio < 1.0 for real events.
    # The grid filter (when BPM is provided) is the preferred tool for false-onset removal.
    min_onset_transient_ratio: float = 0.0

    # In classify.py: raw transient_ratio threshold that confirms a real sharp onset for the
    # snare rule, bypassing the max_transient normalization problem (avoids trans_n ≈ 0 when
    # max_transient is inflated by kick-from-silence values ~200 billion).
    snare_raw_transient_min: float = 3.0

    # Feature windows
    feature_win_sec: float = 0.10
    transient_win_sec: float = 0.02
    attack_win_sec: float = 0.005

    # DrummerKnowledgeRescue (Phase 2): top-down musical priors applied to BackendHintGrid.
    # Disabled by default; enable via useDrummerKnowledge in JSON input or --use-backend-hints gate flag.
    # Rule 1: boost snare at backbeat positions (beats 2, 4) when hint margin is low.
    # Rule 2: boost kick at downbeat positions (beats 1, 3) when model already suggests kick.
    # Rule 3: boost snare in fast-run clusters (trap rolls, funk ghost notes, hi-hat patterns).
    use_drummer_knowledge: bool = False
    dk_backbeat_tol_frac: float = 0.05   # ±5% of beat_sec treated as "at backbeat"
    dk_backbeat_max_margin: float = 0.35  # boost only when snare margin < this
    dk_backbeat_boost: float = 0.25       # additive boost to snare prob at backbeats
    dk_kick_downbeat_min_p: float = 0.20  # only boost kick if model already ≥ this
    dk_kick_downbeat_boost: float = 0.15  # additive boost to kick prob at downbeats
    dk_fast_run_window_sec: float = 0.40  # sliding window for fast-run detection
    dk_fast_run_min_hits: int = 4         # min onsets in window to trigger rule 3
    dk_fast_run_kick_max: float = 0.50    # rule 3 only fires if kick_p < this
    dk_fast_run_snare_boost: float = 0.20 # additive boost to snare prob in fast runs
