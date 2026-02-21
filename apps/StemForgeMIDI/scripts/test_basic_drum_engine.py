#!/usr/bin/env python3
"""
Internal test for Basic Drum Engine: generate ground-truth drum WAV (including fills),
run the engine, compare MIDI output to expected times/roles. Unbiased, repeatable.
Run: python scripts/test_basic_drum_engine.py [--write-wav path.wav]
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

# Ground truth: (time_sec, role). BPM 120, 4/4. Backbeat, fill, triplets, polyrhythm (3 over 2).
BPM = 120
BEAT_DUR = 60.0 / BPM
# Bars 1-4: backbeat; 5-6: fill (16ths); 7-8: backbeat; 9-10: 8th-note triplets + polyrhythm; 11-12: dense fill
GROUND_TRUTH = [
    (0.0, "drums_kick"),
    (0.25, "drums_tops"),
    (0.5, "drums_snare"),
    (0.75, "drums_tops"),
    (1.0, "drums_kick"),
    (1.25, "drums_tops"),
    (1.5, "drums_snare"),
    (1.75, "drums_tops"),
    (2.0, "drums_kick"),
    (2.25, "drums_tops"),
    (2.5, "drums_snare"),
    (2.75, "drums_tops"),
    (3.0, "drums_kick"),
    (3.25, "drums_tops"),
    (3.5, "drums_snare"),
    (3.75, "drums_tops"),
    (4.0, "drums_kick"),
    (4.125, "drums_snare"),
    (4.25, "drums_perc"),
    (4.375, "drums_snare"),
    (4.5, "drums_perc"),
    (4.625, "drums_snare"),
    (4.75, "drums_perc"),
    (4.875, "drums_snare"),
    (5.0, "drums_kick"),
    (5.125, "drums_snare"),
    (5.25, "drums_perc"),
    (5.375, "drums_snare"),
    (5.5, "drums_perc"),
    (5.625, "drums_snare"),
    (5.75, "drums_perc"),
    (5.875, "drums_snare"),
    (6.0, "drums_kick"),
    (6.25, "drums_tops"),
    (6.5, "drums_snare"),
    (6.75, "drums_tops"),
    (7.0, "drums_kick"),
    (7.25, "drums_tops"),
    (7.5, "drums_snare"),
    (7.75, "drums_tops"),
    # Bar 9-10: 8th-note triplets (3 per beat): hat triplets, snare on 2&4, kick 1&3
    (8.0, "drums_kick"),
    (8.0, "drums_tops"),
    (8.0833, "drums_tops"),
    (8.1667, "drums_tops"),
    (8.25, "drums_tops"),
    (8.3333, "drums_tops"),
    (8.5, "drums_snare"),
    (8.5, "drums_tops"),
    (8.5833, "drums_tops"),
    (8.6667, "drums_tops"),
    (8.75, "drums_tops"),
    (8.8333, "drums_tops"),
    (9.0, "drums_kick"),
    (9.0, "drums_tops"),
    (9.0833, "drums_tops"),
    (9.1667, "drums_tops"),
    (9.25, "drums_tops"),
    (9.3333, "drums_tops"),
    (9.5, "drums_snare"),
    (9.5, "drums_tops"),
    (9.5833, "drums_tops"),
    (9.6667, "drums_tops"),
    (9.75, "drums_tops"),
    (9.8333, "drums_tops"),
    # Bar 11: polyrhythm 3 over 2 (kick on 3, snare on 2) + hat 8ths
    (10.0, "drums_kick"),
    (10.0, "drums_tops"),
    (10.25, "drums_tops"),
    (10.3333, "drums_snare"),
    (10.5, "drums_tops"),
    (10.6667, "drums_kick"),
    (10.75, "drums_tops"),
    (11.0, "drums_kick"),
    (11.0, "drums_tops"),
    (11.25, "drums_tops"),
    (11.3333, "drums_snare"),
    (11.5, "drums_tops"),
    (11.6667, "drums_kick"),
    (11.75, "drums_tops"),
    # Bar 12: dense fill (32nds feel)
    (12.0, "drums_kick"),
    (12.0625, "drums_snare"),
    (12.125, "drums_perc"),
    (12.1875, "drums_snare"),
    (12.25, "drums_tops"),
    (12.3125, "drums_snare"),
    (12.375, "drums_perc"),
    (12.4375, "drums_snare"),
    (12.5, "drums_perc"),
    (12.5625, "drums_snare"),
    (12.625, "drums_tops"),
    (12.6875, "drums_snare"),
    (12.75, "drums_perc"),
    (12.8125, "drums_snare"),
    (12.875, "drums_tops"),
    (12.9375, "drums_snare"),
]


def generate_ground_truth_wav(out_path: Path, sr: int = 22050) -> None:
    import numpy as np
    try:
        from scipy.io import wavfile
    except ImportError:
        sys.exit("scipy required for test WAV generation")

    duration_s = 13.0
    n = int(sr * duration_s)
    t = np.arange(n) / sr
    y = np.zeros(n, dtype=np.float32)

    for time_sec, role in GROUND_TRUTH:
        start = int(time_sec * sr)
        if start >= n:
            continue
        length = int(0.08 * sr) if role != "drums_tops" else int(0.04 * sr)
        end = min(n, start + length)
        env = np.exp(-np.linspace(0, 10, end - start))
        if role == "drums_kick":
            y[start:end] += 0.6 * env * np.sin(2 * np.pi * 60 * t[start:end])
        elif role == "drums_snare":
            y[start:end] += 0.5 * env * (
                np.random.randn(end - start).astype(np.float32) * 0.4
                + 0.4 * np.sin(2 * np.pi * 200 * t[start:end])
            )
        elif role == "drums_tops":
            y[start:end] += 0.2 * env * np.random.randn(end - start).astype(np.float32)
        else:
            y[start:end] += 0.35 * env * (
                np.random.randn(end - start).astype(np.float32) * 0.3
                + 0.3 * np.sin(2 * np.pi * 120 * t[start:end])
            )

    y = y / (np.abs(y).max() + 1e-6) * 0.9
    out_path.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(str(out_path), sr, y)


def load_midi_notes(midi_path: Path, role: str) -> list[float]:
    try:
        import pretty_midi
    except ImportError:
        return []
    pm = pretty_midi.PrettyMIDI(str(midi_path))
    times = []
    for inst in pm.instruments:
        if not inst.is_drum:
            continue
        for n in inst.notes:
            times.append(float(n.start))
    return sorted(times)


def run_engine(audio_path: Path, output_dir: Path, bpm: float, script_path: Path, python: str) -> dict[str, str]:
    payload = {
        "audioPath": str(audio_path.resolve()),
        "outputDir": str(output_dir.resolve()),
        "bpm": bpm,
    }
    proc = subprocess.run(
        [python, str(script_path)],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        cwd=script_path.parent.parent,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "engine failed")
    return json.loads(proc.stdout.strip())


def evaluate(
    ground_truth: list[tuple[float, str]],
    out_paths: dict[str, str],
    time_tol_sec: float = 0.05,
) -> dict:
    try:
        import pretty_midi
    except ImportError:
        return {"error": "pretty_midi not installed"}

    role_to_path = out_paths
    predicted = []
    for role, path in role_to_path.items():
        pm = pretty_midi.PrettyMIDI(path)
        for inst in pm.instruments:
            if not inst.is_drum:
                continue
            for n in inst.notes:
                if n.velocity <= 1:
                    continue
                predicted.append((float(n.start), role))

    predicted.sort(key=lambda x: x[0])

    # Match each ground-truth to nearest predicted within tolerance; count correct role
    matched = 0
    correct_role = 0
    timing_errors = []
    for t_gt, role_gt in ground_truth:
        best_d = time_tol_sec + 1
        best_role = None
        for t_pred, role_pred in predicted:
            d = abs(t_pred - t_gt)
            if d < best_d:
                best_d, best_role = d, role_pred
        if best_d <= time_tol_sec:
            matched += 1
            if best_role == role_gt:
                correct_role += 1
            timing_errors.append(best_d)

    # Per-role accuracy (for predicted notes that fall near a ground-truth)
    by_role = {"drums_kick": {"tp": 0, "pred": 0}, "drums_snare": {"tp": 0, "pred": 0}, "drums_tops": {"tp": 0, "pred": 0}, "drums_perc": {"tp": 0, "pred": 0}}
    for t_pred, role_pred in predicted:
        by_role[role_pred]["pred"] += 1
        for t_gt, role_gt in ground_truth:
            if abs(t_pred - t_gt) <= time_tol_sec and role_gt == role_pred:
                by_role[role_pred]["tp"] += 1
                break

    onset_recall = matched / len(ground_truth) if ground_truth else 0
    role_accuracy = correct_role / matched if matched else 0
    mean_timing_err = sum(timing_errors) / len(timing_errors) if timing_errors else None

    return {
        "onset_recall": round(onset_recall, 4),
        "role_accuracy": round(role_accuracy, 4),
        "matched_onsets": matched,
        "total_ground_truth": len(ground_truth),
        "correct_role": correct_role,
        "mean_timing_error_sec": round(mean_timing_err, 5) if mean_timing_err is not None else None,
        "by_role": {r: {"tp": by_role[r]["tp"], "pred": by_role[r]["pred"]} for r in by_role},
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="Test Basic Drum Engine with ground-truth WAV")
    ap.add_argument("--write-wav", type=str, help="Also write the test WAV to this path")
    ap.add_argument("--keep", action="store_true", help="Keep temp output MIDI files")
    args = ap.parse_args()

    repo = Path(__file__).resolve().parent.parent
    script = repo / "scripts" / "basic_drum_engine.py"
    python = repo / ".venv" / "bin" / "python3"
    if not python.exists():
        python = "python3"

    with tempfile.TemporaryDirectory(prefix="drum_engine_test_") as tmp:
        tmp_path = Path(tmp)
        wav_path = tmp_path / "test_ground_truth.wav"
        generate_ground_truth_wav(wav_path)
        if args.write_wav:
            out_wav = Path(args.write_wav).resolve()
            out_wav.parent.mkdir(parents=True, exist_ok=True)
            import shutil
            shutil.copy(wav_path, out_wav)
            print(f"Wrote test WAV to {out_wav}", file=sys.stderr)

        out_paths = run_engine(wav_path, tmp_path, BPM, script, str(python))
        results = evaluate(GROUND_TRUTH, out_paths, time_tol_sec=0.05)

        if args.keep:
            keep_dir = repo / ".tmp-drum-test" / "test_harness_output"
            keep_dir.mkdir(parents=True, exist_ok=True)
            for role, p in out_paths.items():
                import shutil
                shutil.copy(p, keep_dir / Path(p).name)
            print(f"Kept MIDI in {keep_dir}", file=sys.stderr)

        print(json.dumps(results, indent=2))
        if results.get("onset_recall", 0) < 0.85 or results.get("role_accuracy", 0) < 0.65:
            sys.exit(1)


if __name__ == "__main__":
    main()
