#!/usr/bin/env python3
"""
midi_to_clone.py — FOSS stack contract (see docs/FOSS_AND_LOCAL_LLM_STACK.md).

In:  JSON on stdin or single arg: { "midiPath": "<path>", "modelId": "<id>", "refAudioPath?": "<path>" }
Out: JSON on stdout: { "clonePath": "<path>" }
     On error: JSON on stderr { "error": "..." }, exit 1.

Requires RAVE (or compatible) in a separate venv. See scripts/requirements-clone.txt.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def emit_error(msg: str) -> None:
    print(json.dumps({"error": msg}), file=sys.stderr)
    sys.exit(1)


def read_input() -> dict:
    raw: str
    if len(sys.argv) >= 2:
        raw = sys.argv[1]
    else:
        raw = sys.stdin.read()
    if not raw or not raw.strip():
        emit_error(
            'Missing input: provide JSON { "midiPath": "...", "modelId": "..." } on stdin or as first argument'
        )
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        emit_error(f"Invalid JSON: {e}")
    if not isinstance(data, dict):
        emit_error("Input must be a JSON object")
    return data


def main() -> None:
    data = read_input()
    midi_path_str = data.get("midiPath")
    model_id = data.get("modelId")
    if not midi_path_str or not isinstance(midi_path_str, str):
        emit_error("Missing or invalid key: midiPath")
    if not model_id or not isinstance(model_id, str):
        emit_error("Missing or invalid key: modelId")

    midi_path = Path(midi_path_str).resolve()
    if not midi_path.exists() or not midi_path.is_file():
        emit_error(f"midiPath does not exist or is not a file: {midi_path}")

    rave_model_path = os.environ.get("RAVE_MODEL_PATH") or os.environ.get("RAVE_MODEL")
    ref_audio_path = data.get("refAudioPath")
    if isinstance(ref_audio_path, str):
        ref_audio_path = Path(ref_audio_path).resolve()
        if not ref_audio_path.exists() or not ref_audio_path.is_file():
            emit_error(f"refAudioPath does not exist or is not a file: {ref_audio_path}")
    else:
        ref_audio_path = None

    # HeartMuLa: optional backend; router may select it from allowlist
    if model_id.strip().lower() == "heartmula":
        emit_error(
            "HeartMuLa is in the allowlist but not wired in midi_to_clone.py. To enable: set "
            "HEARTMULA_SCRIPT to a script path and implement the call in this script (MIDI + ref → clone WAV). "
            "See docs/FOSS_AND_LOCAL_LLM_STACK.md §2.4. Use a RAVE modelId (e.g. rave-guitar) for now."
        )

    if not rave_model_path or not Path(rave_model_path).exists():
        emit_error(
            "midi_to_clone requires RAVE for non-HeartMuLa models. Set RAVE_MODEL_PATH to a trained "
            "model checkpoint (.ckpt). See docs/STEM_FORGE_RUNBOOK.md."
        )

    output_path = midi_path.parent / f"{midi_path.stem}_clone_{model_id}.wav"

    try:
        import numpy as np
        import torch
    except ImportError as e:
        emit_error(f"PyTorch and numpy required for RAVE: {e}")

    # Load RAVE model (PyTorch Lightning checkpoint)
    try:
        from rave import RAVE
        model = RAVE.load_from_checkpoint(rave_model_path, strict=False)
        model.eval()
    except ImportError:
        emit_error(
            "RAVE package not found. Install from the RAVE repo (pip install -e .) or acids-rave. "
            "Ensure you are in the correct venv."
        )
    except Exception as e:
        emit_error(f"Failed to load RAVE checkpoint {rave_model_path}: {e}")

    sr = getattr(model, "sr", 48000)
    device = next(model.parameters()).device

    def _audio_to_tensor(y: np.ndarray, _target_sr: int) -> torch.Tensor:
        if y.ndim == 1:
            y = y[np.newaxis, np.newaxis, :]  # (1, 1, samples)
        elif y.ndim == 2:
            y = y[np.newaxis, :, :]  # (1, ch, samples)
        return torch.from_numpy(y.astype(np.float32)).to(device)

    def _duration_from_midi(path: Path) -> float:
        try:
            import pretty_midi
            pm = pretty_midi.PrettyMIDI(str(path))
            return float(pm.get_end_time()) if pm.get_end_time() else 2.0
        except Exception:
            return 2.0

    with torch.no_grad():
        if ref_audio_path is not None:
            try:
                import librosa
                y, _ = librosa.load(str(ref_audio_path), sr=sr, mono=True)
                x = _audio_to_tensor(y, sr)
            except ImportError:
                emit_error("librosa required for ref audio. pip install librosa")
            except Exception as e:
                emit_error(f"Failed to load ref audio: {e}")
        else:
            # No ref: generate audio of same duration as MIDI (noise through RAVE for model timbre)
            duration_sec = _duration_from_midi(midi_path)
            num_samples = int(duration_sec * sr)
            y = np.random.randn(1, 1, num_samples).astype(np.float32) * 0.1
            x = torch.from_numpy(y).to(device)

        # Encode -> reparametrize -> decode
        z = model.encode(x, return_mb=False)
        if hasattr(model.encoder, "reparametrize"):
            z, _ = model.encoder.reparametrize(z)
            if isinstance(z, tuple):
                z = z[0]
        out = model.decode(z)
        if isinstance(out, (list, tuple)):
            out = out[0]
        audio = out.squeeze().cpu().numpy()
        if audio.ndim > 1:
            audio = audio.reshape(-1)

    # Write WAV
    try:
        import soundfile as sf
        sf.write(str(output_path), audio, sr)
    except ImportError:
        try:
            import scipy.io.wavfile as wavio
            wavio.write(str(output_path), sr, (audio * 32767).clip(-32768, 32767).astype(np.int16))
        except ImportError:
            emit_error("soundfile or scipy required to write WAV. pip install soundfile")

    out = {"clonePath": str(output_path)}
    print(json.dumps(out))
    sys.exit(0)


if __name__ == "__main__":
    main()
