#!/usr/bin/env python3
"""
Run internal eval: load 50 drum packs (WAV + key JSON), run basic_drum_engine on each,
compare output to key. Report recall/precision per pack and overall pass rate.
Target: >= 90% of packs pass (recall >= 90%, precision >= 85% for kick and snare; length ok).
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
APP_ROOT = SCRIPT_DIR.parent

MATCH_SEC = 0.08
RECALL_MIN = 0.90
PRECISION_MIN = 0.85
VEL_ANCHOR_MAX = 1
MAIN_MIN_VELOCITY_DEFAULT = 40


def resolve_engine_python() -> str:
    """Prefer app-local venv python so engine dependencies resolve reliably."""
    venv_py = APP_ROOT / ".venv" / "bin" / "python3"
    if venv_py.is_file():
        return str(venv_py)
    return sys.executable


ENGINE_PYTHON = resolve_engine_python()


def run_engine(
    audio_path: Path,
    output_dir: Path,
    bpm: float,
    min_velocity_threshold: int,
    sample_dir: Path | None = None,
    use_backend_hints: bool = False,
    use_real_backend: bool = False,
) -> dict[str, str] | None:
    try:
        payload: dict = {
            "audioPath": str(audio_path.resolve()),
            "outputDir": str(output_dir.resolve()),
            "useRawMidi": False,
            "bpm": bpm,
            "minVelocityThreshold": int(min_velocity_threshold),
        }
        if sample_dir is not None:
            payload["sampleDir"] = str(sample_dir)
        if use_real_backend:
            payload["useRealBackend"] = True
        elif use_backend_hints:
            payload["useBackendHintsInline"] = True
            payload["useDrummerKnowledge"] = True
        inp = json.dumps(payload)
        r = subprocess.run(
            [ENGINE_PYTHON, str(SCRIPT_DIR / "basic_drum_engine.py")],
            input=inp,
            capture_output=True,
            text=True,
            timeout=120,
            cwd=str(APP_ROOT),
        )
        if r.returncode != 0 or not r.stdout.strip():
            return None
        return json.loads(r.stdout.strip())
    except Exception:
        return None


_ROLE_PITCH = {
    "drums_kick": [36],
    "drums_snare": [38],
    "drums_tops": [42],
    "drums_perc": [47],
}


def read_midi_onsets(
    midi_path: Path,
    role: str,
    min_velocity_threshold: int = MAIN_MIN_VELOCITY_DEFAULT,
) -> list[tuple[float, int]]:
    try:
        import pretty_midi
        pm = pretty_midi.PrettyMIDI(str(midi_path))
        pitches = set(_ROLE_PITCH.get(role, [36]))
        out = []
        for inst in pm.instruments:
            if not inst.is_drum:
                continue
            for n in inst.notes:
                if int(n.pitch) not in pitches or n.velocity <= VEL_ANCHOR_MAX or n.velocity < min_velocity_threshold:
                    continue
                out.append((float(n.start), int(n.velocity)))
        return sorted(out, key=lambda x: x[0])
    except Exception:
        return []


def compute_metrics(gt_times: list[float], detected: list[tuple[float, int]]) -> tuple[float, float]:
    gt_sorted = sorted(float(t) for t in gt_times)
    det_sorted = sorted(float(t) for t, _ in detected)

    if not gt_sorted:
        recall = 1.0
        precision = 1.0 if not det_sorted else 0.0
        return (recall, precision)

    i = 0
    j = 0
    matched = 0
    while i < len(gt_sorted) and j < len(det_sorted):
        dt = det_sorted[j] - gt_sorted[i]
        if abs(dt) <= MATCH_SEC:
            matched += 1
            i += 1
            j += 1
        elif det_sorted[j] < gt_sorted[i] - MATCH_SEC:
            j += 1
        else:
            i += 1

    recall = matched / len(gt_sorted)
    precision = matched / len(det_sorted) if det_sorted else 1.0
    return (recall, precision)


def check_duration(midi_path: Path, expected_sec: float) -> bool:
    try:
        import pretty_midi
        pm = pretty_midi.PrettyMIDI(str(midi_path))
        end = float(pm.get_end_time()) if pm.get_end_time() else 0.0
        return abs(end - expected_sec) < 0.5
    except Exception:
        return False


def main() -> int:
    ap = __import__("argparse").ArgumentParser(description="Internal eval: 50 drum packs vs engine")
    ap.add_argument("packs_dir", type=str, nargs="?", default=None, help="Packs dir (default: .internal_eval/packs)")
    ap.add_argument("--ledger", type=str, default="", help="Write ledger JSON here")
    ap.add_argument(
        "--min-velocity-threshold",
        type=int,
        default=MAIN_MIN_VELOCITY_DEFAULT,
        help="Only score hits with MIDI velocity >= this value (mains-only gate)",
    )
    ap.add_argument(
        "--sample-dir",
        type=str,
        default="",
        help="Optional sample kit directory; if set, passes sampleDir to engine for resynth smoke-test",
    )
    ap.add_argument(
        "--use-backend-hints",
        action="store_true",
        help="Enable inline backend hints + DrummerKnowledgeRescue (Phase 2)",
    )
    ap.add_argument(
        "--use-real-backend",
        action="store_true",
        help="Enable Demucs stem separation + Omnizart CNN + DrummerKnowledgeRescue (Phase 3)",
    )
    args = ap.parse_args()
    sample_dir: Path | None = None
    if args.sample_dir:
        candidate = Path(args.sample_dir).resolve()
        if candidate.is_dir():
            sample_dir = candidate
    packs_dir = Path(args.packs_dir) if args.packs_dir else APP_ROOT / ".internal_eval" / "packs"
    packs_dir = packs_dir.resolve()
    if not packs_dir.is_dir():
        print(f"Run drum_pack_generator.py first to create packs in {packs_dir}", file=sys.stderr)
        return 1

    key_files = sorted(packs_dir.glob("*_key.json"))
    if not key_files:
        print(f"No *_key.json found in {packs_dir}", file=sys.stderr)
        return 1

    ledger = []
    passed = 0
    for kf in key_files:
        with open(kf) as f:
            key = json.load(f)
        pid = key["id"]
        wav_path = packs_dir / f"{pid}.wav"
        if not wav_path.is_file():
            ledger.append({"id": pid, "style": key.get("style"), "pass": False, "error": "missing_wav"})
            continue
        out_dir = packs_dir / "out" / pid
        out_dir.mkdir(parents=True, exist_ok=True)
        paths = run_engine(wav_path, out_dir, key["bpm"], args.min_velocity_threshold, sample_dir=sample_dir, use_backend_hints=args.use_backend_hints, use_real_backend=args.use_real_backend)
        if not paths:
            ledger.append({"id": pid, "style": key.get("style"), "pass": False, "error": "engine_failed"})
            continue
        kick_path = paths.get("drums_kick")
        snare_path = paths.get("drums_snare")
        if not kick_path or not Path(kick_path).is_file() or not snare_path or not Path(snare_path).is_file():
            ledger.append({"id": pid, "style": key.get("style"), "pass": False, "error": "missing_midi"})
            continue

        kick_gt = key.get("kick_times", [])
        snare_gt = key.get("snare_times", [])
        tops_gt = key.get("tops_times", [])
        kick_det = read_midi_onsets(Path(kick_path), "drums_kick", args.min_velocity_threshold)
        snare_det = read_midi_onsets(Path(snare_path), "drums_snare", args.min_velocity_threshold)
        # Tops detection: merge drums_tops (pitch 42) + drums_perc (pitch 47) into one list.
        tops_path = paths.get("drums_tops")
        perc_path = paths.get("drums_perc")
        tops_det: list[tuple[float, int]] = []
        if tops_path and Path(tops_path).is_file():
            tops_det.extend(read_midi_onsets(Path(tops_path), "drums_tops", args.min_velocity_threshold))
        if perc_path and Path(perc_path).is_file():
            tops_det.extend(read_midi_onsets(Path(perc_path), "drums_perc", args.min_velocity_threshold))
        tops_det.sort(key=lambda x: x[0])

        kick_recall, kick_prec = compute_metrics(kick_gt, kick_det)
        snare_recall, snare_prec = compute_metrics(snare_gt, snare_det)
        tops_recall, tops_prec = compute_metrics(tops_gt, tops_det)
        len_ok = check_duration(Path(kick_path), key["duration_sec"]) and check_duration(Path(snare_path), key["duration_sec"])

        pass_kick = (kick_recall >= RECALL_MIN and kick_prec >= PRECISION_MIN) if kick_gt else (len(kick_det) <= 1)
        pass_snare = (snare_recall >= RECALL_MIN and snare_prec >= PRECISION_MIN) if snare_gt else (len(snare_det) <= 1)
        pass_tops = (tops_recall >= RECALL_MIN and tops_prec >= PRECISION_MIN) if tops_gt else True
        ok = pass_kick and pass_snare and pass_tops and len_ok
        if ok:
            passed += 1

        ledger.append({
            "id": pid,
            "style": key.get("style"),
            "bpm": key.get("bpm"),
            "kick_gt": len(kick_gt),
            "kick_det": len(kick_det),
            "kick_recall": round(kick_recall, 4),
            "kick_precision": round(kick_prec, 4),
            "snare_gt": len(snare_gt),
            "snare_det": len(snare_det),
            "snare_recall": round(snare_recall, 4),
            "snare_precision": round(snare_prec, 4),
            "tops_gt": len(tops_gt),
            "tops_det": len(tops_det),
            "tops_recall": round(tops_recall, 4),
            "tops_precision": round(tops_prec, 4),
            "length_ok": len_ok,
            "pass": ok,
        })
        print(f"  {pid} {key.get('style', '')} — {'PASS' if ok else 'FAIL'} (K R/P: {kick_recall:.2f}/{kick_prec:.2f} S R/P: {snare_recall:.2f}/{snare_prec:.2f} T R/P: {tops_recall:.2f}/{tops_prec:.2f})")

    total = len(ledger)
    pct = 100.0 * passed / total if total else 0
    if args.ledger:
        with open(args.ledger, "w") as f:
            json.dump(
                {
                    "summary": {"passed": passed, "total": total, "pct": round(pct, 1)},
                    "scoring": {
                        "matchSec": MATCH_SEC,
                        "recallMin": RECALL_MIN,
                        "precisionMin": PRECISION_MIN,
                        "minVelocityThreshold": int(args.min_velocity_threshold),
                    },
                    "cases": ledger,
                },
                f,
                indent=2,
            )
    print(f"\n=== INTERNAL EVAL: {passed}/{total} passed ({pct:.1f}%) ===")
    if pct < 90:
        print("Target: 90%. Tune engine and re-run.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
