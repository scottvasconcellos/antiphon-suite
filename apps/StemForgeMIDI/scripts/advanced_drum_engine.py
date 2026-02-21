#!/usr/bin/env python3
"""
Advanced Drum Engine — Omnizart (via Docker) for drum transcription, then split to four role MIDIs.
Requires Docker and the image: mctlab/omnizart:latest
In:  JSON stdin: { "audioPath": "<path>" [, "outputDir": "<dir>"] }
Out: JSON stdout: { "drums_kick", "drums_snare", "drums_tops", "drums_perc" } (paths)
On error: JSON stderr { "error": "..." }, exit 1.
"""

from __future__ import annotations

import json
import subprocess
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


def run_omnizart_docker(audio_path: Path, output_dir: Path) -> Path:
    """Run Omnizart drum transcribe in Docker. Returns path to the single output MIDI."""
    # Docker needs absolute paths for bind mounts
    audio_path = audio_path.resolve()
    output_dir = output_dir.resolve()
    if not audio_path.is_file():
        emit_error(f"Audio file not found: {audio_path}")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Use same filename for output; Omnizart replaces extension with .mid
    out_midi_name = audio_path.stem + ".mid"
    # Mount parent of audio so path inside container is simple
    audio_parent = str(audio_path.parent)
    # Mount output_dir to /out
    cmd = [
        "docker", "run", "--rm",
        "-v", f"{audio_parent}:/in:ro",
        "-v", f"{output_dir}:/out",
        "mctlab/omnizart:latest",
        "omnizart", "drum", "transcribe",
        f"/in/{audio_path.name}",
        "-o", "/out",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        stderr = (result.stderr or "").strip() or (result.stdout or "").strip()
        emit_error(f"Omnizart Docker failed: {stderr[:500]}")
    out_midi = output_dir / out_midi_name
    if not out_midi.is_file():
        emit_error(f"Omnizart did not produce {out_midi_name} in {output_dir}")
    return out_midi


def _audio_duration_and_bpm(audio_path: Path) -> tuple[float, float]:
    """Return (duration_sec, bpm) from source audio so MIDI aligns in DAW."""
    try:
        import librosa
        import numpy as np
    except ImportError:
        return (0.0, 120.0)
    try:
        y, sr = librosa.load(str(audio_path), sr=22050, mono=True)
        duration_sec = float(len(y)) / sr
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr, units="frames")
        if hasattr(tempo, "__len__") and len(tempo) > 0:
            bpm = float(np.median(tempo))
        else:
            bpm = float(tempo) if tempo is not None else 120.0
        bpm = max(40.0, min(300.0, bpm))
        return (duration_sec, bpm)
    except Exception:
        return (0.0, 120.0)


def run_drum_split(midi_path: Path, output_dir: Path, audio_path: Path | None = None) -> dict[str, str]:
    """Split Omnizart's single MIDI into four role MIDIs; clamp to source duration and set tempo from audio."""
    try:
        import pretty_midi
    except ImportError:
        emit_error("pretty_midi not installed (pip install pretty-midi)")

    duration_sec, bpm = (0.0, 120.0)
    if audio_path and audio_path.is_file():
        duration_sec, bpm = _audio_duration_and_bpm(audio_path)

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
    # Use BPM from source audio so Logic grid matches
    tempo = bpm
    by_role: dict[str, list] = {"drums_kick": [], "drums_snare": [], "drums_tops": [], "drums_perc": []}
    for inst in pm.instruments:
        if not inst.is_drum:
            continue
        for n in inst.notes:
            start = float(n.start)
            if start >= duration_sec:
                continue
            end = min(float(n.end), duration_sec, start + 0.5)
            role = role_for_note(n.pitch)
            by_role[role].append((n.pitch, start, end, n.velocity))

    base = midi_path.stem
    if base.endswith("_drums") or base.endswith(" (Drums)"):
        base = base.replace(" (Drums)", "").replace("_drums", "").strip() or "drums"
    out_paths = {}
    for role in ROLES:
        out_pm = pretty_midi.PrettyMIDI(initial_tempo=tempo)
        drum_inst = pretty_midi.Instrument(program=0, is_drum=True)
        for pitch, start, end, vel in by_role[role]:
            drum_inst.notes.append(
                pretty_midi.Note(velocity=int(vel), pitch=int(pitch), start=start, end=end)
            )
        out_pm.instruments.append(drum_inst)
        path = output_dir / f"{base}_{role}.mid"
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

    midi_path = run_omnizart_docker(audio_path, out_dir)
    out_paths = run_drum_split(midi_path, out_dir, audio_path=audio_path)
    print(json.dumps(out_paths))


if __name__ == "__main__":
    main()
