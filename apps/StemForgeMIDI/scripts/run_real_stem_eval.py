#!/usr/bin/env python3
"""
Real-stem benchmark evaluator.

Evaluates the drum engine on a manifest of audio + key MIDI pairs, without
blind-copy anti-cheat (intended for curated real stem sets).
"""

from __future__ import annotations

import argparse
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


def _resolve_engine_python() -> str:
    venv_py = APP_ROOT / ".venv" / "bin" / "python3"
    if venv_py.is_file():
        return str(venv_py)
    return sys.executable


ENGINE_PYTHON = _resolve_engine_python()


def _resolve(path_str: str, base_dir: Path) -> Path:
    p = Path(path_str)
    if not p.is_absolute():
        p = (base_dir / p).resolve()
    return p


def run_engine(
    audio_path: Path,
    output_dir: Path,
    bpm: float | None,
    timeout_sec: int,
    min_velocity_threshold: int,
    enable_asymmetric_precision_gate: bool = False,
    use_backend_hints: bool = False,
    use_real_backend: bool = False,
    use_onset_suppressor: bool = False,
    enable_kick_reverb_snare_filter: bool = False,
    kick_reverb_low_sub_max: float = 0.0,
    enable_kick_grid_suppressor: bool = False,
    enable_kick_sub_share_gate: bool = False,
    enable_snare_sub_share_gate: bool = False,
    enable_808_kick_path: bool = False,
    debug_events_path: Path | None = None,
) -> tuple[dict[str, str] | None, str]:
    try:
        payload = {
            "audioPath": str(audio_path.resolve()),
            "outputDir": str(output_dir.resolve()),
            "useRawMidi": False,
            **({"bpm": bpm} if bpm and bpm > 0 else {}),
            "minVelocityThreshold": int(min_velocity_threshold),
            "enableAsymmetricPrecisionGate": bool(enable_asymmetric_precision_gate),
        }
        if use_onset_suppressor:
            payload["useOnsetSuppressor"] = True
        if enable_kick_reverb_snare_filter:
            payload["enableKickReverbSnareFilter"] = True
        if kick_reverb_low_sub_max > 0.0:
            payload["kickReverbLowSubMax"] = kick_reverb_low_sub_max
        if enable_kick_grid_suppressor:
            payload["enableKickGridSuppressor"] = True
        if enable_kick_sub_share_gate:
            payload["enableKickSubShareGate"] = True
        if enable_snare_sub_share_gate:
            payload["enableSnareSubShareGate"] = True
        if enable_808_kick_path:
            payload["enable808KickPath"] = True
        if debug_events_path is not None:
            payload["debugEventsPath"] = str(debug_events_path)
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
            timeout=timeout_sec,
            cwd=str(APP_ROOT),
        )
        if r.returncode != 0:
            return (None, (r.stderr or "").strip()[:400])
        if not r.stdout.strip():
            return (None, "empty_stdout")
        return (json.loads(r.stdout.strip()), "")
    except Exception:
        return (None, "engine_exception")


def read_times_from_midi(midi_path: Path, pitches: list[int], min_velocity_threshold: int) -> list[float]:
    try:
        import pretty_midi
    except Exception:
        return []
    try:
        pm = pretty_midi.PrettyMIDI(str(midi_path))
    except Exception:
        return []
    pitch_set = set(pitches)
    out: list[float] = []
    for inst in pm.instruments:
        if not inst.is_drum:
            continue
        for n in inst.notes:
            if n.velocity <= VEL_ANCHOR_MAX or n.velocity < min_velocity_threshold:
                continue
            if int(n.pitch) in pitch_set:
                out.append(float(n.start))
    out.sort()
    return out


def read_times_from_enst_txt(txt_path: Path, labels: list[str], min_velocity_threshold: int) -> list[float]:
    """Read onset times from ENST-drums annotation text files (format: time_sec label)."""
    label_set = set(labels)
    out: list[float] = []
    try:
        with open(txt_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parts = line.split()
                if len(parts) < 2:
                    continue
                try:
                    t = float(parts[0])
                except ValueError:
                    continue
                if parts[1] in label_set:
                    out.append(t)
    except Exception:
        return []
    out.sort()
    return out


def compute_metrics(gt_times: list[float], det_times: list[float]) -> tuple[float, float]:
    gt_sorted = sorted(float(t) for t in gt_times)
    det_sorted = sorted(float(t) for t in det_times)
    if not gt_sorted:
        return (1.0, 1.0 if not det_sorted else 0.0)
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


def main() -> int:
    ap = argparse.ArgumentParser(description="Real-stem eval for drum engine")
    ap.add_argument(
        "--manifest",
        type=str,
        default=str(APP_ROOT / ".internal_eval" / "real_stems" / "manifest.json"),
        help="Manifest with clips (audioPath, midiPath, id, optional bpm/style/meter)",
    )
    ap.add_argument(
        "--ledger",
        type=str,
        default=str(APP_ROOT / ".internal_eval" / "real_stems" / "ledger_latest.json"),
        help="Ledger output path",
    )
    ap.add_argument("--threshold", type=float, default=85.0, help="Required pass percent")
    ap.add_argument(
        "--engine-timeout-sec",
        type=int,
        default=240,
        help="Per-clip timeout for basic_drum_engine.py subprocess",
    )
    ap.add_argument("--require", action="store_true", help="Fail if manifest missing/empty")
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
    ap.add_argument(
        "--use-onset-suppressor",
        action="store_true",
        help="Enable Phase 4 onset-level binary suppressor (trained logistic classifier)",
    )
    ap.add_argument(
        "--enable-kick-reverb-snare-filter",
        action="store_true",
        help="Enable kick-reverb snare filter (post-NMS: suppress high-sub snares near kicks)",
    )
    ap.add_argument(
        "--kick-reverb-low-sub-max",
        type=float,
        default=0.0,
        help="Arm B of kick-reverb snare filter: also suppress near-kick snares with sub_share < this (0=disabled)",
    )
    ap.add_argument(
        "--enable-kick-grid-suppressor",
        action="store_true",
        help="Enable beat-grid kick suppressor (suppress off-grid kick FPs when BPM known)",
    )
    ap.add_argument(
        "--enable-kick-sub-share-gate",
        action="store_true",
        help="Enable post-NMS kick sub_share floor gate (suppress low-sub FP kicks from resonance/toms)",
    )
    ap.add_argument(
        "--enable-snare-sub-share-gate",
        action="store_true",
        help="Enable post-NMS snare sub_share ceiling gate (suppress high-sub FP snares from bass bleed)",
    )
    ap.add_argument(
        "--enable-808-kick-path",
        action="store_true",
        help="Enable secondary 808/electronic kick classify path (high-attack, mid-present kicks)",
    )
    ap.add_argument(
        "--dump-kick-events",
        action="store_true",
        help="Dump per-event kick diagnostic CSV (clip, time_sec, sub_share, mid_share, velocity, matched_to_gt)",
    )
    ap.add_argument(
        "--dump-snare-events",
        action="store_true",
        help="Dump per-event snare diagnostic CSV (clip, time_sec, sub_share, mid_share, velocity, matched_to_gt)",
    )
    ap.add_argument(
        "--min-velocity-threshold",
        type=int,
        default=MAIN_MIN_VELOCITY_DEFAULT,
        help="Only score hits with MIDI velocity >= this value (mains-only gate)",
    )
    ap.add_argument(
        "--enable-asymmetric-precision-gate",
        action="store_true",
        help="Enable asymmetric precision margin gate in engine (experimental)",
    )
    args = ap.parse_args()

    manifest_path = Path(args.manifest).resolve()
    if not manifest_path.is_file():
        if args.require:
            print(f"Real-stem manifest not found: {manifest_path}", file=sys.stderr)
            return 1
        print(f"No real-stem manifest found at {manifest_path}; skipping.")
        return 0

    with open(manifest_path) as f:
        manifest = json.load(f)
    clips = manifest.get("clips", [])
    if not clips:
        if args.require:
            print(f"Real-stem manifest has no clips: {manifest_path}", file=sys.stderr)
            return 1
        print(f"No clips in real-stem manifest: {manifest_path}; skipping.")
        return 0

    base_dir = manifest_path.parent
    ledger_rows: list[dict] = []
    passed = 0
    scored_total = 0  # excludes eval_excluded clips

    dump_kick = getattr(args, "dump_kick_events", False)
    dump_snare = getattr(args, "dump_snare_events", False)
    if dump_kick:
        print("clip,time_sec,sub_share,mid_share,velocity,matched_to_gt", flush=True)
    if dump_snare and not dump_kick:
        print("clip,time_sec,sub_share,mid_share,velocity,matched_to_gt", flush=True)

    for idx, clip in enumerate(clips, start=1):
        cid = str(clip.get("id") or f"clip_{idx:03d}")
        is_excluded = bool(clip.get("eval_excluded", False))

        if is_excluded:
            print(f"[{idx}/{len(clips)}] {cid} [EXCLUDED] {clip.get('exclusion_reason', '')}", flush=True)
            ledger_rows.append(
                {
                    "id": cid,
                    "title": clip.get("title"),
                    "meter": clip.get("meter"),
                    "style": clip.get("style"),
                    "eval_excluded": True,
                    "exclusion_reason": clip.get("exclusion_reason", ""),
                }
            )
            continue

        print(f"[{idx}/{len(clips)}] {cid}", flush=True)
        audio_path = _resolve(clip["audioPath"], base_dir)
        midi_path = _resolve(clip["midiPath"], base_dir)

        if not audio_path.is_file() or not midi_path.is_file():
            ledger_rows.append(
                {
                    "id": cid,
                    "title": clip.get("title"),
                    "meter": clip.get("meter"),
                    "style": clip.get("style"),
                    "pass": False,
                    "error": "missing_audio_or_midi",
                }
            )
            scored_total += 1
            continue

        out_dir = (manifest_path.parent / "out" / cid).resolve()
        out_dir.mkdir(parents=True, exist_ok=True)
        debug_events_path = None
        if dump_kick or dump_snare:
            debug_events_path = out_dir / f"{cid}_events_debug.json"
        engine_out, engine_err = run_engine(
            audio_path,
            out_dir,
            clip.get("bpm"),
            args.engine_timeout_sec,
            args.min_velocity_threshold,
            args.enable_asymmetric_precision_gate,
            use_backend_hints=args.use_backend_hints,
            use_real_backend=args.use_real_backend,
            use_onset_suppressor=args.use_onset_suppressor,
            enable_kick_reverb_snare_filter=args.enable_kick_reverb_snare_filter,
            kick_reverb_low_sub_max=getattr(args, "kick_reverb_low_sub_max", 0.0),
            enable_kick_grid_suppressor=args.enable_kick_grid_suppressor,
            enable_kick_sub_share_gate=getattr(args, "enable_kick_sub_share_gate", False),
            enable_snare_sub_share_gate=getattr(args, "enable_snare_sub_share_gate", False),
            enable_808_kick_path=getattr(args, "enable_808_kick_path", False),
            debug_events_path=debug_events_path,
        )
        if not engine_out:
            ledger_rows.append(
                {
                    "id": cid,
                    "title": clip.get("title"),
                    "meter": clip.get("meter"),
                    "style": clip.get("style"),
                    "pass": False,
                    "error": "engine_failed",
                    "engineError": engine_err,
                }
            )
            scored_total += 1
            continue

        annotation_format = clip.get("annotation_format", "midi")
        # Contract V1 pitch mapping: kick=35+36, snare=38+40, tops=42-46, perc=49-51
        kick_pitches = clip.get("kick_pitches", [35, 36])
        snare_pitches = clip.get("snare_pitches", [38, 40])
        # Standard GM hi-hat/cymbal pitches: 42=closed HH, 43=high floor tom, 44=pedal HH,
        # 45=low tom, 46=open HH; perc (crash/ride) handled separately
        tops_pitches = clip.get("tops_pitches", [42, 43, 44, 45, 46])
        kick_labels = clip.get("kick_labels", ["bd"])
        snare_labels = clip.get("snare_labels", ["sd"])
        tops_labels = clip.get("tops_labels", ["c1", "o1", "rc", "cc"])

        if annotation_format == "enst_txt":
            kick_gt = read_times_from_enst_txt(midi_path, kick_labels, args.min_velocity_threshold)
            snare_gt = read_times_from_enst_txt(midi_path, snare_labels, args.min_velocity_threshold)
            tops_gt = read_times_from_enst_txt(midi_path, tops_labels, args.min_velocity_threshold)
        else:
            kick_gt = read_times_from_midi(midi_path, kick_pitches, args.min_velocity_threshold)
            snare_gt = read_times_from_midi(midi_path, snare_pitches, args.min_velocity_threshold)
            tops_gt = read_times_from_midi(midi_path, tops_pitches, args.min_velocity_threshold)

        kick_det = read_times_from_midi(Path(engine_out["drums_kick"]), [36], args.min_velocity_threshold)
        snare_det = read_times_from_midi(Path(engine_out["drums_snare"]), [38], args.min_velocity_threshold)
        # Tops detection: merge drums_tops (42) + drums_perc (47) from engine output.
        tops_det_times: list[float] = []
        if "drums_tops" in engine_out:
            tops_det_times.extend(read_times_from_midi(Path(engine_out["drums_tops"]), [42], args.min_velocity_threshold))
        if "drums_perc" in engine_out:
            tops_det_times.extend(read_times_from_midi(Path(engine_out["drums_perc"]), [47], args.min_velocity_threshold))
        tops_det_times.sort()

        kick_recall, kick_prec = compute_metrics(kick_gt, kick_det)
        snare_recall, snare_prec = compute_metrics(snare_gt, snare_det)
        tops_recall, tops_prec = compute_metrics(tops_gt, tops_det_times)

        pass_kick = (kick_recall >= RECALL_MIN and kick_prec >= PRECISION_MIN) if kick_gt else (len(kick_det) <= 1)
        pass_snare = (snare_recall >= RECALL_MIN and snare_prec >= PRECISION_MIN) if snare_gt else (len(snare_det) <= 1)
        # Tops is advisory for now: full-kit real audio has too much bleed to gate on precision.
        ok = pass_kick and pass_snare
        if ok:
            passed += 1
        scored_total += 1

        # Diagnostic: emit per-event CSV for kick and/or snare when requested
        if (dump_kick or dump_snare) and debug_events_path is not None and debug_events_path.is_file():
            import json as _json
            try:
                with open(debug_events_path) as _df:
                    _dbg = _json.load(_df)
                _all_events = _dbg.get("events", [])
                if dump_kick:
                    _kick_events = [e for e in _all_events if e.get("role") == "drums_kick"]
                    for _e in _kick_events:
                        _t = float(_e["time_sec"])
                        _matched = any(abs(_t - _gt) <= MATCH_SEC for _gt in kick_gt)
                        print(
                            f"{cid},{_t:.4f},{_e.get('sub_share',0):.4f},"
                            f"{_e.get('mid_share',0):.4f},{_e.get('velocity',0)},{int(_matched)}",
                            flush=True,
                        )
                if dump_snare:
                    _snare_events = [e for e in _all_events if e.get("role") == "drums_snare"]
                    for _e in _snare_events:
                        _t = float(_e["time_sec"])
                        _matched = any(abs(_t - _gt) <= MATCH_SEC for _gt in snare_gt)
                        print(
                            f"{cid},{_t:.4f},{_e.get('sub_share',0):.4f},"
                            f"{_e.get('mid_share',0):.4f},{_e.get('velocity',0)},{int(_matched)}",
                            flush=True,
                        )
            except Exception:
                pass

        ledger_rows.append(
            {
                "id": cid,
                "title": clip.get("title"),
                "meter": clip.get("meter"),
                "style": clip.get("style"),
                "kick_gt": len(kick_gt),
                "kick_det": len(kick_det),
                "kick_recall": round(kick_recall, 4),
                "kick_precision": round(kick_prec, 4),
                "snare_gt": len(snare_gt),
                "snare_det": len(snare_det),
                "snare_recall": round(snare_recall, 4),
                "snare_precision": round(snare_prec, 4),
                "tops_gt": len(tops_gt),
                "tops_det": len(tops_det_times),
                "tops_recall": round(tops_recall, 4),
                "tops_precision": round(tops_prec, 4),
                "pass": ok,
            }
        )
        print(
            f"  {cid} — {'PASS' if ok else 'FAIL'} "
            f"(K R/P: {kick_recall:.2f}/{kick_prec:.2f} S R/P: {snare_recall:.2f}/{snare_prec:.2f} T R/P: {tops_recall:.2f}/{tops_prec:.2f})",
            flush=True,
        )

    total = scored_total  # excludes eval_excluded clips
    pct = round(100.0 * passed / total, 1) if total else 0.0
    ledger = {
        "summary": {"passed": passed, "total": total, "pct": pct},
        "config": {
            "manifest": str(manifest_path),
            "threshold": args.threshold,
            "minVelocityThreshold": int(args.min_velocity_threshold),
            "enableAsymmetricPrecisionGate": bool(args.enable_asymmetric_precision_gate),
            "enginePython": ENGINE_PYTHON,
        },
        "scoring": {
            "matchSec": MATCH_SEC,
            "recallMin": RECALL_MIN,
            "precisionMin": PRECISION_MIN,
            "minVelocityThreshold": int(args.min_velocity_threshold),
        },
        "clips": ledger_rows,
    }

    ledger_path = Path(args.ledger).resolve()
    ledger_path.parent.mkdir(parents=True, exist_ok=True)
    with open(ledger_path, "w") as f:
        json.dump(ledger, f, indent=2)
    excluded_count = len(clips) - scored_total
    print(f"Ledger written to {ledger_path}")
    excluded_note = f" ({excluded_count} excluded from scoring)" if excluded_count else ""
    print(f"\n=== REAL STEM EVAL: {passed}/{total} passed ({pct:.1f}%){excluded_note} ===")
    return 0 if pct >= args.threshold else 1


if __name__ == "__main__":
    raise SystemExit(main())

