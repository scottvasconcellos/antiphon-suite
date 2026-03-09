"""
ML backend v0 — inference wrapper.

Loads (or auto-trains) the drum hint model (logistic regression on log-mel
features) and returns a 4-lane BackendHintGrid.

Lanes: [kick, snare, tops, perc] per BACKEND_HINT_SPEC.md.

The model is trained offline on synthetic packs (.internal_eval/packs).
If the saved model is absent or is the legacy 2-role version, it is
automatically re-trained and saved before inference.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

from .backend_hint import BackendHintGrid, backend_hint_from_numpy

APP_ROOT = Path(__file__).resolve().parents[2]
_PYTOOLS = APP_ROOT / "python-tools"
MODEL_PATH = APP_ROOT / "python-tools" / "ml_backend_models" / "drum_hint_model_v0.npz"
PACKS_DIR = APP_ROOT / ".internal_eval" / "packs"


def _add_pytools() -> None:
    s = str(_PYTOOLS)
    if s not in sys.path:
        sys.path.insert(0, s)


def _load_or_train():
    """
    Return a 3-role BackendModelV0 (kick/snare/tops), training if necessary.
    Returns None on failure.
    """
    _add_pytools()
    try:
        from ml_backend_v0 import BackendModelV0, train_from_packs
    except ImportError:
        return None

    # Load saved model only if it has all 3 roles (tops was added in v0.2).
    if MODEL_PATH.is_file():
        try:
            model = BackendModelV0.load(MODEL_PATH)
            if "drums_tops" in model.roles:
                return model
            # Legacy 2-role model — fall through and retrain.
        except Exception:
            pass

    if not PACKS_DIR.is_dir():
        return None

    try:
        model = train_from_packs()
        if model is None:
            return None
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        model.save(MODEL_PATH)
        return model
    except Exception:
        return None


def run_inference(audio_path: Path) -> BackendHintGrid | None:
    """
    Run backend v0 on audio_path.
    Returns a 4-lane BackendHintGrid or None on any failure.
    """
    try:
        _add_pytools()
        from ml_backend_v0 import _extract_features_for_pack

        model = _load_or_train()
        if model is None:
            return None

        frame_times, feats = _extract_features_for_pack(
            audio_path, sr=model.sr, n_mels=model.n_mels, hop_length=model.hop_length
        )
        if feats.size == 0:
            return None

        T = feats.shape[0]
        probs_roles = model.predict_proba(feats)  # (T, R) where R=3
        roles = list(model.roles)
        hop_sec = float(model.hop_length) / float(model.sr)

        # Map to 4 lanes: [kick, snare, tops, perc].
        probs4 = np.zeros((T, 4), dtype=np.float32)
        for lane_idx, role in enumerate(["drums_kick", "drums_snare", "drums_tops"]):
            if role in roles:
                probs4[:, lane_idx] = np.clip(probs_roles[:, roles.index(role)], 0.0, 1.0)

        # perc = residual headroom from the dominant lane.
        probs4[:, 3] = np.clip(1.0 - probs4[:, :3].max(axis=1), 0.0, 1.0)

        onset = probs4[:, :3].max(axis=1).astype(np.float32)

        return backend_hint_from_numpy(
            times_sec=frame_times,
            probs=probs4,
            onset=onset,
            sample_rate_hz=model.sr,
            hop_sec=hop_sec,
            version="v0.2",
        )
    except Exception:
        return None
