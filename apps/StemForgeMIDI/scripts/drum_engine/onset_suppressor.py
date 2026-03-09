"""
Phase 4 — Onset-level binary suppressor.

Trains (or loads) two small logistic classifiers on per-onset spectral features:
  kick_clf  : predicts P(onset is a true kick hit)
  snare_clf : predicts P(onset is a true snare hit)

Training labels
---------------
True positives  = onset within MATCH_SEC (80 ms) of any GT kick / snare event
False positives = all other onset candidates

Gate (applied BEFORE classify.py)
-----------------------------------
Keep onset if:
  kick_conf  >= onset_suppressor_min_kick_p  (default 0.65)
  OR snare_conf >= onset_suppressor_min_snare_p (default 0.60)
  OR tops pass-through: high_share >= tops_high_share_min (rule-based, not ML)

Training data
-------------
Only non-STAR clips are used for training (STAR GT uses non-GM pitches 88-94
that do not match our kick_pitches=[35,36] / snare_pitches=[38,40] contract).
Clips must have accessible audio+annotation and be listed in the manifest with
annotation_format == "enst_txt" or kick_pitches/snare_pitches keys.
"""

from __future__ import annotations

import math
import pickle
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .types import OnsetFeature

MATCH_SEC = 0.080       # 80 ms TP tolerance window
MODEL_VERSION = "v2"    # bump to force retrain when feature schema changes
_DEFAULT_MODEL_PATH = Path(__file__).resolve().parent / "onset_suppressor_model.pkl"


# ---------------------------------------------------------------------------
# Feature extraction
# ---------------------------------------------------------------------------

def _fvec(f: "OnsetFeature") -> list[float]:
    """7-dimensional per-onset feature vector (ratio-invariant where possible)."""
    eps = 1e-12
    total = f.sub_low_e + f.mid_e + f.high_e + eps
    sub_share = f.sub_low_e / total
    mid_share = f.mid_e / total
    high_share = f.high_e / total
    sub_mid_ratio = f.sub_low_e / (f.mid_e + eps)
    # log-compress to handle extreme values (reverb tail ratio ~1e9)
    log_tr = math.log(max(f.transient_ratio, 1e-6))
    log_smr = math.log(max(sub_mid_ratio, 1e-6))
    # centroid and attack as raw floats; StandardScaler normalises them
    return [sub_share, mid_share, high_share, log_smr, log_tr, f.centroid, f.attack_energy]


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

class OnsetSuppressor:
    """Pair of logistic classifiers producing (kick_p, snare_p) per onset."""

    def __init__(self, kick_clf, snare_clf, kick_scaler, snare_scaler, version: str = MODEL_VERSION):
        self._kick_clf = kick_clf
        self._snare_clf = snare_clf
        self._kick_scaler = kick_scaler
        self._snare_scaler = snare_scaler
        self.version = version

    def score(self, features: "list[OnsetFeature]") -> list[tuple[float, float]]:
        """Return (kick_p, snare_p) for each feature.  Falls back to (0, 0) on error."""
        if not features:
            return []
        try:
            import numpy as np  # type: ignore[import-not-found]
            X = np.array([_fvec(f) for f in features], dtype=float)
            Xk = self._kick_scaler.transform(X)
            Xs = self._snare_scaler.transform(X)
            kick_probs = self._kick_clf.predict_proba(Xk)[:, 1]
            snare_probs = self._snare_clf.predict_proba(Xs)[:, 1]
            return [(float(k), float(s)) for k, s in zip(kick_probs, snare_probs)]
        except Exception:
            return [(0.0, 0.0)] * len(features)


# ---------------------------------------------------------------------------
# Gate
# ---------------------------------------------------------------------------

def apply_suppressor(
    features: "list[OnsetFeature]",
    suppressor: OnsetSuppressor,
    min_kick_p: float = 0.65,
    min_snare_p: float = 0.60,
    tops_high_share_min: float = 0.36,
) -> "list[OnsetFeature]":
    """
    Filter onset feature list using the suppressor.

    An onset is KEPT when any of the following hold:
      1. kick_p >= min_kick_p          (ML says: this is a real kick)
      2. snare_p >= min_snare_p        (ML says: this is a real snare)
      3. high_share >= tops_high_share_min   (rule-based: clearly a hi-hat/cymbal)

    Everything else is suppressed as a false positive (reverb tail / tom bleed /
    room resonance that the onset detector misfired on).
    """
    scores = suppressor.score(features)
    kept: list[OnsetFeature] = []
    for f, (kick_p, snare_p) in zip(features, scores):
        eps = 1e-12
        total = f.sub_low_e + f.mid_e + f.high_e + eps
        high_share = f.high_e / total
        if kick_p >= min_kick_p or snare_p >= min_snare_p or high_share >= tops_high_share_min:
            kept.append(f)
    return kept


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def _label_onsets(onset_times: list[float], gt_times: list[float]) -> list[int]:
    """Binary TP label: 1 if onset within MATCH_SEC of any GT event, else 0."""
    gt_sorted = sorted(gt_times)
    labels = []
    for t in onset_times:
        lo, hi = 0, len(gt_sorted) - 1
        found = False
        while lo <= hi:
            mid = (lo + hi) // 2
            diff = t - gt_sorted[mid]
            if abs(diff) <= MATCH_SEC:
                found = True
                break
            elif diff > 0:
                lo = mid + 1
            else:
                hi = mid - 1
        labels.append(1 if found else 0)
    return labels


def _load_gt_times(clip: dict, base_dir: Path) -> tuple[list[float], list[float]]:
    """Load kick_gt, snare_gt from a manifest clip dict. Returns ([], []) on failure."""
    from pathlib import Path as _Path
    try:
        midi_path = _Path(clip["midiPath"])
        if not midi_path.is_absolute():
            midi_path = (base_dir / midi_path).resolve()
        if not midi_path.is_file():
            return [], []

        annotation_format = clip.get("annotation_format", "midi")
        kick_labels = clip.get("kick_labels", ["bd"])
        snare_labels = clip.get("snare_labels", ["sd"])
        kick_pitches = clip.get("kick_pitches", [35, 36])
        snare_pitches = clip.get("snare_pitches", [38, 40])

        if annotation_format == "enst_txt":
            kick_gt = _read_enst_times(midi_path, set(kick_labels))
            snare_gt = _read_enst_times(midi_path, set(snare_labels))
        else:
            kick_gt = _read_midi_times(midi_path, set(kick_pitches))
            snare_gt = _read_midi_times(midi_path, set(snare_pitches))

        return kick_gt, snare_gt
    except Exception:
        return [], []


def _read_enst_times(path: Path, labels: set[str]) -> list[float]:
    out: list[float] = []
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parts = line.split()
                if len(parts) >= 2:
                    try:
                        t = float(parts[0])
                        if parts[1] in labels:
                            out.append(t)
                    except ValueError:
                        pass
    except Exception:
        pass
    return sorted(out)


def _read_midi_times(path: Path, pitches: set[int], min_vel: int = 1) -> list[float]:
    out: list[float] = []
    try:
        import pretty_midi  # type: ignore[import-not-found]
        pm = pretty_midi.PrettyMIDI(str(path))
        for inst in pm.instruments:
            if not inst.is_drum:
                continue
            for n in inst.notes:
                if n.velocity >= min_vel and int(n.pitch) in pitches:
                    out.append(float(n.start))
    except Exception:
        pass
    return sorted(out)


def train(
    manifest_path: Path,
    model_path: Path | None = None,
) -> OnsetSuppressor | None:
    """
    Train kick+snare binary classifiers from real-stem manifest.

    Only clips with accessible audio AND known-good GT are used:
      - annotation_format == "enst_txt" (ENST-drums)
      - OR explicit kick_pitches / snare_pitches (A2MD)
    STAR clips (style == "STAR_real") are excluded: their GT uses non-GM pitches.

    Returns None if no training data is available.
    """
    try:
        import numpy as np  # type: ignore[import-not-found]
        from sklearn.linear_model import LogisticRegression  # type: ignore[import-not-found]
        from sklearn.preprocessing import StandardScaler  # type: ignore[import-not-found]
        import librosa  # type: ignore[import-not-found]
    except ImportError as e:
        print(f"[onset_suppressor] skipping train — missing dep: {e}")
        return None

    import json

    if not manifest_path.is_file():
        print(f"[onset_suppressor] manifest not found: {manifest_path}")
        return None

    with open(manifest_path) as f:
        manifest = json.load(f)
    clips = manifest.get("clips", [])
    base_dir = manifest_path.parent

    # Import engine components
    import sys
    _script_dir = Path(__file__).resolve().parent.parent
    if str(_script_dir) not in sys.path:
        sys.path.insert(0, str(_script_dir))

    from drum_engine.config import EngineConfig
    from drum_engine.features import compute_scales, extract_onset_features, filter_by_energy
    from drum_engine.onsets import detect_onset_candidates_with_low_rise

    cfg = EngineConfig()
    SR = 22050

    kick_X: list[list[float]] = []
    kick_y: list[int] = []
    snare_X: list[list[float]] = []
    snare_y: list[int] = []

    TRAINABLE_STYLES = {"ENST_wet_mix", "A2MD_dist0p00"}

    for clip in clips:
        style = clip.get("style", "")
        if style not in TRAINABLE_STYLES:
            continue  # skip STAR (non-GM GT) and any other unknown styles

        audio_path = Path(clip["audioPath"])
        if not audio_path.is_absolute():
            audio_path = (base_dir / audio_path).resolve()
        if not audio_path.is_file():
            print(f"[onset_suppressor] audio not found, skipping: {audio_path}")
            continue

        kick_gt, snare_gt = _load_gt_times(clip, base_dir)
        if not kick_gt and not snare_gt:
            print(f"[onset_suppressor] no GT events, skipping: {clip.get('id')}")
            continue

        print(f"[onset_suppressor] loading {clip.get('id')}  kick_gt={len(kick_gt)}  snare_gt={len(snare_gt)}")
        try:
            y, sr = librosa.load(str(audio_path), sr=SR, mono=True)
        except Exception as e:
            print(f"[onset_suppressor] load failed: {e}")
            continue

        duration_sec = float(len(y)) / sr
        bpm_hint = clip.get("bpm")
        bpm = float(bpm_hint) if bpm_hint and bpm_hint > 0 else 120.0

        try:
            onset_times, _, _ = detect_onset_candidates_with_low_rise(
                y, sr, duration_sec=duration_sec, bpm=bpm, cfg=cfg
            )
        except Exception as e:
            print(f"[onset_suppressor] onset detection failed: {e}")
            continue

        if not onset_times:
            continue

        feats = extract_onset_features(y, sr, onset_times, cfg)
        scales = compute_scales(feats)
        feats = filter_by_energy(feats, scales, cfg)
        if not feats:
            continue

        times = [f.time_sec for f in feats]
        kick_labels = _label_onsets(times, kick_gt)
        snare_labels = _label_onsets(times, snare_gt)
        fvecs = [_fvec(f) for f in feats]

        kick_X.extend(fvecs)
        kick_y.extend(kick_labels)
        snare_X.extend(fvecs)
        snare_y.extend(snare_labels)

        print(
            f"[onset_suppressor]   onsets={len(feats)}  "
            f"kick TP={sum(kick_labels)} FP={sum(1 for l in kick_labels if l == 0)}  "
            f"snare TP={sum(snare_labels)} FP={sum(1 for l in snare_labels if l == 0)}"
        )

    if not kick_X:
        print("[onset_suppressor] no training data collected; skipping model save")
        return None

    kick_X_np = np.array(kick_X, dtype=float)
    snare_X_np = np.array(snare_X, dtype=float)
    kick_y_np = np.array(kick_y, dtype=int)
    snare_y_np = np.array(snare_y, dtype=int)

    # Guard: need at least one positive example per class
    if kick_y_np.sum() < 1 or (len(kick_y_np) - kick_y_np.sum()) < 1:
        print("[onset_suppressor] kick labels are all one class; cannot train kick_clf")
        return None
    if snare_y_np.sum() < 1 or (len(snare_y_np) - snare_y_np.sum()) < 1:
        print("[onset_suppressor] snare labels are all one class; cannot train snare_clf")
        return None

    kick_scaler = StandardScaler().fit(kick_X_np)
    snare_scaler = StandardScaler().fit(snare_X_np)

    kick_clf = LogisticRegression(
        C=1.0, max_iter=1000, class_weight="balanced", solver="lbfgs"
    ).fit(kick_scaler.transform(kick_X_np), kick_y_np)
    snare_clf = LogisticRegression(
        C=1.0, max_iter=1000, class_weight="balanced", solver="lbfgs"
    ).fit(snare_scaler.transform(snare_X_np), snare_y_np)

    print(
        f"[onset_suppressor] trained  "
        f"kick pos_rate={kick_y_np.mean():.2f}  snare pos_rate={snare_y_np.mean():.2f}"
    )

    suppressor = OnsetSuppressor(
        kick_clf=kick_clf,
        snare_clf=snare_clf,
        kick_scaler=kick_scaler,
        snare_scaler=snare_scaler,
        version=MODEL_VERSION,
    )

    if model_path:
        model_path.parent.mkdir(parents=True, exist_ok=True)
        with open(model_path, "wb") as f:
            pickle.dump(
                {
                    "version": MODEL_VERSION,
                    "kick_clf": kick_clf,
                    "snare_clf": snare_clf,
                    "kick_scaler": kick_scaler,
                    "snare_scaler": snare_scaler,
                },
                f,
            )
        print(f"[onset_suppressor] model saved → {model_path}")

    return suppressor


# ---------------------------------------------------------------------------
# Load or train
# ---------------------------------------------------------------------------

def load_or_train(
    manifest_path: Path,
    model_path: Path | None = None,
) -> OnsetSuppressor | None:
    """
    Load a cached model from model_path; train from manifest if missing or stale.

    Returns None if training fails (e.g. no usable data, missing deps).
    Failure is non-fatal: caller should fall back to no suppressor.
    """
    _model_path = model_path or _DEFAULT_MODEL_PATH

    # Try loading existing model
    if _model_path.is_file():
        try:
            with open(_model_path, "rb") as f:
                d = pickle.load(f)
            if d.get("version") == MODEL_VERSION:
                return OnsetSuppressor(
                    kick_clf=d["kick_clf"],
                    snare_clf=d["snare_clf"],
                    kick_scaler=d["kick_scaler"],
                    snare_scaler=d["snare_scaler"],
                    version=d["version"],
                )
        except Exception:
            pass  # stale or corrupt — retrain

    # Train from scratch
    return train(manifest_path, _model_path)
