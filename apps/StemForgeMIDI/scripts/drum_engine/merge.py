from __future__ import annotations

from collections import defaultdict
from statistics import median
from typing import TYPE_CHECKING, Any

from .config import EngineConfig
from .types import EmittedEvent, FeatureScales, ROLE_ORDER, RoleName, RolePosterior

if TYPE_CHECKING:
    from .backend_hint import BackendHintGrid


def _event_velocity(role: RoleName, low_e: float, mid_e: float, scales: FeatureScales) -> int:
    # Mains-only contract: emitted events must have velocity >= min_velocity_threshold (40).
    if role == "drums_kick":
        e = max(0.0, min(1.0, low_e / (scales.max_low + 1e-12)))
        v = int(40 + 87 * e)
    elif role == "drums_snare":
        e = max(0.0, min(1.0, mid_e / (scales.max_mid + 1e-12)))
        v = int(40 + 87 * e)
    else:
        e = max(0.0, min(1.0, (low_e / (scales.max_low + 1e-12) + mid_e / (scales.max_mid + 1e-12)) / 2))
        v = int(40 + 87 * e)
    return max(40, min(127, v))


def _cluster_posteriors(posteriors: list[RolePosterior], merge_sec: float) -> list[list[RolePosterior]]:
    if not posteriors:
        return []
    s = sorted(posteriors, key=lambda p: p.time_sec)
    out: list[list[RolePosterior]] = [[s[0]]]
    for p in s[1:]:
        if p.time_sec - out[-1][-1].time_sec < merge_sec:
            out[-1].append(p)
        else:
            out.append([p])
    return out


def _role_prob(p: RolePosterior, role: RoleName) -> float:
    if role == "drums_kick":
        return p.kick_p
    if role == "drums_snare":
        return p.snare_p
    if role == "drums_tops":
        return p.tops_p
    return p.perc_p


def _role_margin(p: RolePosterior, role: RoleName) -> float:
    target = _role_prob(p, role)
    others = [
        p.kick_p if role != "drums_kick" else -1.0,
        p.snare_p if role != "drums_snare" else -1.0,
        p.tops_p if role != "drums_tops" else -1.0,
        p.perc_p if role != "drums_perc" else -1.0,
    ]
    return target - max(others)


def _infer_dual_from_cluster(
    cluster: list[RolePosterior],
    cfg: EngineConfig,
    scales: FeatureScales,
    bpm: float | None,
    cluster_diag: dict[str, Any] | None = None,
) -> list[EmittedEvent]:
    """
    Explicit two-hit inference: estimate best kick and snare candidates independently
    inside the close-time cluster, then emit one or two events.
    """
    if not cluster:
        return []

    best_kick = max(cluster, key=lambda p: p.kick_p)
    roles_present = {p.chosen_role for p in cluster}
    has_kick_vote = "drums_kick" in roles_present
    has_snare_vote = "drums_snare" in roles_present
    has_snare_like_vote = has_snare_vote or any(
        p.chosen_role == "drums_tops" and p.snare_p >= cfg.dual_snare_min_p for p in cluster
    )
    max_kick_p = max(p.kick_p for p in cluster)
    max_snare_p = max(p.snare_p for p in cluster)
    max_sub_mid_ratio = max(p.sub_mid_ratio for p in cluster)
    max_sub_share = max(p.sub_share for p in cluster)
    max_mid_share = max(p.mid_share for p in cluster)
    mid_to_sub_share = max_mid_share / (max_sub_share + 1e-12)
    max_tops_p = max(p.tops_p for p in cluster)
    max_perc_p = max(p.perc_p for p in cluster)

    if cluster_diag is not None:
        cluster_diag["cluster_start_sec"] = round(min(p.time_sec for p in cluster), 6)
        cluster_diag["cluster_end_sec"] = round(max(p.time_sec for p in cluster), 6)
        cluster_diag["cluster_span_sec"] = round(max(p.time_sec for p in cluster) - min(p.time_sec for p in cluster), 6)
        cluster_diag["posteriors"] = [
            {
                "time_sec": round(p.time_sec, 6),
                "chosen_role": p.chosen_role,
                "chosen_p": round(p.chosen_p, 6),
                "runner_up_p": round(p.runner_up_p, 6),
                "margin": round(p.margin, 6),
                "kick_p": round(p.kick_p, 6),
                "snare_p": round(p.snare_p, 6),
                "tops_p": round(p.tops_p, 6),
                "perc_p": round(p.perc_p, 6),
                "sub_share": round(p.sub_share, 6),
                "mid_share": round(p.mid_share, 6),
                "sub_mid_ratio": round(p.sub_mid_ratio, 6),
            }
            for p in sorted(cluster, key=lambda x: x.time_sec)
        ]
        cluster_diag["drops"] = []
        cluster_diag["notes"] = []

    t_med = float(median([p.time_sec for p in cluster]))
    snare_positional_hint = False
    if bpm and bpm > 0:
        beat_est = 60.0 / bpm
        if beat_est > 1e-9:
            beat_idx = int(round(t_med / beat_est))
            beat_time = beat_idx * beat_est
            near_beat = abs(t_med - beat_time) <= beat_est * cfg.backbeat_hint_beat_tol_frac
            if beat_idx % 2 == 1 and near_beat and max_mid_share >= cfg.backbeat_hint_mid_share_min:
                snare_positional_hint = True

    def min_conf_for_role(role: RoleName) -> float:
        if role == "drums_kick":
            relax = cfg.emit_kick_sub_relax_conf if max_sub_share >= cfg.kick_sub_share_min else 0.0
            return max(0.0, cfg.emit_min_kick_conf - relax)
        if role == "drums_snare":
            relax = cfg.emit_backbeat_relax_conf if snare_positional_hint else 0.0
            return max(0.0, cfg.emit_min_snare_conf - relax)
        if role == "drums_tops":
            return max(0.0, cfg.emit_min_tops_conf)
        return max(0.0, cfg.emit_min_perc_conf)

    def apply_precision_gate(candidates: list[EmittedEvent], *, stage: str) -> list[EmittedEvent]:
        if not candidates:
            return []
        if not cfg.enable_asymmetric_precision_gate:
            return candidates

        kept: list[EmittedEvent] = []
        dropped: list[tuple[EmittedEvent, float, str]] = []
        for e in candidates:
            req_margin = 0.0
            if e.role == "drums_kick":
                if e.sub_share < cfg.kick_precision_min_sub_share:
                    req_margin = cfg.kick_precision_min_margin + cfg.precision_gate_low_sub_margin_penalty
            elif e.role == "drums_snare":
                if e.mid_share < cfg.snare_precision_min_mid_share:
                    req_margin = cfg.snare_precision_min_margin + cfg.precision_gate_low_mid_margin_penalty
                    if snare_positional_hint:
                        req_margin = max(0.0, req_margin - cfg.snare_precision_backbeat_relax)

            if e.margin >= req_margin:
                kept.append(e)
            else:
                dropped.append((e, req_margin, "precision_margin_below_min"))
        if kept:
            if cluster_diag is not None:
                cluster_diag["notes"].append(f"{stage}:precision_gate_kept={len(kept)}")
                for e, req_margin, reason in dropped:
                    cluster_diag["drops"].append(
                        {
                            "stage": stage,
                            "role": e.role,
                            "time_sec": round(e.time_sec, 6),
                            "confidence": round(e.confidence, 6),
                            "margin": round(e.margin, 6),
                            "required_margin": round(req_margin, 6),
                            "reason": reason,
                        }
                    )
            return kept

        best = max(candidates, key=lambda e: e.confidence)
        if best.role == "drums_kick":
            req_margin = 0.0
            if best.sub_share < cfg.kick_precision_min_sub_share:
                req_margin = cfg.kick_precision_min_margin + cfg.precision_gate_low_sub_margin_penalty
        elif best.role == "drums_snare":
            req_margin = 0.0
            if best.mid_share < cfg.snare_precision_min_mid_share:
                req_margin = cfg.snare_precision_min_margin + cfg.precision_gate_low_mid_margin_penalty
                if snare_positional_hint:
                    req_margin = max(0.0, req_margin - cfg.snare_precision_backbeat_relax)
        else:
            req_margin = 0.0

        if best.margin >= max(0.0, req_margin - cfg.precision_gate_force_single_margin):
            if cluster_diag is not None:
                cluster_diag["notes"].append(f"{stage}:precision_gate_force_single")
                for e, req, reason in dropped:
                    cluster_diag["drops"].append(
                        {
                            "stage": stage,
                            "role": e.role,
                            "time_sec": round(e.time_sec, 6),
                            "confidence": round(e.confidence, 6),
                            "margin": round(e.margin, 6),
                            "required_margin": round(req, 6),
                            "reason": reason,
                        }
                    )
            return [best]

        if cluster_diag is not None:
            cluster_diag["notes"].append(f"{stage}:precision_gate_suppressed_all")
            for e, req, reason in dropped:
                cluster_diag["drops"].append(
                    {
                        "stage": stage,
                        "role": e.role,
                        "time_sec": round(e.time_sec, 6),
                        "confidence": round(e.confidence, 6),
                        "margin": round(e.margin, 6),
                        "required_margin": round(req, 6),
                        "reason": reason,
                    }
                )
        return []

    def apply_emit_floors(candidates: list[EmittedEvent], *, stage: str) -> list[EmittedEvent]:
        if not candidates:
            return []
        if not cfg.enable_emit_confidence_floor:
            return candidates
        kept = [e for e in candidates if e.confidence >= min_conf_for_role(e.role)]
        if kept:
            if cluster_diag is not None and len(kept) != len(candidates):
                for e in candidates:
                    if e in kept:
                        continue
                    cluster_diag["drops"].append(
                        {
                            "stage": stage,
                            "role": e.role,
                            "time_sec": round(e.time_sec, 6),
                            "confidence": round(e.confidence, 6),
                            "required_confidence": round(min_conf_for_role(e.role), 6),
                            "reason": "emit_confidence_floor",
                        }
                    )
            return kept
        best = max(candidates, key=lambda e: e.confidence)
        if best.confidence >= max(0.0, min_conf_for_role(best.role) - cfg.emit_force_single_margin):
            if cluster_diag is not None:
                cluster_diag["notes"].append(f"{stage}:emit_floor_force_single")
                for e in candidates:
                    if e is best:
                        continue
                    cluster_diag["drops"].append(
                        {
                            "stage": stage,
                            "role": e.role,
                            "time_sec": round(e.time_sec, 6),
                            "confidence": round(e.confidence, 6),
                            "required_confidence": round(min_conf_for_role(e.role), 6),
                            "reason": "emit_confidence_floor",
                        }
                    )
            return [best]
        if cluster_diag is not None:
            cluster_diag["notes"].append(f"{stage}:emit_floor_suppressed_all")
            for e in candidates:
                cluster_diag["drops"].append(
                    {
                        "stage": stage,
                        "role": e.role,
                        "time_sec": round(e.time_sec, 6),
                        "confidence": round(e.confidence, 6),
                        "required_confidence": round(min_conf_for_role(e.role), 6),
                        "reason": "emit_confidence_floor",
                    }
                )
        return []

    kick_evidence = has_kick_vote or (
        max_sub_mid_ratio >= cfg.kick_sub_mid_ratio_min * 0.8
        and max_sub_share >= cfg.kick_sub_share_min * 0.9
    ) or (
        max_sub_share >= cfg.kick_sub_share_min * 0.85
        and max_kick_p >= cfg.dual_kick_min_p * 0.45
    )
    snare_band_evidence = (
        max_mid_share >= cfg.snare_mid_share_min * 0.75
        and mid_to_sub_share >= 0.20
    )
    snare_hint_ok = snare_positional_hint and max_snare_p >= cfg.dual_snare_min_p * 1.2
    snare_posterior_ok = (
        max_snare_p >= cfg.dual_snare_min_p
        and max_snare_p >= max_kick_p * 0.7
        and max_mid_share >= cfg.snare_mid_share_min * 0.75
    )
    snare_evidence = snare_band_evidence and (has_snare_like_vote or snare_hint_ok or snare_posterior_ok)
    dual_ok = kick_evidence and snare_evidence
    # Stacked backbeat override (Phase 1 B): strong low + strong mid in same short window -> emit both.
    # Smart variant: when the cluster contains BOTH a low-origin (kick-confirmed) posterior AND a
    # non-low-origin (snare-confirmed) posterior, use a relaxed mid threshold — this represents a
    # genuine simultaneous kick+snare hit.  When the cluster is kick-only (all low-origin), the
    # tighter stacked_mid_min threshold applies to suppress phantom snares from kick room resonance.
    cluster_span_sec = max(p.time_sec for p in cluster) - min(p.time_sec for p in cluster)
    if not dual_ok and cluster_span_sec <= cfg.dual_cluster_span_sec:
        has_low_origin_p = any(p.low_origin for p in cluster)
        has_non_low_origin_p = any(not p.low_origin for p in cluster)
        is_mixed_origin = cfg.enable_low_origin_kick_gate and has_low_origin_p and has_non_low_origin_p
        # Relaxed mid threshold for mixed-origin clusters (real kick+snare pairs).
        effective_stacked_mid_min = (
            cfg.stacked_mid_min * 0.60 if is_mixed_origin else cfg.stacked_mid_min
        )
        if max_sub_share >= cfg.stacked_low_min and max_mid_share >= effective_stacked_mid_min:
            dual_ok = True
            if cluster_diag is not None:
                cluster_diag["stacked_backbeat_override"] = True
                cluster_diag["stacked_mixed_origin"] = is_mixed_origin
    if cluster_diag is not None:
        cluster_diag["dual_check"] = {
            "has_kick_vote": has_kick_vote,
            "has_snare_vote": has_snare_vote,
            "has_snare_like_vote": has_snare_like_vote,
            "snare_positional_hint": snare_positional_hint,
            "kick_evidence": kick_evidence,
            "snare_evidence": snare_evidence,
            "dual_ok": dual_ok,
            "max_kick_p": round(max_kick_p, 6),
            "max_snare_p": round(max_snare_p, 6),
            "max_sub_share": round(max_sub_share, 6),
            "max_mid_share": round(max_mid_share, 6),
        }

    if dual_ok:
        if has_snare_vote:
            best_snare = max(cluster, key=lambda p: p.snare_p)
        else:
            best_snare = max(cluster, key=lambda p: p.mid_share)
        if abs(best_kick.time_sec - best_snare.time_sec) <= cfg.dual_same_time_sec:
            t_kick = t_snare = float((best_kick.time_sec + best_snare.time_sec) / 2.0)
        else:
            t_kick = best_kick.time_sec
            t_snare = best_snare.time_sec
        candidate_events = [
            EmittedEvent(
                time_sec=t_kick,
                role="drums_kick",
                velocity=_event_velocity("drums_kick", best_kick.low_e, best_kick.mid_e, scales),
                confidence=best_kick.kick_p,
                margin=_role_margin(best_kick, "drums_kick"),
                sub_share=best_kick.sub_share,
                mid_share=best_kick.mid_share,
                low_rise=best_kick.low_rise,
            ),
            EmittedEvent(
                time_sec=t_snare,
                role="drums_snare",
                velocity=_event_velocity("drums_snare", best_snare.low_e, best_snare.mid_e, scales),
                confidence=best_snare.snare_p,
                margin=_role_margin(best_snare, "drums_snare"),
                sub_share=best_snare.sub_share,
                mid_share=best_snare.mid_share,
                low_rise=best_snare.low_rise,
            ),
        ]
        candidate_events = apply_precision_gate(candidate_events, stage="dual")
        kept = apply_emit_floors(candidate_events, stage="dual")
        if cluster_diag is not None:
            cluster_diag["decision"] = "dual_kick_snare"
        return kept

    cluster_span = max(p.time_sec for p in cluster) - min(p.time_sec for p in cluster)

    def infer_snare_double() -> list[EmittedEvent]:
        if len(cluster) < 2:
            return []
        if cluster_span < cfg.close_hit_keep_min_sep or cluster_span > cfg.dual_cluster_span_sec:
            return []

        primary = max(cluster, key=lambda p: p.snare_p)
        secondary_candidates = [p for p in cluster if abs(p.time_sec - primary.time_sec) >= cfg.close_hit_keep_min_sep]
        if not secondary_candidates:
            return []
        secondary = max(secondary_candidates, key=lambda p: p.snare_p)
        if primary.snare_p < cfg.dual_snare_min_p * 1.05:
            return []
        if secondary.snare_p < max(cfg.dual_snare_min_p * 0.75, primary.snare_p * 0.62):
            return []
        if secondary.snare_p < cfg.snare_close_hit_second_conf_min:
            return []
        if not has_snare_like_vote and not snare_positional_hint:
            return []
        if primary.mid_share < cfg.snare_mid_share_min * 0.70 or secondary.mid_share < cfg.snare_mid_share_min * 0.65:
            return []
        # Avoid converting clear kick-dominant close doubles into two snares.
        max_k = max(p.kick_p for p in cluster)
        max_sub = max(p.sub_share for p in cluster)
        if max_k > primary.snare_p * 1.15 and max_sub >= cfg.kick_sub_share_min * 0.95:
            return []
        candidates = sorted([primary, secondary], key=lambda p: p.time_sec)
        candidate_events = [
            EmittedEvent(
                time_sec=candidates[0].time_sec,
                role="drums_snare",
                velocity=_event_velocity("drums_snare", candidates[0].low_e, candidates[0].mid_e, scales),
                confidence=candidates[0].snare_p,
                margin=_role_margin(candidates[0], "drums_snare"),
                sub_share=candidates[0].sub_share,
                mid_share=candidates[0].mid_share,
                low_rise=candidates[0].low_rise,
            ),
            EmittedEvent(
                time_sec=candidates[1].time_sec,
                role="drums_snare",
                velocity=_event_velocity("drums_snare", candidates[1].low_e, candidates[1].mid_e, scales),
                confidence=candidates[1].snare_p,
                margin=_role_margin(candidates[1], "drums_snare"),
                sub_share=candidates[1].sub_share,
                mid_share=candidates[1].mid_share,
                low_rise=candidates[1].low_rise,
            ),
        ]
        candidate_events = apply_precision_gate(candidate_events, stage="snare_double")
        return apply_emit_floors(candidate_events, stage="snare_double")

    if cfg.enable_snare_close_double_inference:
        snare_double = infer_snare_double()
        if snare_double:
            if cluster_diag is not None:
                cluster_diag["decision"] = "snare_double"
            return snare_double

    # Single-event fallback: choose by posterior mass (not vote counts) so one
    # over-eager class does not dominate ambiguous clusters.
    role_scores = {
        "drums_kick": sum(p.kick_p for p in cluster),
        "drums_snare": sum(p.snare_p for p in cluster),
        "drums_tops": sum(p.tops_p for p in cluster),
        "drums_perc": sum(p.perc_p for p in cluster),
    }
    chosen_role: RoleName = max(ROLE_ORDER, key=lambda r: role_scores[r])
    # Guard against kick over-detection when low-band dominance is weak.
    if (
        chosen_role == "drums_kick"
        and max_sub_share < cfg.kick_sub_share_min * 0.95
        and role_scores["drums_snare"] >= role_scores["drums_kick"] * 0.88
        and max_mid_share >= cfg.snare_mid_share_min * 0.9
    ):
        chosen_role = "drums_snare"
    if chosen_role in ("drums_tops", "drums_perc"):
        if (
            max_snare_p >= cfg.dual_snare_min_p * cfg.tops_to_snare_min_p_mult
            and max_mid_share >= cfg.snare_mid_share_min * cfg.tops_to_snare_mid_share_mult
            and role_scores["drums_snare"] >= role_scores[chosen_role] * cfg.tops_to_snare_score_ratio
        ):
            chosen_role = "drums_snare"
    t = float(median([p.time_sec for p in cluster]))
    low_e = sum(p.low_e for p in cluster) / len(cluster)
    mid_e = sum(p.mid_e for p in cluster) / len(cluster)
    conf_by_role = {
        "drums_kick": max_kick_p,
        "drums_snare": max_snare_p,
        "drums_tops": max_tops_p,
        "drums_perc": max_perc_p,
    }
    best_for_role = max(cluster, key=lambda p: _role_prob(p, chosen_role))
    if cluster_diag is not None:
        cluster_diag["role_scores"] = {k: round(float(v), 6) for k, v in role_scores.items()}
        cluster_diag["single_role_choice"] = chosen_role
    candidate_events = [
        EmittedEvent(
            time_sec=t,
            role=chosen_role,
            velocity=_event_velocity(chosen_role, low_e, mid_e, scales),
            confidence=conf_by_role[chosen_role],
            margin=_role_margin(best_for_role, chosen_role),
            sub_share=best_for_role.sub_share,
            mid_share=best_for_role.mid_share,
            low_rise=best_for_role.low_rise,
        )
    ]

    candidate_events = apply_precision_gate(candidate_events, stage="single")
    kept = apply_emit_floors(candidate_events, stage="single")
    if cluster_diag is not None:
        cluster_diag["decision"] = "single"
    return kept


def _effective_role_nms_sec(cfg: EngineConfig, bpm: float | None) -> float:
    nms = cfg.role_nms_sec
    if bpm and bpm > 0:
        beat_est = 60.0 / bpm
        if beat_est > 1e-9:
            nms = min(nms, beat_est * cfg.role_nms_beat_frac)
    return max(cfg.role_nms_min_sec, nms)


def _role_nms(
    events: list[EmittedEvent],
    cfg: EngineConfig,
    bpm: float | None,
    nms_diag: dict[str, Any] | None = None,
    hint_grid: "BackendHintGrid | None" = None,
) -> list[EmittedEvent]:
    min_sep_sec = _effective_role_nms_sec(cfg, bpm)
    # Kicks use a wider flat window to suppress resonance-tail re-detections.
    kick_sep_sec = max(cfg.role_nms_min_sec, cfg.kick_nms_window_sec)
    if nms_diag is not None:
        nms_diag["min_sep_sec"] = round(min_sep_sec, 6)
        nms_diag["kick_sep_sec"] = round(kick_sep_sec, 6)
        nms_diag["dropped"] = []
    by_role: dict[RoleName, list[EmittedEvent]] = defaultdict(list)
    for e in events:
        by_role[e.role].append(e)

    out: list[EmittedEvent] = []
    for role, role_events in by_role.items():
        role_sep = kick_sep_sec if role == "drums_kick" else min_sep_sec
        sorted_events = sorted(role_events, key=lambda e: e.time_sec)
        clusters: list[list[EmittedEvent]] = [[sorted_events[0]]]
        for e in sorted_events[1:]:
            if e.time_sec - clusters[-1][-1].time_sec < role_sep:
                clusters[-1].append(e)
            else:
                clusters.append([e])
        for cluster in clusters:
            if len(cluster) == 1:
                out.append(cluster[0])
                continue
            best = max(cluster, key=lambda e: e.velocity)
            out.append(best)
            kept_ids = {id(best)}
            dropped_records: list[dict[str, Any]] = []
            # Keep a second same-role hit inside close windows when it carries
            # strong evidence (e.g. stacked backbeats, close kick doubles).
            if role in ("drums_kick", "drums_snare"):
                candidates = sorted(cluster, key=lambda e: e.velocity, reverse=True)
                for cand in candidates:
                    if cand is best:
                        continue
                    if abs(cand.time_sec - best.time_sec) < cfg.close_hit_keep_min_sep:
                        dropped_records.append(
                            {
                                "role": role,
                                "time_sec": round(cand.time_sec, 6),
                                "velocity": int(cand.velocity),
                                "confidence": round(cand.confidence, 6),
                                "margin": round(cand.margin, 6),
                                "reason": "nms_close_hit_min_sep",
                            }
                        )
                        continue
                    if role == "drums_snare":
                        min_vel_frac = max(cfg.close_hit_second_vel_frac, cfg.snare_close_hit_second_vel_frac)
                    else:
                        min_vel_frac = cfg.close_hit_second_vel_frac
                    low_rise_override = (
                        cand.low_rise >= cfg.close_hit_second_low_rise_min
                        and cand.confidence >= cfg.close_hit_second_low_rise_conf_min
                        and cand.margin >= cfg.close_hit_second_low_rise_margin_min
                    )
                    if role == "drums_snare":
                        low_rise_override = low_rise_override and cand.mid_share >= cfg.snare_mid_share_min * 0.90
                    if cand.velocity < int(best.velocity * min_vel_frac):
                        if low_rise_override:
                            out.append(cand)
                            kept_ids.add(id(cand))
                            break
                        # Second-hit rescue: keep if backend hint prob for this role is high enough.
                        if hint_grid is not None:
                            h_kick, h_snare, _h_tops, _h_perc = hint_grid.probs_at_time(cand.time_sec)
                            if (role == "drums_kick" and h_kick >= cfg.hint_rescue_min_prob) or (
                                role == "drums_snare" and h_snare >= cfg.hint_rescue_min_prob
                            ):
                                out.append(cand)
                                kept_ids.add(id(cand))
                                break
                        dropped_records.append(
                            {
                                "role": role,
                                "time_sec": round(cand.time_sec, 6),
                                "velocity": int(cand.velocity),
                                "confidence": round(cand.confidence, 6),
                                "margin": round(cand.margin, 6),
                                "low_rise": round(cand.low_rise, 6),
                                "reason": "nms_second_velocity_low",
                            }
                        )
                        continue
                    if role == "drums_snare":
                        if cand.confidence < cfg.snare_close_hit_second_conf_min:
                            dropped_records.append(
                                {
                                    "role": role,
                                    "time_sec": round(cand.time_sec, 6),
                                    "velocity": int(cand.velocity),
                                    "confidence": round(cand.confidence, 6),
                                    "margin": round(cand.margin, 6),
                                    "reason": "nms_snare_second_conf_low",
                                }
                            )
                            continue
                    out.append(cand)
                    kept_ids.add(id(cand))
                    break
            for cand in cluster:
                if id(cand) in kept_ids:
                    continue
                if role not in ("drums_kick", "drums_snare"):
                    dropped_records.append(
                        {
                            "role": role,
                            "time_sec": round(cand.time_sec, 6),
                            "velocity": int(cand.velocity),
                            "confidence": round(cand.confidence, 6),
                            "margin": round(cand.margin, 6),
                            "reason": "nms_lower_velocity",
                        }
                    )
            if nms_diag is not None:
                nms_diag["dropped"].extend(dropped_records)
    out.sort(key=lambda e: e.time_sec)
    return out


def _kick_grid_suppressor(
    events: list[EmittedEvent],
    cfg: EngineConfig,
    bpm: float | None,
    hint_grid: "BackendHintGrid | None" = None,
) -> list[EmittedEvent]:
    """
    Post-NMS filter: suppress kick events that are far from the BPM beat grid.

    Real kicks land on beat positions or simple subdivisions (8th/16th notes).
    Resonance FPs from tom hits, floor decay, or room noise tend to fall off-grid.
    A kick event is suppressed when:
      - enable_kick_grid_suppressor is True
      - BPM is provided and > 0
      - distance to nearest beat-subdivision grid point > kick_grid_tol_frac * beat_sec
      - AND backend hint kick prob (if available) < kick_grid_hint_rescue_prob

    Grid points checked: every 16th-note (beat/4), so kicks on beats 1-4 plus
    downbeats, upbeats, and 16th-note offsets all pass. Only events landing between
    16th-note positions are suppressed.
    """
    if not cfg.enable_kick_grid_suppressor or not bpm or bpm <= 0:
        return events
    beat_sec = 60.0 / bpm
    # 16th-note grid step (beat / 4); tolerance is fraction of a full beat
    grid_step = beat_sec / 4.0
    tol = cfg.kick_grid_tol_frac * beat_sec
    filtered: list[EmittedEvent] = []
    for e in events:
        if e.role != "drums_kick":
            filtered.append(e)
            continue
        # Distance to nearest 16th-note grid position
        pos_in_beat = e.time_sec % grid_step
        dist = min(pos_in_beat, grid_step - pos_in_beat)
        if dist <= tol:
            filtered.append(e)
            continue
        # Off-grid — rescue via backend hint if prob is high enough
        if hint_grid is not None:
            h_kick, _h_snare, _h_tops, _h_perc = hint_grid.probs_at_time(e.time_sec)
            if h_kick >= cfg.kick_grid_hint_rescue_prob:
                filtered.append(e)
                continue
        # Suppress: off-grid kick with no strong hint support
    return filtered


def _kick_reverb_snare_filter(events: list[EmittedEvent], cfg: EngineConfig) -> list[EmittedEvent]:
    """
    Post-NMS filter: suppress snare events near a kick with two independent arms.

    Arm A (high-sub / kick resonance):
        near kick AND sub_share >= kick_reverb_max_snare_sub (default 0.35)
        Rationale: kick body resonance misclassified as snare retains elevated sub_share (0.20–0.45)
        from the decaying kick fundamental.  Genuine simultaneous snares have sub_share 0.05–0.18.

    Arm B (low-sub / bleed, disabled by default: kick_reverb_low_sub_max = 0.0):
        near kick AND sub_share < kick_reverb_low_sub_max
        Rationale: non-drum bleed events (guitar, bass) near kicks have extremely low sub_share
        (0.03–0.12) and high mid_share (0.55–0.83) — spectral fingerprint of a string/vocal event
        misclassified as snare via the dual_ok path.  Genuine simultaneous snares have sub_share
        0.05–0.25, so set kick_reverb_low_sub_max BELOW the observed minimum TP snare sub_share.
    """
    if not cfg.enable_kick_reverb_snare_filter:
        return events
    kick_times = [e.time_sec for e in events if e.role == "drums_kick"]
    if not kick_times:
        return events
    filtered: list[EmittedEvent] = []
    for e in events:
        if e.role != "drums_snare":
            filtered.append(e)
            continue
        near_kick = any(
            abs(e.time_sec - kt) <= cfg.kick_reverb_window_sec
            for kt in kick_times
        )
        if near_kick and e.sub_share >= cfg.kick_reverb_max_snare_sub:
            continue  # Arm A: suppress kick resonance (high sub)
        if near_kick and cfg.kick_reverb_low_sub_max > 0.0 and e.sub_share < cfg.kick_reverb_low_sub_max:
            continue  # Arm B: suppress bleed event (very low sub, likely guitar/instrument bleed)
        filtered.append(e)
    return filtered


def _kick_sub_share_gate(events: list[EmittedEvent], cfg: EngineConfig) -> list[EmittedEvent]:
    """
    Post-NMS filter: suppress kick events matching the resonance-tail spectral signature.

    Resonance tails (kick re-detections 100–500ms after the true kick) have:
      - HIGH sub_share (>= kick_min_sub_share): the decaying kick fundamental is still present
      - LOW mid_share (<= kick_resonance_max_mid): the beater-impact attack transient is gone

    Genuine bass-drum hits also have high sub_share but RETAIN mid energy from the beater snap.
    The combined gate (high sub AND low mid) targets resonance tails without suppressing true kicks.
    A sub_share-only floor does not work — TP and FP distributions overlap significantly.

    Diagnostic basis (ENST): FP kicks have sub_share 0.57–0.69; TP kicks overlap at 0.47–0.68.
    FP kicks are resonance re-detections, not spectrally weak events.

    Disabled by default; enable via enableKickSubShareGate JSON key or --enable-kick-sub-share-gate.
    """
    if not cfg.enable_kick_sub_share_gate:
        return events
    filtered: list[EmittedEvent] = []
    for e in events:
        if (
            e.role == "drums_kick"
            and e.sub_share >= cfg.kick_min_sub_share
            and e.mid_share <= cfg.kick_resonance_max_mid
        ):
            continue  # suppress: resonance tail (high sub, low mid — attack gone)
        filtered.append(e)
    return filtered


def _snare_sub_share_gate(events: list[EmittedEvent], cfg: EngineConfig) -> list[EmittedEvent]:
    """
    Post-NMS filter: suppress snare events whose sub_share is above snare_max_sub_share.

    FP snares from bass bleed or floor resonance carry heavy low-frequency energy that
    should not be present in a genuine snare hit.  Genuine snares are mid-dominant
    (sub_share 0.05–0.25); bass-bleed FPs have sub_share 0.30+.

    This is complementary to _kick_reverb_snare_filter: that filter covers snares
    temporally near a kick; this gate covers far-from-kick high-sub FP snares.

    Disabled by default; enable via enableSnareSubShareGate JSON key or --enable-snare-sub-share-gate.
    Threshold (snare_max_sub_share) should be set from a diagnostic run on A2MD clips.
    """
    if not cfg.enable_snare_sub_share_gate:
        return events
    filtered: list[EmittedEvent] = []
    for e in events:
        if e.role == "drums_snare" and e.sub_share >= cfg.snare_max_sub_share:
            continue  # suppress: high-sub snare (bass bleed / floor resonance FP)
        filtered.append(e)
    return filtered


def infer_events(
    posteriors: list[RolePosterior],
    cfg: EngineConfig,
    scales: FeatureScales,
    bpm: float | None = None,
    diagnostics: dict[str, Any] | None = None,
    hint_grid: "BackendHintGrid | None" = None,
) -> list[EmittedEvent]:
    clusters = _cluster_posteriors(posteriors, cfg.merge_sec)
    if diagnostics is not None:
        diagnostics.clear()
        diagnostics["cluster_count"] = len(clusters)
        diagnostics["clusters"] = []
    events: list[EmittedEvent] = []
    for idx, cluster in enumerate(clusters):
        cluster_diag = {} if diagnostics is not None else None
        inferred = _infer_dual_from_cluster(cluster, cfg, scales, bpm, cluster_diag=cluster_diag)
        events.extend(inferred)
        if diagnostics is not None and cluster_diag is not None:
            cluster_diag["cluster_index"] = idx
            cluster_diag["events_kept_pre_nms"] = [
                {
                    "role": e.role,
                    "time_sec": round(e.time_sec, 6),
                    "velocity": int(e.velocity),
                    "confidence": round(e.confidence, 6),
                    "margin": round(e.margin, 6),
                    "low_rise": round(e.low_rise, 6),
                }
                for e in inferred
            ]
            diagnostics["clusters"].append(cluster_diag)
    if diagnostics is not None:
        diagnostics["events_before_nms_count"] = len(events)
        nms_diag: dict[str, Any] = {}
        out = _role_nms(events, cfg, bpm, nms_diag=nms_diag, hint_grid=hint_grid)
        diagnostics["nms"] = nms_diag
        diagnostics["events_after_nms_count"] = len(out)
        out = _kick_reverb_snare_filter(out, cfg)
        diagnostics["events_after_reverb_filter_count"] = len(out)
        out = _kick_grid_suppressor(out, cfg, bpm, hint_grid=hint_grid)
        diagnostics["events_after_kick_grid_count"] = len(out)
        out = _kick_sub_share_gate(out, cfg)
        diagnostics["events_after_kick_sub_share_gate_count"] = len(out)
        out = _snare_sub_share_gate(out, cfg)
        diagnostics["events_after_snare_sub_share_gate_count"] = len(out)
        return out
    return _snare_sub_share_gate(
        _kick_sub_share_gate(
            _kick_grid_suppressor(
                _kick_reverb_snare_filter(_role_nms(events, cfg, bpm, hint_grid=hint_grid), cfg),
                cfg, bpm, hint_grid=hint_grid,
            ),
            cfg,
        ),
        cfg,
    )


def to_by_role(events: list[EmittedEvent], min_velocity_threshold: int = 1) -> dict[RoleName, list[tuple[float, int]]]:
    threshold = max(1, min(127, int(min_velocity_threshold)))
    out: dict[RoleName, list[tuple[float, int]]] = {r: [] for r in ROLE_ORDER}
    for e in events:
        if int(e.velocity) < threshold:
            continue
        out[e.role].append((e.time_sec, int(e.velocity)))
    for role in ROLE_ORDER:
        out[role].sort(key=lambda x: x[0])
    return out
