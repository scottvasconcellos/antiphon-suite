"""
backend_omnizart.py — Real Omnizart drum transcription backend.

Uses Omnizart 0.1.0 (MIT) with the bundled drum_keras checkpoint loaded via
ONNX runtime. This avoids TF/Keras version conflicts entirely.

Pipeline:
  1. extract_patch_cqt(audio) — librosa CQT patch features (our madmom shim)
  2. ONNX inference on drum_keras/model.onnx — (N, 13) activations per mini-beat
  3. Map 13 classes → 4-lane [kick, snare, tops, perc] probabilities
  4. Return BackendHintGrid

The 13-class → 3 instrument reduction matches Omnizart's inference.py:
  kick = class 0
  snare = class 1
  tops = max(class 4, class 5, class 6)
  perc = residual headroom

ONNX model weights downloaded from:
  https://github.com/Music-and-Culture-Technology-Lab/omnizart/releases/tag/checkpoints-20211001
"""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np

from .backend_hint import BackendHintGrid, backend_hint_from_numpy

# Set Keras 2 compatibility before importing omnizart
os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")

APP_ROOT = Path(__file__).resolve().parents[2]

_OMNIZART_ONNX_PATH: Path | None = None
_MINI_BEAT_PER_SEG = 4
_BATCH_SIZE = 32


def _find_onnx_model() -> Path | None:
    """Locate the Omnizart drum ONNX model checkpoint."""
    try:
        import omnizart as _omz
        candidate = Path(_omz.MODULE_PATH) / "checkpoints" / "drum" / "drum_keras" / "model.onnx"
        if candidate.is_file():
            return candidate
    except Exception:
        pass
    # Fallback: check app-local copy
    local = APP_ROOT / "python-tools" / "ml_backend_models" / "omnizart_drum.onnx"
    if local.is_file():
        return local
    return None


def _load_session():
    """Load (and cache) the ONNX runtime inference session."""
    global _OMNIZART_ONNX_PATH
    if _OMNIZART_ONNX_PATH is None:
        _OMNIZART_ONNX_PATH = _find_onnx_model()
    if _OMNIZART_ONNX_PATH is None:
        return None, None
    try:
        import onnxruntime as ort
        sess = ort.InferenceSession(str(_OMNIZART_ONNX_PATH))
        input_name = sess.get_inputs()[0].name
        return sess, input_name
    except Exception:
        return None, None


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(x, -20, 20)))


def _normalize_cols(arr: np.ndarray) -> np.ndarray:
    """Normalize each column to [0, 1] range."""
    out = np.zeros_like(arr)
    for j in range(arr.shape[1]):
        col = arr[:, j]
        lo, hi = col.min(), col.max()
        if hi > lo:
            out[:, j] = (col - lo) / (hi - lo)
        else:
            out[:, j] = 0.0
    return out


def run_inference(audio_path: Path) -> BackendHintGrid | None:
    """
    Run real Omnizart drum inference on audio_path.

    Returns 4-lane BackendHintGrid [kick, snare, tops, perc] or None on failure.
    Uses the ONNX drum_keras checkpoint trained on ENST/E-GMD/MDB real drum data.
    """
    try:
        sess, input_name = _load_session()
        if sess is None:
            return None

        # ---- Feature extraction ------------------------------------------------
        # extract_patch_cqt uses our librosa-based beat_for_drum shim (no madmom)
        from omnizart.feature.wrapper_func import extract_patch_cqt
        from omnizart.drum.prediction import create_batches, merge_batches

        patch_cqt, mini_beat_arr = extract_patch_cqt(str(audio_path))
        if patch_cqt.shape[0] == 0:
            return None

        # ---- ONNX inference ----------------------------------------------------
        batches, pad_size = create_batches(patch_cqt, _MINI_BEAT_PER_SEG, b_size=_BATCH_SIZE)
        batch_preds = []
        for batch in batches:
            out = sess.run(None, {input_name: batch.astype(np.float32)})[0]
            batch_preds.append(out)

        pred = merge_batches(np.array(batch_preds))  # (N+pad, 13)
        if pad_size > 0:
            pred = pred[:-pad_size]
        # pred shape: (N, 13) — raw activations per mini-beat

        # ---- Map 13 classes → 4 lanes ------------------------------------------
        # Normalize raw activations column-wise to get probabilities in [0, 1]
        norm_pred = _normalize_cols(pred.astype(np.float32))  # (N, 13)

        probs4 = np.zeros((len(pred), 4), dtype=np.float32)
        probs4[:, 0] = norm_pred[:, 0]                                          # kick
        probs4[:, 1] = norm_pred[:, 1]                                          # snare
        probs4[:, 2] = np.max(norm_pred[:, 4:7], axis=1)                        # tops (classes 4-6)
        probs4[:, 3] = np.clip(1.0 - probs4[:, :3].max(axis=1), 0.0, 1.0)      # perc (residual)
        probs4 = np.clip(probs4, 0.0, 1.0)

        onset = probs4[:, :3].max(axis=1).astype(np.float32)

        # ---- Build BackendHintGrid ---------------------------------------------
        times_sec = mini_beat_arr.astype(float)
        if len(times_sec) != len(probs4):
            # Trim to matching length (pad_size may cause mismatch)
            n = min(len(times_sec), len(probs4))
            times_sec = times_sec[:n]
            probs4 = probs4[:n]
            onset = onset[:n]

        if len(times_sec) < 2:
            return None

        hop_sec = float(np.median(np.diff(times_sec)))

        return backend_hint_from_numpy(
            times_sec=times_sec,
            probs=probs4,
            onset=onset,
            sample_rate_hz=int(round(1.0 / hop_sec)) if hop_sec > 0 else 100,
            hop_sec=hop_sec,
            version="omnizart_onnx_v1",
        )

    except Exception:
        return None
