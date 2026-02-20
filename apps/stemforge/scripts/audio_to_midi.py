#!/usr/bin/env python3
"""
audio_to_midi.py — FOSS stack contract (see docs/FOSS_AND_LOCAL_LLM_STACK.md).

In:  JSON on stdin or single arg: { "audioPath": "<path>" }
Out: JSON on stdout: { "midiPath", "noteCount", "pitchRange", "duration" }
     On error: JSON on stderr { "error": "..." }, exit 1.
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
from pathlib import Path


def emit_error(msg: str) -> None:
    print(json.dumps({"error": msg}), file=sys.stderr)
    sys.exit(1)


def read_input() -> dict:
    """Read JSON input from stdin or first arg."""
    raw: str
    if len(sys.argv) >= 2:
        raw = sys.argv[1]
    else:
        raw = sys.stdin.read()
    if not raw or not raw.strip():
        emit_error("Missing input: provide JSON { \"audioPath\": \"...\" } on stdin or as first argument")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        emit_error(f"Invalid JSON: {e}")
    if not isinstance(data, dict):
        emit_error("Input must be a JSON object")
    return data


def validate_audio_path(audio_path: str) -> Path:
    """Resolve and validate audioPath; emit_error and exit on failure."""
    if not audio_path or not isinstance(audio_path, str):
        emit_error("audioPath must be a non-empty string")
    path = Path(audio_path).resolve()
    if not path.exists():
        emit_error(f"audioPath does not exist: {path}")
    if not path.is_file():
        emit_error(f"audioPath is not a file: {path}")
    if path.stat().st_size == 0:
        emit_error(f"audioPath is empty: {path}")
    return path


def run_basic_pitch_and_clean(audio_path: Path, out_midi_path: Path) -> tuple[int, list[int], float]:
    """
    Run Basic Pitch, optionally clean with pretty_midi, write MIDI.
    Returns (note_count, pitch_range [min_midi, max_midi], duration_seconds).
    """
    try:
        from basic_pitch.inference import predict
        from basic_pitch import ICASSP_2022_MODEL_PATH
    except ImportError as e:
        emit_error(f"basic_pitch not installed (pip install basic-pitch): {e}")

    try:
        import pretty_midi
    except ImportError:
        emit_error("pretty_midi not installed (pip install pretty-midi)")

    # Predict: returns (model_output, midi_data: PrettyMIDI, note_events)
    try:
        _model_out, midi_data, note_events = predict(str(audio_path), ICASSP_2022_MODEL_PATH)
    except Exception as e:
        emit_error(f"Basic Pitch prediction failed: {e}")

    # Light clean: remove micro-notes (very short), optional light quantize
    # note_events: list of (start_time_s, end_time_s, pitch_midi, velocity, pitch_bend)
    min_note_len_s = 0.04  # drop notes shorter than 40ms
    cleaned_events = [
        (s, e, p, v, b)
        for s, e, p, v, b in note_events
        if (e - s) >= min_note_len_s
    ]

    # Rebuild a minimal PrettyMIDI with cleaned notes (one instrument)
    pm = pretty_midi.PrettyMIDI(initial_tempo=120)
    inst = pretty_midi.Instrument(program=0)
    for start_s, end_s, pitch_midi, vel, _ in cleaned_events:
        n = pretty_midi.Note(
            velocity=int(min(127, max(1, int(vel * 127)))),
            pitch=int(pitch_midi),
            start=start_s,
            end=end_s,
        )
        inst.notes.append(n)
    pm.instruments.append(inst)

    try:
        pm.write(str(out_midi_path))
    except Exception as e:
        emit_error(f"Failed to write MIDI: {e}")

    note_count = len(cleaned_events)
    if note_count == 0:
        pitch_min, pitch_max = 0, 0
        duration_s = 0.0
    else:
        pitches = [p for (_, _, p, _, _) in cleaned_events]
        pitch_min = min(pitches)
        pitch_max = max(pitches)
        duration_s = float(pm.get_end_time()) if pm.get_end_time() else 0.0

    return note_count, [pitch_min, pitch_max], duration_s


def main() -> None:
    data = read_input()
    audio_path_str = data.get("audioPath")
    if audio_path_str is None:
        emit_error("Missing key: audioPath")
    audio_path = validate_audio_path(audio_path_str)

    # Output alongside input with _basic_pitch.mid suffix
    out_midi = audio_path.parent / f"{audio_path.stem}_basic_pitch.mid"
    # If caller wants a temp file, they can pass a path in data; for contract we use deterministic path
    if data.get("outputPath") and isinstance(data["outputPath"], str):
        out_midi = Path(data["outputPath"]).resolve()
        out_midi.parent.mkdir(parents=True, exist_ok=True)

    note_count, pitch_range, duration_s = run_basic_pitch_and_clean(audio_path, out_midi)

    out = {
        "midiPath": str(out_midi),
        "noteCount": note_count,
        "pitchRange": pitch_range,
        "duration": round(duration_s, 4),
    }
    print(json.dumps(out))
    sys.exit(0)


if __name__ == "__main__":
    main()
