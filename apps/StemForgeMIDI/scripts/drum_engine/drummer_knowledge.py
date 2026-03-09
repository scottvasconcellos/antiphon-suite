"""
DrummerKnowledgeRescue — genre-agnostic top-down musical priors.

Modifies a BackendHintGrid's per-frame probabilities using structural knowledge
derived from systematic musicology research on groove patterns:

  Rule 1 — Backbeat snare prior
    Snare on beats 2 and 4 is the most universal pattern across all major
    genres (EDM, rock, funk, hip-hop, country, punk, pop, metal, Afrobeat,
    reggae rockers). At times within dk_backbeat_tol_frac of a backbeat, boost
    snare prob when the hint margin is below dk_backbeat_max_margin.
    Source: Tables 1–5, §2.1–2.12, Systematic Musicology Groove Analysis (2026).

  Rule 2 — Downbeat kick prior
    Kick on beat 1 (and beat 3) is universal across all genres. Boost kick
    prob at those grid positions when the model already suggests kick (> min_p).
    Source: Drum comparative matrix §3.1, Comprehensive Analysis (2026).

  Rule 3 — Fast-run snare/tops inference
    ≥ dk_fast_run_min_hits onsets within dk_fast_run_window_sec with low kick
    probability → this is a hi-hat roll, snare ghost-note run, or trap hat
    pattern, not a kick cluster. Boost snare at those onset positions.
    Source: Trap hi-hat rolls §2.2.1, funk ghost notes §2.5.1 (Comprehensive).

All boosts are additive clipped to [0, 1].  The returned grid is a new frozen
BackendHintGrid; the input is never mutated.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import numpy as np

if TYPE_CHECKING:
    from .backend_hint import BackendHintGrid
    from .config import EngineConfig


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _rebuild(grid: "BackendHintGrid", probs4: np.ndarray) -> "BackendHintGrid":
    """Construct a new BackendHintGrid from a modified (T, 4) array."""
    from .backend_hint import BackendHintGrid as _Grid

    T = probs4.shape[0]
    new_probs: tuple[tuple[float, float, float, float], ...] = tuple(
        (float(probs4[i, 0]), float(probs4[i, 1]), float(probs4[i, 2]), float(probs4[i, 3]))
        for i in range(T)
    )
    new_onset: tuple[float, ...] = tuple(float(probs4[i, :3].max()) for i in range(T))
    return _Grid(
        times_sec=grid.times_sec,
        probs=new_probs,
        onset=new_onset,
        sample_rate_hz=grid.sample_rate_hz,
        hop_sec=grid.hop_sec,
        version=grid.version + "+dk",
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def apply_drummer_knowledge(
    hint_grid: "BackendHintGrid",
    bpm: float,
    onset_times: list[float],
    cfg: "EngineConfig",
) -> "BackendHintGrid":
    """
    Apply drummer knowledge rules to hint_grid and return a modified copy.

    Parameters
    ----------
    hint_grid   : source BackendHintGrid (not mutated)
    bpm         : audio BPM (estimated or explicit)
    onset_times : onset detector output times (after grid filter)
    cfg         : EngineConfig with dk_* constants

    Returns
    -------
    A new BackendHintGrid with per-frame probs adjusted by the rules above.
    Returns hint_grid unchanged if bpm <= 0 or grid is empty.
    """
    if bpm <= 0 or hint_grid.num_frames() == 0:
        return hint_grid

    beat_sec = 60.0 / bpm
    times = np.array(hint_grid.times_sec, dtype=np.float64)
    probs4 = np.array(hint_grid.probs, dtype=np.float32)  # (T, 4)

    # ── Rule 1: Backbeat snare prior ─────────────────────────────────────────
    # Universal across EDM, rock, funk, country, punk, pop, metal: snare on
    # beats 2 and 4.  In a 2-beat cycle these are the ODD-numbered beats.
    # Tolerance window: dk_backbeat_tol_frac * beat_sec (default ≈ 5%).
    tol_sec = cfg.dk_backbeat_tol_frac * beat_sec
    for i, t in enumerate(times):
        # nearest beat index (0-based) and distance from it
        beat_n = int(round(t / beat_sec))
        dist = abs(t - beat_n * beat_sec)
        if dist > tol_sec:
            continue
        # backbeat = odd beat numbers (beat 2, 4, 6, …)
        if beat_n % 2 != 1:
            continue
        k, s, tp, p = float(probs4[i, 0]), float(probs4[i, 1]), float(probs4[i, 2]), float(probs4[i, 3])
        best_other = max(k, tp, p)
        margin = s - best_other
        if margin < cfg.dk_backbeat_max_margin:
            # Ambiguous or snare is not winning — give it a push.
            probs4[i, 1] = min(1.0, s + cfg.dk_backbeat_boost)

    # ── Rule 2: Downbeat kick prior ──────────────────────────────────────────
    # Kick on beats 1 and 3 (even beat numbers in 2-beat cycle).
    # Only applied when the model already has non-trivial kick evidence
    # (avoids manufacturing kicks on hi-hat-only frames).
    for i, t in enumerate(times):
        beat_n = int(round(t / beat_sec))
        dist = abs(t - beat_n * beat_sec)
        if dist > tol_sec:
            continue
        if beat_n % 2 != 0:
            continue
        k = float(probs4[i, 0])
        if k >= cfg.dk_kick_downbeat_min_p:
            probs4[i, 0] = min(1.0, k + cfg.dk_kick_downbeat_boost)

    # ── Rule 3: Fast-run snare/tops inference ────────────────────────────────
    # A cluster of ≥ dk_fast_run_min_hits onsets within dk_fast_run_window_sec
    # with no dominant kick evidence is a hi-hat roll or snare ghost-note run
    # (trap, funk, Afrobeat).  Boost snare prob for each onset in the cluster.
    if len(onset_times) > cfg.dk_fast_run_min_hits:
        onsets_arr = np.array(sorted(onset_times), dtype=np.float64)
        win = cfg.dk_fast_run_window_sec
        for t_on in onsets_arr:
            n_in_win = int(np.sum((onsets_arr >= t_on) & (onsets_arr < t_on + win)))
            if n_in_win < cfg.dk_fast_run_min_hits:
                continue
            idx = int(np.argmin(np.abs(times - t_on)))
            k = float(probs4[idx, 0])
            s = float(probs4[idx, 1])
            if k < cfg.dk_fast_run_kick_max:
                # Likely a roll or ghost-note run — nudge toward snare.
                probs4[idx, 1] = min(1.0, s + cfg.dk_fast_run_snare_boost)

    return _rebuild(hint_grid, probs4)
