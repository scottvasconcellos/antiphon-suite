#!/usr/bin/env python3
"""
DrummerScore drum engine — Converts a MIDI file (from DrummerScore's main.ipynb or any
labeled drum MIDI) into our four role MIDIs with _drummerscore in the name so you can tell which set is which.
DrummerScore is notebook-based: run their main.ipynb on your stem to get a MIDI, then pass that MIDI here.
In:  JSON stdin: { "midiPath": "<path to MIDI from DrummerScore>" [, "outputDir": "<dir>", "audioPath": "<path for duration/tempo>"] }
Out: JSON stdout: { "drums_kick", "drums_snare", "drums_tops", "drums_perc" } (paths with _drummerscore in filename)
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
        emit_error("Missing JSON input: { \"midiPath\": \"...\" }")
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        emit_error(f"Invalid JSON: {e}")


def run(
    midi_path: Path,
    output_dir: Path,
    audio_path: Path | None = None,
) -> dict[str, str]:
    try:
        import pretty_midi
    except ImportError:
        emit_error("pretty_midi not installed (pip install pretty-midi)")

    midi_path = midi_path.resolve()
    output_dir = output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    duration_sec = 0.0
    bpm = 120.0
    if audio_path and audio_path.is_file():
        try:
            import librosa
            import numpy as np
            y, sr = librosa.load(str(audio_path), sr=22050, mono=True)
            duration_sec = float(len(y)) / sr
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr, units="frames")
            if hasattr(tempo, "__len__") and len(tempo) > 0:
                bpm = float(np.median(tempo))
            else:
                bpm = float(tempo) if tempo is not None else 120.0
            bpm = max(40.0, min(300.0, bpm))
        except Exception:
            pass

    KICK = {35, 36}
    SNARE = {37, 38, 39, 40}
    TOPS = set(range(42, 59))
    ROLES = ("drums_kick", "drums_snare", "drums_tops", "drums_perc")
    GM_NOTE = {"drums_kick": 36, "drums_snare": 38, "drums_tops": 42, "drums_perc": 47}

    def role_for_note(note: int) -> str:
        if note in KICK:
            return "drums_kick"
        if note in SNARE:
            return "drums_snare"
        if note in TOPS:
            return "drums_tops"
        return "drums_perc"

    pm = pretty_midi.PrettyMIDI(str(midi_path))
    if duration_sec <= 0:
        duration_sec = float(pm.get_end_time()) if pm.get_end_time() else 0.0
    if duration_sec <= 0:
        duration_sec = 60.0

    by_role: dict[str, list[tuple[float, float, int]]] = {r: [] for r in ROLES}
    for inst in pm.instruments:
        if not inst.is_drum:
            continue
        for n in inst.notes:
            start = float(n.start)
            if start >= duration_sec:
                continue
            end = min(float(n.end), duration_sec, start + 0.5)
            role = role_for_note(n.pitch)
            by_role[role].append((start, end, int(n.velocity)))

    base = midi_path.stem
    for s in ("_drums", " (Drums)", "_drummerscore"):
        base = base.replace(s, "").strip()
    base = base or "drums"
    suffix = "drummerscore"
    end_anchor_start = max(0.0, duration_sec - 0.001)
    end_anchor_end = duration_sec

    out_paths = {}
    for role in ROLES:
        out_pm = pretty_midi.PrettyMIDI(initial_tempo=bpm)
        drum_inst = pretty_midi.Instrument(program=0, is_drum=True)
        pitch = GM_NOTE[role]
        for start, end, vel in by_role[role]:
            drum_inst.notes.append(
                pretty_midi.Note(velocity=vel, pitch=pitch, start=start, end=end)
            )
        drum_inst.notes.append(
            pretty_midi.Note(velocity=1, pitch=pitch, start=end_anchor_start, end=end_anchor_end)
        )
        out_pm.instruments.append(drum_inst)
        path = output_dir / f"{base}_{suffix}_{role}.mid"
        out_pm.write(str(path))
        out_paths[role] = str(path)

    return out_paths


def main() -> None:
    data = read_input()
    midi_path_str = data.get("midiPath")
    if not midi_path_str:
        emit_error("Missing midiPath. Get a MIDI from DrummerScore main.ipynb, then pass it here.")
    midi_path = Path(midi_path_str).resolve()
    if not midi_path.is_file():
        emit_error(f"File not found: {midi_path}")

    output_dir = data.get("outputDir")
    if output_dir:
        out_dir = Path(output_dir).resolve()
        out_dir.mkdir(parents=True, exist_ok=True)
    else:
        out_dir = midi_path.parent

    audio_path = None
    if data.get("audioPath"):
        p = Path(data["audioPath"]).resolve()
        if p.is_file():
            audio_path = p

    out_paths = run(midi_path, out_dir, audio_path=audio_path)
    print(json.dumps(out_paths))


if __name__ == "__main__":
    main()
