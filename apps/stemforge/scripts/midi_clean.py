#!/usr/bin/env python3
"""
midi_clean.py — FOSS stack contract (see docs/FOSS_AND_LOCAL_LLM_STACK.md).

Standalone MIDI cleanup using pretty_midi only (no Basic Pitch).
In:  JSON on stdin or single arg: { "midiPath": "<path>" [, "outputPath": "<path>"] }
Out: JSON on stdout: { "cleanedMidiPath": "<path>", "stats": { "noteCount", "trackCount", "duration", "pitchRange" } }
     On error: JSON on stderr { "error": "..." }, exit 1.
"""

from __future__ import annotations

import json
import sys
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
        emit_error("Missing input: provide JSON { \"midiPath\": \"...\" } on stdin or as first argument")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        emit_error(f"Invalid JSON: {e}")
    if not isinstance(data, dict):
        emit_error("Input must be a JSON object")
    return data


def validate_midi_path(midi_path: str) -> Path:
    """Resolve and validate midiPath; emit_error and exit on failure."""
    if not midi_path or not isinstance(midi_path, str):
        emit_error("midiPath must be a non-empty string")
    path = Path(midi_path).resolve()
    if not path.exists():
        emit_error(f"midiPath does not exist: {path}")
    if not path.is_file():
        emit_error(f"midiPath is not a file: {path}")
    if path.stat().st_size == 0:
        emit_error(f"midiPath is empty: {path}")
    return path


def run_clean(midi_path: Path, out_path: Path) -> dict:
    """
    Load MIDI with pretty_midi, remove empty tracks, drop very short notes, write cleaned file.
    Returns stats: noteCount, trackCount, duration, pitchRange [min, max].
    """
    try:
        import pretty_midi
    except ImportError:
        emit_error("pretty_midi not installed (pip install pretty-midi)")

    try:
        pm = pretty_midi.PrettyMIDI(str(midi_path))
    except Exception as e:
        emit_error(f"Failed to load MIDI: {e}")

    min_note_len_s = 0.04  # drop notes shorter than 40ms
    total_notes = 0
    all_pitches: list[int] = []
    kept_instruments: list[pretty_midi.Instrument] = []

    for inst in pm.instruments:
        kept_notes: list[pretty_midi.Note] = []
        for n in inst.notes:
            if (n.end - n.start) >= min_note_len_s:
                kept_notes.append(n)
                total_notes += 1
                all_pitches.append(n.pitch)
        if kept_notes:
            new_inst = pretty_midi.Instrument(program=inst.program, is_drum=inst.is_drum)
            new_inst.notes.extend(kept_notes)
            kept_instruments.append(new_inst)

    # Build a new PrettyMIDI with only non-empty instruments (preserve tempo if present)
    out_pm = pretty_midi.PrettyMIDI(initial_tempo=pm.get_tempo_changes()[-1][1] if pm.get_tempo_changes() else 120)
    for inst in kept_instruments:
        out_pm.instruments.append(inst)

    try:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_pm.write(str(out_path))
    except Exception as e:
        emit_error(f"Failed to write cleaned MIDI: {e}")

    duration_s = float(out_pm.get_end_time()) if out_pm.get_end_time() else 0.0
    pitch_min = min(all_pitches) if all_pitches else 0
    pitch_max = max(all_pitches) if all_pitches else 0

    return {
        "noteCount": total_notes,
        "trackCount": len(kept_instruments),
        "duration": round(duration_s, 4),
        "pitchRange": [pitch_min, pitch_max],
    }


def main() -> None:
    data = read_input()
    midi_path_str = data.get("midiPath")
    if midi_path_str is None:
        emit_error("Missing key: midiPath")
    midi_path = validate_midi_path(midi_path_str)

    out_path = midi_path.parent / f"{midi_path.stem}_cleaned.mid"
    if data.get("outputPath") and isinstance(data["outputPath"], str):
        out_path = Path(data["outputPath"]).resolve()

    stats = run_clean(midi_path, out_path)

    out = {
        "cleanedMidiPath": str(out_path),
        "stats": stats,
    }
    print(json.dumps(out))
    sys.exit(0)


if __name__ == "__main__":
    main()
