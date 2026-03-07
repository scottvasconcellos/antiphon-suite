from __future__ import annotations

import unittest

from .helpers import SCRIPT_DIR
from drum_engine.config import EngineConfig
from drum_engine.merge import _role_nms, infer_events, to_by_role
from drum_engine.types import EmittedEvent, FeatureScales, RolePosterior


class TestMerge(unittest.TestCase):
    def test_infer_events_emits_explicit_dual_hits_in_close_window(self) -> None:
        cfg = EngineConfig()
        scales = FeatureScales(
            max_low=100.0,
            max_mid=100.0,
            max_centroid=3000.0,
            max_transient=3.0,
            max_attack=1.0,
            max_total=200.0,
        )
        posteriors = [
            RolePosterior(
                time_sec=1.000,
                low_e=85.0,
                mid_e=18.0,
                sub_share=0.58,
                mid_share=0.20,
                sub_mid_ratio=2.7,
                kick_p=0.78,
                snare_p=0.18,
                tops_p=0.02,
                perc_p=0.02,
                chosen_role="drums_kick",
                chosen_p=0.78,
            ),
            RolePosterior(
                time_sec=1.028,
                low_e=26.0,
                mid_e=73.0,
                sub_share=0.20,
                mid_share=0.55,
                sub_mid_ratio=0.62,
                kick_p=0.22,
                snare_p=0.73,
                tops_p=0.03,
                perc_p=0.02,
                chosen_role="drums_snare",
                chosen_p=0.73,
            ),
        ]

        events = infer_events(posteriors, cfg, scales)
        by_role = to_by_role(events)

        self.assertEqual(len(by_role["drums_kick"]), 1)
        self.assertEqual(len(by_role["drums_snare"]), 1)
        self.assertLess(abs(by_role["drums_kick"][0][0] - 1.000), 0.03)
        self.assertLess(abs(by_role["drums_snare"][0][0] - 1.028), 0.03)

    def test_merge_remaps_mid_heavy_tops_to_snare_when_not_dual(self) -> None:
        cfg = EngineConfig()
        scales = FeatureScales(
            max_low=100.0,
            max_mid=100.0,
            max_centroid=3000.0,
            max_transient=3.0,
            max_attack=1.0,
            max_total=200.0,
        )
        posteriors = [
            RolePosterior(
                time_sec=0.279,
                low_e=20.0,
                mid_e=68.0,
                sub_share=0.10,
                mid_share=0.40,
                sub_mid_ratio=0.25,
                kick_p=0.10,
                snare_p=0.31,
                tops_p=0.35,
                perc_p=0.10,
                chosen_role="drums_tops",
                chosen_p=0.35,
            )
        ]
        events = infer_events(posteriors, cfg, scales)
        by_role = to_by_role(events)
        self.assertEqual(len(by_role["drums_snare"]), 1)
        self.assertEqual(len(by_role["drums_tops"]), 0)

    def test_single_fallback_uses_posterior_mass_not_vote_counts(self) -> None:
        cfg = EngineConfig(emit_min_snare_conf=0.18)
        scales = FeatureScales(
            max_low=100.0,
            max_mid=100.0,
            max_centroid=3000.0,
            max_transient=3.0,
            max_attack=1.0,
            max_total=200.0,
        )
        # All kick "votes", but aggregate snare posterior mass is higher.
        # Keep max snare_p < dual_snare_min_p so we force single-event fallback.
        posteriors = [
            RolePosterior(
                time_sec=1.000,
                low_e=22.0,
                mid_e=38.0,
                sub_share=0.28,
                mid_share=0.26,
                sub_mid_ratio=0.95,
                kick_p=0.20,
                snare_p=0.21,
                tops_p=0.05,
                perc_p=0.05,
                chosen_role="drums_kick",
                chosen_p=0.20,
            ),
            RolePosterior(
                time_sec=1.018,
                low_e=20.0,
                mid_e=44.0,
                sub_share=0.27,
                mid_share=0.28,
                sub_mid_ratio=0.92,
                kick_p=0.19,
                snare_p=0.21,
                tops_p=0.05,
                perc_p=0.05,
                chosen_role="drums_kick",
                chosen_p=0.19,
            ),
            RolePosterior(
                time_sec=1.031,
                low_e=18.0,
                mid_e=46.0,
                sub_share=0.24,
                mid_share=0.30,
                sub_mid_ratio=0.85,
                kick_p=0.18,
                snare_p=0.21,
                tops_p=0.05,
                perc_p=0.05,
                chosen_role="drums_kick",
                chosen_p=0.18,
            ),
        ]

        events = infer_events(posteriors, cfg, scales)
        by_role = to_by_role(events)
        self.assertEqual(len(by_role["drums_snare"]), 1)
        self.assertEqual(len(by_role["drums_kick"]), 0)

    def test_single_fallback_demotes_weak_kick_to_snare(self) -> None:
        cfg = EngineConfig(emit_min_snare_conf=0.18)
        scales = FeatureScales(
            max_low=100.0,
            max_mid=100.0,
            max_centroid=3000.0,
            max_transient=3.0,
            max_attack=1.0,
            max_total=200.0,
        )
        # Kick mass narrowly wins in fallback, but weak sub share + strong mid should demote to snare.
        # Keep max snare_p < dual_snare_min_p so dual path does not trigger.
        posteriors = [
            RolePosterior(
                time_sec=0.500,
                low_e=24.0,
                mid_e=40.0,
                sub_share=0.24,
                mid_share=0.19,
                sub_mid_ratio=0.95,
                kick_p=0.24,
                snare_p=0.212,
                tops_p=0.03,
                perc_p=0.02,
                chosen_role="drums_kick",
                chosen_p=0.24,
            ),
            RolePosterior(
                time_sec=0.522,
                low_e=25.0,
                mid_e=44.0,
                sub_share=0.22,
                mid_share=0.20,
                sub_mid_ratio=0.90,
                kick_p=0.24,
                snare_p=0.212,
                tops_p=0.03,
                perc_p=0.02,
                chosen_role="drums_kick",
                chosen_p=0.24,
            ),
        ]

        events = infer_events(posteriors, cfg, scales)
        by_role = to_by_role(events)
        self.assertEqual(len(by_role["drums_snare"]), 1)
        self.assertEqual(len(by_role["drums_kick"]), 0)

    def test_role_nms_keeps_strong_close_snare_doubles(self) -> None:
        cfg = EngineConfig()
        events = [
            EmittedEvent(time_sec=1.000, role="drums_snare", velocity=114, confidence=0.76, margin=0.09),
            EmittedEvent(time_sec=1.024, role="drums_snare", velocity=102, confidence=0.62, margin=0.05),
        ]
        kept = _role_nms(events, cfg, bpm=120.0)
        by_role = to_by_role(kept)
        self.assertEqual(len(by_role["drums_snare"]), 2)
        self.assertLess(abs(by_role["drums_snare"][1][0] - by_role["drums_snare"][0][0] - 0.024), 0.015)

    def test_role_nms_drops_weak_close_snare_second_when_confidence_is_low(self) -> None:
        cfg = EngineConfig()
        events = [
            EmittedEvent(time_sec=1.000, role="drums_snare", velocity=112, confidence=0.74, margin=0.08),
            EmittedEvent(time_sec=1.025, role="drums_snare", velocity=103, confidence=0.18, margin=0.01),
        ]
        kept = _role_nms(events, cfg, bpm=120.0)
        by_role = to_by_role(kept)
        self.assertEqual(len(by_role["drums_snare"]), 1)

    def test_role_nms_keeps_close_second_kick_on_strong_low_rise_even_if_velocity_is_lower(self) -> None:
        cfg = EngineConfig()
        events = [
            EmittedEvent(
                time_sec=1.000,
                role="drums_kick",
                velocity=112,
                confidence=0.74,
                margin=0.10,
                low_rise=0.20,
            ),
            EmittedEvent(
                time_sec=1.024,
                role="drums_kick",
                velocity=72,
                confidence=0.42,
                margin=0.06,
                low_rise=0.55,
            ),
        ]
        kept = _role_nms(events, cfg, bpm=120.0)
        by_role = to_by_role(kept)
        self.assertEqual(len(by_role["drums_kick"]), 2)

    def test_infer_events_emits_two_snares_for_close_stack_when_snare_evidence_is_strong(self) -> None:
        cfg = EngineConfig(enable_snare_close_double_inference=True)
        scales = FeatureScales(
            max_low=100.0,
            max_mid=100.0,
            max_centroid=3000.0,
            max_transient=3.0,
            max_attack=1.0,
            max_total=200.0,
        )
        posteriors = [
            RolePosterior(
                time_sec=2.000,
                low_e=21.0,
                mid_e=70.0,
                sub_share=0.18,
                mid_share=0.52,
                sub_mid_ratio=0.40,
                kick_p=0.14,
                snare_p=0.30,
                tops_p=0.44,
                perc_p=0.12,
                chosen_role="drums_tops",
                chosen_p=0.44,
            ),
            RolePosterior(
                time_sec=2.027,
                low_e=22.0,
                mid_e=66.0,
                sub_share=0.19,
                mid_share=0.49,
                sub_mid_ratio=0.43,
                kick_p=0.15,
                snare_p=0.27,
                tops_p=0.42,
                perc_p=0.16,
                chosen_role="drums_tops",
                chosen_p=0.42,
            ),
        ]
        events = infer_events(posteriors, cfg, scales)
        by_role = to_by_role(events)
        self.assertEqual(len(by_role["drums_snare"]), 2)
        self.assertEqual(len(by_role["drums_kick"]), 0)
        self.assertLess(abs(by_role["drums_snare"][1][0] - by_role["drums_snare"][0][0] - 0.027), 0.015)

    def test_infer_events_does_not_force_two_snares_when_kick_is_clearly_dominant(self) -> None:
        cfg = EngineConfig(enable_snare_close_double_inference=True)
        scales = FeatureScales(
            max_low=100.0,
            max_mid=100.0,
            max_centroid=3000.0,
            max_transient=3.0,
            max_attack=1.0,
            max_total=200.0,
        )
        posteriors = [
            RolePosterior(
                time_sec=2.000,
                low_e=78.0,
                mid_e=22.0,
                sub_share=0.56,
                mid_share=0.16,
                sub_mid_ratio=2.9,
                kick_p=0.62,
                snare_p=0.24,
                tops_p=0.08,
                perc_p=0.06,
                chosen_role="drums_kick",
                chosen_p=0.62,
            ),
            RolePosterior(
                time_sec=2.027,
                low_e=72.0,
                mid_e=24.0,
                sub_share=0.52,
                mid_share=0.17,
                sub_mid_ratio=2.4,
                kick_p=0.58,
                snare_p=0.23,
                tops_p=0.10,
                perc_p=0.09,
                chosen_role="drums_kick",
                chosen_p=0.58,
            ),
        ]
        events = infer_events(posteriors, cfg, scales)
        by_role = to_by_role(events)
        self.assertEqual(len(by_role["drums_snare"]), 0)
        self.assertGreaterEqual(len(by_role["drums_kick"]), 1)

    def test_emit_floor_suppresses_low_confidence_snare(self) -> None:
        cfg = EngineConfig(enable_emit_confidence_floor=True)
        scales = FeatureScales(
            max_low=100.0,
            max_mid=100.0,
            max_centroid=3000.0,
            max_transient=3.0,
            max_attack=1.0,
            max_total=200.0,
        )
        posteriors = [
            RolePosterior(
                time_sec=0.500,
                low_e=18.0,
                mid_e=44.0,
                sub_share=0.18,
                mid_share=0.20,
                sub_mid_ratio=0.65,
                kick_p=0.12,
                snare_p=0.19,
                tops_p=0.14,
                perc_p=0.08,
                chosen_role="drums_snare",
                chosen_p=0.19,
            )
        ]
        events = infer_events(posteriors, cfg, scales)
        by_role = to_by_role(events)
        self.assertEqual(len(by_role["drums_snare"]), 0)
        self.assertEqual(len(events), 0)

    def test_backbeat_relax_can_keep_borderline_snare(self) -> None:
        cfg = EngineConfig(enable_emit_confidence_floor=True)
        scales = FeatureScales(
            max_low=100.0,
            max_mid=100.0,
            max_centroid=3000.0,
            max_transient=3.0,
            max_attack=1.0,
            max_total=200.0,
        )
        # At 120 BPM, t=0.5 is beat 1 (odd), so backbeat hint can relax snare floor.
        posteriors = [
            RolePosterior(
                time_sec=0.500,
                low_e=16.0,
                mid_e=48.0,
                sub_share=0.17,
                mid_share=0.22,
                sub_mid_ratio=0.62,
                kick_p=0.12,
                snare_p=0.24,
                tops_p=0.12,
                perc_p=0.08,
                chosen_role="drums_snare",
                chosen_p=0.24,
            )
        ]
        events = infer_events(posteriors, cfg, scales, bpm=120.0)
        by_role = to_by_role(events)
        self.assertEqual(len(by_role["drums_snare"]), 1)

    def test_to_by_role_applies_min_velocity_threshold(self) -> None:
        events = [
            EmittedEvent(time_sec=0.10, role="drums_kick", velocity=32),
            EmittedEvent(time_sec=0.20, role="drums_kick", velocity=45),
            EmittedEvent(time_sec=0.30, role="drums_snare", velocity=39),
            EmittedEvent(time_sec=0.40, role="drums_snare", velocity=82),
        ]
        by_role = to_by_role(events, min_velocity_threshold=40)
        self.assertEqual(by_role["drums_kick"], [(0.20, 45)])
        self.assertEqual(by_role["drums_snare"], [(0.40, 82)])

    def test_stacked_backbeat_override_emits_both_kick_and_snare(self) -> None:
        """Phase 1 B: cluster with strong low + strong mid (stacked_low_min, stacked_mid_min) emits both."""
        cfg = EngineConfig(
            stacked_low_min=0.30,
            stacked_mid_min=0.18,
            dual_snare_min_p=0.50,
        )
        scales = FeatureScales(
            max_low=100.0,
            max_mid=100.0,
            max_centroid=3000.0,
            max_transient=3.0,
            max_attack=1.0,
            max_total=200.0,
        )
        # One frame with strong sub and strong mid; chosen_role kick so no snare vote -> dual_ok would be False
        # but stacked override (max_sub_share >= 0.30, max_mid_share >= 0.18) should force dual emit.
        posteriors = [
            RolePosterior(
                time_sec=1.000,
                low_e=70.0,
                mid_e=45.0,
                sub_share=0.38,
                mid_share=0.22,
                sub_mid_ratio=1.6,
                kick_p=0.55,
                snare_p=0.35,
                tops_p=0.05,
                perc_p=0.05,
                chosen_role="drums_kick",
                chosen_p=0.55,
            ),
            RolePosterior(
                time_sec=1.012,
                low_e=65.0,
                mid_e=48.0,
                sub_share=0.35,
                mid_share=0.24,
                sub_mid_ratio=1.4,
                kick_p=0.52,
                snare_p=0.38,
                tops_p=0.05,
                perc_p=0.05,
                chosen_role="drums_kick",
                chosen_p=0.52,
            ),
        ]
        events = infer_events(posteriors, cfg, scales, bpm=120.0)
        by_role = to_by_role(events)
        self.assertGreaterEqual(len(by_role["drums_kick"]), 1)
        self.assertGreaterEqual(len(by_role["drums_snare"]), 1)


if __name__ == "__main__":
    unittest.main()
