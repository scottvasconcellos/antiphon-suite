#!/usr/bin/env python3
"""
mir_compare.py — FOSS stack contract (see docs/FOSS_AND_LOCAL_LLM_STACK.md).

In:  JSON on stdin or single arg: { "originalPath": "<wav>", "clonePath": "<wav>" }
Out: JSON on stdout: { "metrics": { "spectralCentroidDiff", "loudnessDiff", ... } }
     On error: JSON on stderr { "error": "..." }, exit 1.

Requires: pip install librosa soundfile (see scripts/requirements-mir.txt).
Optional: pip install essentia for key and tempo metrics (keyOriginal, keyClone, keyMatch, tempoOriginal, tempoClone, tempoDiff).
"""

from __future__ import annotations

import json
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
            'Missing input: provide JSON { "originalPath": "...", "clonePath": "..." } on stdin or as first argument'
        )
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        emit_error(f"Invalid JSON: {e}")
    if not isinstance(data, dict):
        emit_error("Input must be a JSON object")
    return data


def compute_metrics(original_path: Path, clone_path: Path) -> dict:
    try:
        import librosa
        import numpy as np
    except ImportError as e:
        emit_error(f"librosa/soundfile required: pip install librosa soundfile. {e}")

    try:
        y_orig, sr_orig = librosa.load(str(original_path), sr=None, mono=True)
        y_clone, sr_clone = librosa.load(str(clone_path), sr=None, mono=True)
    except Exception as e:
        emit_error(f"Failed to load audio: {e}")

    # Resample clone to original sr if needed for fair comparison
    if sr_clone != sr_orig:
        y_clone = librosa.resample(y_clone, orig_sr=sr_clone, target_sr=sr_orig)

    # Align length to shorter
    min_len = min(len(y_orig), len(y_clone))
    y_orig = y_orig[:min_len]
    y_clone = y_clone[:min_len]

    # Spectral centroid (Hz)
    cent_orig = librosa.feature.spectral_centroid(y=y_orig, sr=sr_orig)[0]
    cent_clone = librosa.feature.spectral_centroid(y=y_clone, sr=sr_orig)[0]
    spectral_centroid_diff = float(np.abs(cent_orig.mean() - cent_clone.mean()))

    # RMS (loudness proxy)
    rms_orig = librosa.feature.rms(y=y_orig)[0]
    rms_clone = librosa.feature.rms(y=y_clone)[0]
    loudness_diff = float(np.abs(rms_orig.mean() - rms_clone.mean()))

    metrics = {
        "spectralCentroidDiff": round(spectral_centroid_diff, 6),
        "loudnessDiff": round(loudness_diff, 6),
    }

    # Optional: Essentia key and tempo (add to metrics when essentia is installed)
    try:
        import essentia.standard as es
        # Key: KeyExtractor returns (key, scale, strength)
        key_extractor = es.KeyExtractor(sampleRate=sr_orig)
        key_orig = key_extractor(np.array(y_orig, dtype=np.float32))
        key_clone = key_extractor(np.array(y_clone, dtype=np.float32))
        key_orig_str = f"{key_orig[0]} {key_orig[1]}" if (key_orig and len(key_orig) >= 2) else ""
        key_clone_str = f"{key_clone[0]} {key_clone[1]}" if (key_clone and len(key_clone) >= 2) else ""
        metrics["keyOriginal"] = key_orig_str
        metrics["keyClone"] = key_clone_str
        metrics["keyMatch"] = key_orig_str == key_clone_str and bool(key_orig_str)
        # Tempo (BPM): RhythmExtractor2013 returns (bpm, beats, confidence, ...)
        rhythm_orig = es.RhythmExtractor2013(method="multifeature")(np.array(y_orig, dtype=np.float32))
        rhythm_clone = es.RhythmExtractor2013(method="multifeature")(np.array(y_clone, dtype=np.float32))
        bpm_orig = float(rhythm_orig[0]) if rhythm_orig and rhythm_orig[0] else 0.0
        bpm_clone = float(rhythm_clone[0]) if rhythm_clone and rhythm_clone[0] else 0.0
        metrics["tempoOriginal"] = round(bpm_orig, 2)
        metrics["tempoClone"] = round(bpm_clone, 2)
        metrics["tempoDiff"] = round(abs(bpm_orig - bpm_clone), 2)
    except ImportError:
        pass  # Essentia optional; Librosa metrics only

    return metrics


def main() -> None:
    data = read_input()
    orig_str = data.get("originalPath")
    clone_str = data.get("clonePath")
    if not orig_str or not isinstance(orig_str, str):
        emit_error("Missing or invalid key: originalPath")
    if not clone_str or not isinstance(clone_str, str):
        emit_error("Missing or invalid key: clonePath")

    original_path = Path(orig_str).resolve()
    clone_path = Path(clone_str).resolve()
    if not original_path.exists() or not original_path.is_file():
        emit_error(f"originalPath does not exist or is not a file: {original_path}")
    if not clone_path.exists() or not clone_path.is_file():
        emit_error(f"clonePath does not exist or is not a file: {clone_path}")

    metrics = compute_metrics(original_path, clone_path)
    out = {"metrics": metrics}
    print(json.dumps(out))
    sys.exit(0)


if __name__ == "__main__":
    main()
