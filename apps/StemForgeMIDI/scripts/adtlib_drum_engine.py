#!/usr/bin/env python3
"""
ADT-lib drum engine — Uses ADTLib (Kick, Snare, Hi-hat) and writes four MIDI files
with _adtlib in the name so you can tell which set is which.
Requires: pip install ADTLib (and its deps: madmom, tensorflow, etc.) in a venv (e.g. .venv-drum-pack).
In:  JSON stdin: { "audioPath": "<path>" [, "outputDir": "<dir>"] }
Out: JSON stdout: { "drums_kick", "drums_snare", "drums_tops", "drums_perc" } (paths with _adtlib in filename)
On error: JSON stderr { "error": "..." }, exit 1.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


def emit_error(msg: str) -> None:
    print(json.dumps({"error": msg}), file=sys.stderr)
    sys.exit(1)


def read_input() -> dict:
    raw = sys.stdin.read().strip()
    if not raw:
        emit_error("Missing JSON input: { \"audioPath\": \"...\" }")
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        emit_error(f"Invalid JSON: {e}")


def run(
    audio_path: Path,
    output_dir: Path,
) -> dict[str, str]:
    try:
        from ADTLib import ADT
        import librosa
        import numpy as np
        import pretty_midi
    except ImportError as e:
        emit_error(f"Missing dependency: {e}. Install ADTLib in a venv (e.g. .venv-drum-pack): pip install ADTLib librosa pretty-midi numpy")

    audio_path = audio_path.resolve()
    output_dir = output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    # ADTLib returns list of dicts per file; we pass one file
    result = ADT([str(audio_path)])
    if not result:
        emit_error("ADTLib returned no result")
    onsets_by_kit = result[0]

    # ADTLib keys: Kick, Snare, Hihat (or Hi-hat)
    def get_times(key: str) -> list[float]:
        raw = onsets_by_kit.get(key, onsets_by_kit.get("Hi-hat", []))
        if hasattr(raw, "tolist"):
            return [float(t) for t in raw.tolist()]
        return [float(t) for t in (raw or [])]

    kick_times = get_times("Kick")
    snare_times = get_times("Snare")
    hihat_times = get_times("Hihat") or get_times("Hi-hat")

    # Audio duration and BPM for MIDI length and grid
    y, sr = librosa.load(str(audio_path), sr=22050, mono=True)
    duration_sec = float(len(y)) / sr
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr, units="frames")
    if hasattr(tempo, "__len__") and len(tempo) > 0:
        bpm = float(np.median(tempo))
    else:
        bpm = float(tempo) if tempo is not None else 120.0
    bpm = max(40.0, min(300.0, bpm))

    # Our four roles: kick, snare, tops (hi-hat), perc (ADT-lib has no separate perc, leave empty)
    ROLES = ("drums_kick", "drums_snare", "drums_tops", "drums_perc")
    GM_NOTE = {"drums_kick": 36, "drums_snare": 38, "drums_tops": 42, "drums_perc": 47}
    by_role: dict[str, list[tuple[float, int]]] = {
        "drums_kick": [(t, 90) for t in kick_times if 0 <= t < duration_sec - 0.01],
        "drums_snare": [(t, 90) for t in snare_times if 0 <= t < duration_sec - 0.01],
        "drums_tops": [(t, 80) for t in hihat_times if 0 <= t < duration_sec - 0.01],
        "drums_perc": [],
    }

    base = audio_path.stem
    suffix = "adtlib"
    end_anchor_start = max(0.0, duration_sec - 0.001)
    end_anchor_end = duration_sec

    out_paths = {}
    for role in ROLES:
        out_pm = pretty_midi.PrettyMIDI(initial_tempo=bpm)
        drum_inst = pretty_midi.Instrument(program=0, is_drum=True)
        pitch = GM_NOTE[role]
        for start, vel in by_role[role]:
            end = min(start + 0.08, duration_sec)
            drum_inst.notes.append(
                pretty_midi.Note(velocity=vel, pitch=pitch, start=start, end=end)
            )
        drum_inst.notes.append(
            pretty_midi.Note(velocity=1, pitch=pitch, start=end_anchor_start, end=end_anchor_end)
        )
        out_pm.instruments.append(drum_inst)
        # Filename so you can tell which set: stem_adtlib_drums_kick.mid
        path = output_dir / f"{base}_{suffix}_{role}.mid"
        out_pm.write(str(path))
        out_paths[role] = str(path)

    return out_paths


def main() -> None:
    data = read_input()
    audio_path_str = data.get("audioPath")
    if not audio_path_str:
        emit_error("Missing audioPath")
    audio_path = Path(audio_path_str).resolve()
    if not audio_path.is_file():
        emit_error(f"File not found: {audio_path}")

    output_dir = data.get("outputDir")
    if output_dir:
        out_dir = Path(output_dir).resolve()
        out_dir.mkdir(parents=True, exist_ok=True)
    else:
        out_dir = audio_path.parent

    out_paths = run(audio_path, out_dir)
    print(json.dumps(out_paths))


if __name__ == "__main__":
    main()
