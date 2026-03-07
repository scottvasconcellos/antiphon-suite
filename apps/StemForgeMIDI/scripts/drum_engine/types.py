from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


RoleName = Literal["drums_kick", "drums_snare", "drums_tops", "drums_perc"]
ROLE_ORDER: tuple[RoleName, ...] = ("drums_kick", "drums_snare", "drums_tops", "drums_perc")


@dataclass(frozen=True)
class OnsetFeature:
    time_sec: float
    sub_low_e: float
    low_e: float
    mid_e: float
    high_e: float
    centroid: float
    transient_ratio: float
    attack_energy: float

    @property
    def total_band_e(self) -> float:
        return self.sub_low_e + self.mid_e + self.high_e


@dataclass(frozen=True)
class FeatureScales:
    max_low: float
    max_mid: float
    max_centroid: float
    max_transient: float
    max_attack: float
    max_total: float


@dataclass(frozen=True)
class RolePosterior:
    time_sec: float
    low_e: float
    mid_e: float
    sub_share: float
    mid_share: float
    sub_mid_ratio: float
    kick_p: float
    snare_p: float
    tops_p: float
    perc_p: float
    chosen_role: RoleName
    chosen_p: float
    runner_up_p: float = 0.0
    margin: float = 0.0
    low_rise: float = 0.0
    low_origin: bool = True  # True when onset confirmed by low-band (kick-biased) stream


@dataclass(frozen=True)
class EmittedEvent:
    time_sec: float
    role: RoleName
    velocity: int
    confidence: float = 1.0
    margin: float = 0.0
    sub_share: float = 0.0
    mid_share: float = 0.0
    low_rise: float = 0.0
