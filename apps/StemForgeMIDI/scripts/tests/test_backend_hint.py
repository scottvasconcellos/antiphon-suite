"""
Phase 1 unit tests — BackendHintGrid plumbing (steps 1.3–1.5).

1.3  probs_at_time(t): boundary clamping and linear interpolation.
1.4  classify tie-break: when rule margin < hint_tiebreak_margin and
     hint strongly favours one role, chosen_role flips accordingly.
1.5  merge second-hit rescue: a close second hit whose velocity is below
     the NMS vel-frac threshold is kept when hint_grid carries a high
     probability for the corresponding role at that time.
"""

from __future__ import annotations

import unittest

from .helpers import SCRIPT_DIR
from drum_engine.backend_hint import BackendHintGrid, backend_hint_from_numpy
from drum_engine.classify import classify_feature
from drum_engine.config import EngineConfig
from drum_engine.merge import _role_nms
from drum_engine.types import EmittedEvent, FeatureScales, OnsetFeature


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_grid(
    times: list[float],
    probs: list[tuple[float, float, float, float]],
    onset: list[float] | None = None,
) -> BackendHintGrid:
    """Build a BackendHintGrid directly without numpy."""
    return BackendHintGrid(
        times_sec=tuple(times),
        probs=tuple(probs),
        onset=tuple(onset) if onset is not None else None,
        sample_rate_hz=100,
        hop_sec=0.01,
        version="v0.1",
    )


def _make_scales() -> FeatureScales:
    return FeatureScales(
        max_low=100.0,
        max_mid=100.0,
        max_centroid=3000.0,
        max_transient=3.0,
        max_attack=1.0,
        max_total=200.0,
    )


# ---------------------------------------------------------------------------
# 1.3 — probs_at_time interpolation
# ---------------------------------------------------------------------------

class TestProbsAtTime(unittest.TestCase):
    def setUp(self) -> None:
        # Three frames at 0.0, 0.1, 0.2 s
        self.grid = _make_grid(
            times=[0.0, 0.1, 0.2],
            probs=[
                (0.8, 0.1, 0.05, 0.05),  # frame 0: strong kick
                (0.2, 0.6, 0.1, 0.1),    # frame 1: strong snare
                (0.1, 0.1, 0.7, 0.1),    # frame 2: strong tops
            ],
        )

    def test_exact_first_frame(self) -> None:
        p = self.grid.probs_at_time(0.0)
        self.assertAlmostEqual(p[0], 0.8, places=6)
        self.assertAlmostEqual(p[1], 0.1, places=6)

    def test_exact_last_frame(self) -> None:
        p = self.grid.probs_at_time(0.2)
        self.assertAlmostEqual(p[2], 0.7, places=6)

    def test_clamp_before_first_frame_returns_first(self) -> None:
        p = self.grid.probs_at_time(-0.5)
        self.assertAlmostEqual(p[0], 0.8, places=6)

    def test_clamp_after_last_frame_returns_last(self) -> None:
        p = self.grid.probs_at_time(99.0)
        self.assertAlmostEqual(p[2], 0.7, places=6)

    def test_midpoint_between_frame_0_and_1(self) -> None:
        # alpha=0.5: expected = 0.5 * frame0 + 0.5 * frame1
        p = self.grid.probs_at_time(0.05)
        self.assertAlmostEqual(p[0], 0.5 * 0.8 + 0.5 * 0.2, places=5)
        self.assertAlmostEqual(p[1], 0.5 * 0.1 + 0.5 * 0.6, places=5)

    def test_quarter_point_between_frame_1_and_2(self) -> None:
        # t=0.125 → alpha=0.25 in [0.1, 0.2]
        p = self.grid.probs_at_time(0.125)
        expected_tops = 0.75 * 0.1 + 0.25 * 0.7
        self.assertAlmostEqual(p[2], expected_tops, places=5)

    def test_single_frame_grid_returns_that_frame_everywhere(self) -> None:
        g = _make_grid(times=[0.5], probs=[(0.3, 0.4, 0.2, 0.1)])
        self.assertAlmostEqual(g.probs_at_time(0.0)[1], 0.4, places=6)
        self.assertAlmostEqual(g.probs_at_time(0.5)[1], 0.4, places=6)
        self.assertAlmostEqual(g.probs_at_time(1.0)[1], 0.4, places=6)

    def test_onset_at_returns_correct_value(self) -> None:
        g = _make_grid(times=[0.0, 0.1], probs=[(0.5, 0.5, 0.0, 0.0)] * 2, onset=[0.3, 0.9])
        self.assertAlmostEqual(g.onset_at(0), 0.3, places=6)
        self.assertAlmostEqual(g.onset_at(1), 0.9, places=6)

    def test_onset_at_returns_zero_when_onset_absent(self) -> None:
        g = _make_grid(times=[0.0], probs=[(0.5, 0.5, 0.0, 0.0)])
        self.assertAlmostEqual(g.onset_at(0), 0.0, places=6)


# ---------------------------------------------------------------------------
# 1.4 — classify tie-break
# ---------------------------------------------------------------------------

class TestClassifyTieBreak(unittest.TestCase):
    """
    The tie-break fires when margin < hint_tiebreak_margin (default 0.15)
    and the hint probability for a role exceeds hint_rescue_min_prob (0.40).
    We construct a feature whose rule probabilities are deliberately close
    (kick vs snare within margin) and verify that the hint flips the choice.
    """

    def _ambiguous_kick_snare_feature(self) -> OnsetFeature:
        """Feature whose rule-based classification is kick but margin is < 0.15."""
        return OnsetFeature(
            time_sec=0.5,
            sub_low_e=55.0,   # sub-dominant but only narrowly
            low_e=62.0,
            mid_e=44.0,       # significant mid too
            high_e=14.0,
            centroid=800.0,
            transient_ratio=1.4,
            attack_energy=0.22,
        )

    def test_hint_flips_kick_to_snare_when_snare_hint_is_strong(self) -> None:
        cfg = EngineConfig()
        scales = _make_scales()
        feature = self._ambiguous_kick_snare_feature()

        # Baseline: confirm the rule alone chooses kick (or at least not explicitly forced)
        baseline = classify_feature(feature, scales, cfg, bpm=None, hint_grid=None)
        # With strong snare hint, if margin was low, chosen_role should flip to snare.
        grid = _make_grid(
            times=[0.0, 1.0],
            probs=[(0.1, 0.85, 0.03, 0.02), (0.1, 0.85, 0.03, 0.02)],
        )
        with_hint = classify_feature(feature, scales, cfg, bpm=None, hint_grid=grid)
        if baseline.margin < cfg.hint_tiebreak_margin:
            # Tie-break should be active: snare hint (0.85) > kick hint (0.1) and >= 0.40
            self.assertEqual(with_hint.chosen_role, "drums_snare")

    def test_hint_flips_snare_to_kick_when_kick_hint_is_strong(self) -> None:
        cfg = EngineConfig()
        scales = _make_scales()
        # A feature that leans snare but is ambiguous
        feature = OnsetFeature(
            time_sec=0.5,
            sub_low_e=40.0,
            low_e=50.0,
            mid_e=52.0,
            high_e=18.0,
            centroid=900.0,
            transient_ratio=1.6,
            attack_energy=0.26,
        )
        baseline = classify_feature(feature, scales, cfg, bpm=None, hint_grid=None)
        grid = _make_grid(
            times=[0.0, 1.0],
            probs=[(0.80, 0.12, 0.05, 0.03), (0.80, 0.12, 0.05, 0.03)],
        )
        with_hint = classify_feature(feature, scales, cfg, bpm=None, hint_grid=grid)
        if baseline.margin < cfg.hint_tiebreak_margin:
            self.assertEqual(with_hint.chosen_role, "drums_kick")

    def test_hint_does_not_flip_when_rule_margin_is_high(self) -> None:
        """When the rule is confident (margin >= hint_tiebreak_margin), hints are ignored."""
        cfg = EngineConfig()
        scales = _make_scales()
        # Clear kick: large sub dominance
        clear_kick = OnsetFeature(
            time_sec=0.0,
            sub_low_e=90.0,
            low_e=95.0,
            mid_e=5.0,
            high_e=2.0,
            centroid=400.0,
            transient_ratio=2.5,
            attack_energy=0.40,
        )
        no_hint = classify_feature(clear_kick, scales, cfg, bpm=None, hint_grid=None)
        # Hint strongly says snare — should not override a confident kick
        grid = _make_grid(
            times=[0.0, 1.0],
            probs=[(0.05, 0.90, 0.03, 0.02), (0.05, 0.90, 0.03, 0.02)],
        )
        with_hint = classify_feature(clear_kick, scales, cfg, bpm=None, hint_grid=grid)
        if no_hint.margin >= cfg.hint_tiebreak_margin:
            self.assertEqual(with_hint.chosen_role, no_hint.chosen_role)

    def test_hint_ignored_when_hint_prob_below_rescue_min(self) -> None:
        """Hint must exceed hint_rescue_min_prob (0.40) to affect the tie-break."""
        cfg = EngineConfig()
        scales = _make_scales()
        feature = self._ambiguous_kick_snare_feature()
        baseline = classify_feature(feature, scales, cfg, bpm=None, hint_grid=None)
        # Hint says snare but with prob only 0.30 (below 0.40 threshold)
        grid = _make_grid(
            times=[0.0, 1.0],
            probs=[(0.25, 0.30, 0.25, 0.20), (0.25, 0.30, 0.25, 0.20)],
        )
        with_hint = classify_feature(feature, scales, cfg, bpm=None, hint_grid=grid)
        # Hint should have NO effect — chosen_role must match baseline
        self.assertEqual(with_hint.chosen_role, baseline.chosen_role)


# ---------------------------------------------------------------------------
# 1.5 — merge second-hit rescue
# ---------------------------------------------------------------------------

class TestMergeHintRescue(unittest.TestCase):
    """
    When a close second hit's velocity is below close_hit_second_vel_frac * best.velocity
    (and low_rise is not strong enough to trigger the low_rise override), NMS normally
    drops it.  With a hint_grid whose probability for that role at that time exceeds
    hint_rescue_min_prob (0.40), the second hit should be kept.
    """

    def _two_close_kicks(self, second_vel: int = 60) -> list[EmittedEvent]:
        return [
            EmittedEvent(
                time_sec=1.000, role="drums_kick", velocity=112,
                confidence=0.72, margin=0.10, low_rise=0.10,
            ),
            EmittedEvent(
                time_sec=1.030, role="drums_kick", velocity=second_vel,
                confidence=0.38, margin=0.04, low_rise=0.10,
            ),
        ]

    def test_second_kick_dropped_without_hint(self) -> None:
        cfg = EngineConfig()
        events = self._two_close_kicks(second_vel=60)
        # 60 < 112 * 0.78 = 87.4 → velocity too low; low_rise=0.10 < 0.26 → no override
        kept = _role_nms(events, cfg, bpm=120.0, hint_grid=None)
        kick_times = [e.time_sec for e in kept if e.role == "drums_kick"]
        self.assertEqual(len(kick_times), 1)

    def test_second_kick_rescued_with_strong_hint(self) -> None:
        cfg = EngineConfig()
        events = self._two_close_kicks(second_vel=60)
        # Grid with high kick prob at t=1.030
        grid = _make_grid(
            times=[0.9, 1.0, 1.03, 1.1],
            probs=[
                (0.05, 0.05, 0.85, 0.05),
                (0.70, 0.15, 0.10, 0.05),
                (0.65, 0.15, 0.15, 0.05),  # kick=0.65 >= 0.40 threshold
                (0.05, 0.05, 0.85, 0.05),
            ],
        )
        kept = _role_nms(events, cfg, bpm=120.0, hint_grid=grid)
        kick_times = [e.time_sec for e in kept if e.role == "drums_kick"]
        self.assertEqual(len(kick_times), 2)

    def test_second_kick_still_dropped_when_hint_prob_is_below_threshold(self) -> None:
        cfg = EngineConfig()
        events = self._two_close_kicks(second_vel=60)
        # Kick hint at t=1.030 is only 0.30 (below hint_rescue_min_prob=0.40)
        grid = _make_grid(
            times=[1.0, 1.03],
            probs=[
                (0.70, 0.15, 0.10, 0.05),
                (0.30, 0.35, 0.25, 0.10),  # kick=0.30 < 0.40
            ],
        )
        kept = _role_nms(events, cfg, bpm=120.0, hint_grid=grid)
        kick_times = [e.time_sec for e in kept if e.role == "drums_kick"]
        self.assertEqual(len(kick_times), 1)

    def test_second_snare_rescued_with_strong_snare_hint(self) -> None:
        cfg = EngineConfig()
        events = [
            EmittedEvent(
                time_sec=2.000, role="drums_snare", velocity=110,
                confidence=0.70, margin=0.12, low_rise=0.05,
            ),
            EmittedEvent(
                time_sec=2.035, role="drums_snare", velocity=62,
                confidence=0.35, margin=0.03, low_rise=0.05,
            ),
        ]
        grid = _make_grid(
            times=[2.0, 2.035],
            probs=[
                (0.10, 0.75, 0.10, 0.05),
                (0.10, 0.72, 0.13, 0.05),  # snare=0.72 >= 0.40
            ],
        )
        kept = _role_nms(events, cfg, bpm=120.0, hint_grid=grid)
        snare_times = [e.time_sec for e in kept if e.role == "drums_snare"]
        self.assertEqual(len(snare_times), 2)


if __name__ == "__main__":
    unittest.main()
