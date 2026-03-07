from __future__ import annotations

"""
ML backend v0 — minimal hint generator for the drum engine.

This module trains and runs a very small scikit-learn model on synthetic packs
(.internal_eval/packs) to produce BackendHintGrid-compatible .npz files.

It is intentionally simple and offline-only; see .internal_eval/ML_BACKEND_V0_SPEC.md.
"""

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Literal

import numpy as np

APP_ROOT = Path(__file__).resolve().parents[1]
PACKS_DIR = APP_ROOT / ".internal_eval" / "packs"
MODEL_DIR = APP_ROOT / "python-tools" / "ml_backend_models"
MODEL_PATH = MODEL_DIR / "drum_hint_model_v0.npz"


RoleName = Literal["drums_kick", "drums_snare"]


@dataclass
class BackendModelV0:
    """Tiny per-role logistic model on log-mel frames."""

    roles: tuple[RoleName, ...]
    W: np.ndarray  # shape (R, D)
    b: np.ndarray  # shape (R,)
    n_mels: int
    hop_length: int
    sr: int

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        np.savez_compressed(
            str(path),
            roles=np.array(self.roles, dtype="object"),
            W=self.W,
            b=self.b,
            n_mels=np.int32(self.n_mels),
            hop_length=np.int32(self.hop_length),
            sr=np.int32(self.sr),
        )

    @classmethod
    def load(cls, path: Path) -> "BackendModelV0":
        arr = np.load(str(path), allow_pickle=True)
        roles = tuple(arr["roles"].tolist())
        return cls(
            roles=roles,  # type: ignore[arg-type]
            W=arr["W"],
            b=arr["b"],
            n_mels=int(arr["n_mels"]),
            hop_length=int(arr["hop_length"]),
            sr=int(arr["sr"]),
        )

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Return per-frame probabilities in [0, 1] of shape (T, R)."""
        z = X @ self.W.T + self.b[None, :]
        return 1.0 / (1.0 + np.exp(-z))


def _frame_labels_for_times(
    frame_times: np.ndarray,
    hit_times: Iterable[float],
    match_sec: float,
) -> np.ndarray:
    """Assign 1 to frames within match_sec of any hit time, else 0."""
    hits = np.array(list(hit_times), dtype=float)
    if hits.size == 0:
        return np.zeros_like(frame_times, dtype=np.float32)
    labels = np.zeros_like(frame_times, dtype=np.float32)
    for h in hits:
        labels[np.abs(frame_times - h) <= match_sec] = 1.0
    return labels


def _extract_features_for_pack(
    wav_path: Path,
    sr: int = 22050,
    n_mels: int = 80,
    hop_length: int = 256,
) -> tuple[np.ndarray, np.ndarray]:
    """Return (frame_times_sec, log_mel_features[T, D])."""
    import librosa

    y, _sr = librosa.load(str(wav_path), sr=sr, mono=True)
    if y.size == 0:
        return np.zeros(0, dtype=float), np.zeros((0, n_mels), dtype=np.float32)
    S = librosa.feature.melspectrogram(
        y=y,
        sr=sr,
        n_mels=n_mels,
        hop_length=hop_length,
        power=2.0,
    )
    S_db = librosa.power_to_db(S, ref=np.max)
    feats = (S_db.T.astype(np.float32) + 80.0) / 80.0  # normalize roughly to [0, 1]
    times = librosa.frames_to_time(np.arange(feats.shape[0]), sr=sr, hop_length=hop_length)
    return times.astype(float), feats


def train_from_packs(match_sec: float = 0.08) -> BackendModelV0 | None:
    """Train a tiny backend model from synthetic packs; returns model or None."""
    if not PACKS_DIR.is_dir():
        return None

    sr = 22050
    n_mels = 80
    hop_length = 256
    X_list: list[np.ndarray] = []
    Y_list: list[np.ndarray] = []

    key_files = sorted(PACKS_DIR.glob("*_key.json"))
    if not key_files:
        return None

    for kf in key_files:
        with open(kf) as f:
            key = json.load(f)
        pid = key["id"]
        wav_path = PACKS_DIR / f"{pid}.wav"
        if not wav_path.is_file():
            continue
        frame_times, feats = _extract_features_for_pack(wav_path, sr=sr, n_mels=n_mels, hop_length=hop_length)
        if feats.size == 0:
            continue
        y_kick = _frame_labels_for_times(frame_times, key.get("kick_times", []), match_sec)
        y_snare = _frame_labels_for_times(frame_times, key.get("snare_times", []), match_sec)
        Y = np.stack([y_kick, y_snare], axis=1)  # (T, 2)
        X_list.append(feats)
        Y_list.append(Y)

    if not X_list:
        return None

    X = np.concatenate(X_list, axis=0)
    Y = np.concatenate(Y_list, axis=0)

    # Add small L2-regularized logistic regression via gradient descent.
    roles: tuple[RoleName, ...] = ("drums_kick", "drums_snare")
    R = len(roles)
    D = X.shape[1]
    W = np.zeros((R, D), dtype=np.float32)
    b = np.zeros(R, dtype=np.float32)

    lr = 0.05
    reg = 5e-4
    n_epochs = 20
    batch_size = 2048

    for _epoch in range(n_epochs):
        idx = np.random.permutation(X.shape[0])
        X_sh = X[idx]
        Y_sh = Y[idx]
        for start in range(0, X_sh.shape[0], batch_size):
            end = min(start + batch_size, X_sh.shape[0])
            xb = X_sh[start:end]
            yb = Y_sh[start:end]
            z = xb @ W.T + b[None, :]
            p = 1.0 / (1.0 + np.exp(-z))
            grad_z = (p - yb) / float(end - start)
            grad_W = grad_z.T @ xb + reg * W
            grad_b = grad_z.sum(axis=0)
            W -= lr * grad_W.astype(np.float32)
            b -= lr * grad_b.astype(np.float32)

    model = BackendModelV0(roles=roles, W=W, b=b, n_mels=n_mels, hop_length=hop_length, sr=sr)
    return model


def cli_train() -> None:
    """Train model and persist to MODEL_PATH."""
    model = train_from_packs()
    if model is None:
        print("No training data found in .internal_eval/packs; aborting.", flush=True)
        return
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model.save(MODEL_PATH)
    print(f"Saved backend model v0 to {MODEL_PATH}", flush=True)


def cli_infer(audio_path: str, out_path: str | None = None) -> None:
    """Run backend on one audio file and write a BackendHintGrid-style .npz."""
    if not MODEL_PATH.is_file():
        print(f"Model not found at {MODEL_PATH}. Run cli_train() first.", flush=True)
        return
    model = BackendModelV0.load(MODEL_PATH)
    wav = Path(audio_path).resolve()
    if not wav.is_file():
        print(f"Audio not found: {wav}", flush=True)
        return

    frame_times, feats = _extract_features_for_pack(
        wav, sr=model.sr, n_mels=model.n_mels, hop_length=model.hop_length
    )
    if feats.size == 0:
        print("No frames extracted; not writing hints.", flush=True)
        return

    probs_roles = model.predict_proba(feats).astype(np.float32)  # (T, 2)
    # Map to [kick, snare, tops, perc]; tops/perc left at zero for v0.
    T = probs_roles.shape[0]
    probs = np.zeros((T, 4), dtype=np.float32)
    probs[:, 0] = probs_roles[:, 0]  # kick
    probs[:, 1] = probs_roles[:, 1]  # snare

    onset = probs_roles.max(axis=1).astype(np.float32)

    out_npz = Path(out_path) if out_path else wav.with_name(f"{wav.stem}_backend_hints.npz")
    np.savez_compressed(
        str(out_npz),
        times_sec=frame_times.astype(np.float32),
        probs=probs,
        onset=onset,
        sample_rate_hz=np.int32(model.sr),
        hop_sec=np.float32(model.hop_length / float(model.sr)),
        version="v0.1",
    )
    print(f"Wrote backend hints to {out_npz}", flush=True)


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description="ML backend v0 (train or infer).")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("train", help="Train backend model from synthetic packs.")

    inf = sub.add_parser("infer", help="Run backend on one audio file.")
    inf.add_argument("audio_path", type=str)
    inf.add_argument("--out", type=str, default=None, help="Output .npz path (default: alongside audio)")

    args = ap.parse_args()
    if args.cmd == "train":
        cli_train()
    elif args.cmd == "infer":
        cli_infer(args.audio_path, args.out)

