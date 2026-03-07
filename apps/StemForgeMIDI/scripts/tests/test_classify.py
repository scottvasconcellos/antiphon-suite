from __future__ import annotations

import unittest

from .helpers import SCRIPT_DIR
from drum_engine.classify import classify_feature
from drum_engine.config import EngineConfig
from drum_engine.types import FeatureScales, OnsetFeature


class TestClassify(unittest.TestCase):
    def test_classify_feature_returns_normalized_posteriors_and_expected_role(self) -> None:
        cfg = EngineConfig()
        scales = FeatureScales(
            max_low=100.0,
            max_mid=100.0,
            max_centroid=3000.0,
            max_transient=3.0,
            max_attack=1.0,
            max_total=200.0,
        )

        kick_like = OnsetFeature(
            time_sec=0.0,
            sub_low_e=90.0,
            low_e=95.0,
            mid_e=8.0,
            high_e=4.0,
            centroid=700.0,
            transient_ratio=0.8,
            attack_energy=0.15,
        )
        snare_like = OnsetFeature(
            time_sec=0.5,
            sub_low_e=10.0,
            low_e=32.0,
            mid_e=48.0,
            high_e=20.0,
            centroid=1900.0,
            transient_ratio=1.8,
            attack_energy=0.32,
        )

        k = classify_feature(kick_like, scales, cfg, bpm=120.0)
        s = classify_feature(snare_like, scales, cfg, bpm=120.0)

        self.assertLess(abs((k.kick_p + k.snare_p + k.tops_p + k.perc_p) - 1.0), 1e-6)
        self.assertLess(abs((s.kick_p + s.snare_p + s.tops_p + s.perc_p) - 1.0), 1e-6)
        self.assertEqual(k.chosen_role, "drums_kick")
        self.assertEqual(s.chosen_role, "drums_snare")

    def test_frequency_gate_demotes_kick_when_sub_share_below_gate(self) -> None:
        """Phase 1 A: when kick_gate_min_sub_share > 0 and sub_share is weak, do not assign kick."""
        cfg = EngineConfig(kick_gate_min_sub_share=0.38)
        scales = FeatureScales(
            max_low=100.0,
            max_mid=100.0,
            max_centroid=3000.0,
            max_transient=3.0,
            max_attack=1.0,
            max_total=200.0,
        )
        # Kick-like ratios but sub_share only 0.30 (below gate 0.38) -> should demote to snare or other.
        weak_kick = OnsetFeature(
            time_sec=0.0,
            sub_low_e=36.0,
            low_e=70.0,
            mid_e=28.0,
            high_e=6.0,
            centroid=800.0,
            transient_ratio=1.0,
            attack_energy=0.2,
        )
        p = classify_feature(weak_kick, scales, cfg, bpm=None)
        self.assertNotEqual(p.chosen_role, "drums_kick")

    def test_frequency_gate_demotes_snare_when_mid_share_below_gate(self) -> None:
        """Phase 1 A: when snare_gate_min_mid_share > 0 and mid_share is weak, do not assign snare."""
        cfg = EngineConfig(snare_gate_min_mid_share=0.25)
        scales = FeatureScales(
            max_low=100.0,
            max_mid=100.0,
            max_centroid=3000.0,
            max_transient=3.0,
            max_attack=1.0,
            max_total=200.0,
        )
        # Snare-like but mid_share only 0.15 (below gate 0.25) -> should demote.
        weak_snare = OnsetFeature(
            time_sec=0.5,
            sub_low_e=30.0,
            low_e=40.0,
            mid_e=18.0,
            high_e=32.0,
            centroid=2000.0,
            transient_ratio=1.5,
            attack_energy=0.28,
        )
        p = classify_feature(weak_snare, scales, cfg, bpm=None)
        self.assertNotEqual(p.chosen_role, "drums_snare")


if __name__ == "__main__":
    unittest.main()
