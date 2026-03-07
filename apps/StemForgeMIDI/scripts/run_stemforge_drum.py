#!/usr/bin/env python3
"""
StemForge Drum — CLI wrapper around basic_drum_engine.py.

Usage:
    python scripts/run_stemforge_drum.py --audio drums.wav --output ./out
    python scripts/run_stemforge_drum.py --audio drums.wav --output ./out --samples ./samples --bpm 120

Outputs MIDI per lane (kick/snare/tops/perc) and, when --samples is given,
resynthesized audio stems (kick.wav, snare.wav, tops.wav) built from your
one-shot sample kit.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
APP_ROOT = SCRIPT_DIR.parent


def _engine_python() -> str:
    venv_py = APP_ROOT / ".venv" / "bin" / "python3"
    return str(venv_py) if venv_py.is_file() else sys.executable


def main() -> int:
    ap = argparse.ArgumentParser(
        description="StemForge Drum: split drum audio into kick / snare / tops MIDI (and audio stems)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    ap.add_argument("--audio", required=True, help="Path to drum audio file (.wav, .flac, .mp3, …)")
    ap.add_argument("--output", required=True, help="Output directory (created if missing)")
    ap.add_argument("--samples", default="", help="Optional: path to sample kit directory for audio stem render")
    ap.add_argument("--bpm", type=float, default=0.0, help="Tempo hint (0 = auto-detect)")
    ap.add_argument("--min-velocity", type=int, default=40, help="Minimum MIDI velocity to emit (default: 40)")
    args = ap.parse_args()

    audio_path = Path(args.audio).resolve()
    if not audio_path.is_file():
        print(f"error: audio file not found: {audio_path}", file=sys.stderr)
        return 1

    output_dir = Path(args.output).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    payload: dict = {
        "audioPath": str(audio_path),
        "outputDir": str(output_dir),
        "useRawMidi": False,
        "minVelocityThreshold": args.min_velocity,
    }
    if args.bpm > 0:
        payload["bpm"] = args.bpm
    if args.samples:
        sample_dir = Path(args.samples).resolve()
        if not sample_dir.is_dir():
            print(f"warning: --samples dir not found: {sample_dir} — skipping audio stems", file=sys.stderr)
        else:
            payload["sampleDir"] = str(sample_dir)

    r = subprocess.run(
        [_engine_python(), str(SCRIPT_DIR / "basic_drum_engine.py")],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        cwd=str(APP_ROOT),
    )

    if r.returncode != 0:
        print("Engine error:", file=sys.stderr)
        print(r.stderr.strip(), file=sys.stderr)
        return 1

    try:
        result = json.loads(r.stdout.strip())
    except Exception:
        print("Unexpected engine output:", r.stdout[:200], file=sys.stderr)
        return 1

    print(f"\nStemForge Drum — output in {output_dir}/\n")
    midi_keys = [k for k in result if not k.startswith("audio_")]
    audio_keys = [k for k in result if k.startswith("audio_")]

    if midi_keys:
        print("MIDI lanes:")
        for k in sorted(midi_keys):
            print(f"  {k:16s}  {Path(result[k]).name}")
    if audio_keys:
        print("\nAudio stems:")
        for k in sorted(audio_keys):
            print(f"  {k:16s}  {Path(result[k]).name}")
    if not audio_keys and args.samples:
        print("  (no audio stems rendered — check that --samples dir contains kick.wav / snare.wav / tops.wav)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
