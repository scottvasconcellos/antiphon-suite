#!/usr/bin/env python3
"""
Blind manual benchmark evaluator for real stems.

Anti-cheat behavior:
 - Engine runs on randomized copied audio paths in a blind input folder.
 - Key MIDI file path is never passed to engine.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import uuid
from collections import Counter, defaultdict
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
APP_ROOT = SCRIPT_DIR.parent
MATCH_SEC = 0.08
RECALL_MIN = 0.90
PRECISION_MIN = 0.85
VEL_ANCHOR_MAX = 1
MAIN_MIN_VELOCITY_DEFAULT = 40
DEFAULT_KICK_PITCHES = {35, 36}
DEFAULT_SNARE_PITCHES = {38, 40, 37, 39}


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
        if debug_events_path is not None:
            payload["debugEventsPath"] = str(debug_events_path.resolve())
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


def _mean(xs: list[float]) -> float:
    return float(sum(xs) / len(xs)) if xs else 0.0


def _debug_summary(debug_path: Path) -> dict | None:
    if not debug_path.is_file():
        return None
    try:
        with open(debug_path) as f:
            payload = json.load(f)
    except Exception:
        return None

    events = payload.get("events") or []
    clusters = ((payload.get("merge_diagnostics") or {}).get("clusters") or [])
    nms_dropped = ((payload.get("merge_diagnostics") or {}).get("nms") or {}).get("dropped") or []

    decision_counts: Counter = Counter()
    cluster_drop_counts: Counter = Counter()
    nms_drop_counts: Counter = Counter()
    for c in clusters:
        decision_counts[str(c.get("decision") or "unknown")] += 1
        for d in c.get("drops") or []:
            cluster_drop_counts[str(d.get("reason") or "unknown")] += 1
    for d in nms_dropped:
        nms_drop_counts[str(d.get("reason") or "unknown")] += 1

    role_counts: Counter = Counter()
    kick_conf: list[float] = []
    snare_conf: list[float] = []
    kick_margin: list[float] = []
    snare_margin: list[float] = []
    for e in events:
        role = str(e.get("role") or "unknown")
        role_counts[role] += 1
        conf = float(e.get("confidence") or 0.0)
        margin = float(e.get("margin") or 0.0)
        if role == "drums_kick":
            kick_conf.append(conf)
            kick_margin.append(margin)
        elif role == "drums_snare":
            snare_conf.append(conf)
            snare_margin.append(margin)

    return {
        "eventCount": int(len(events)),
        "roleCounts": dict(role_counts),
        "decisionCounts": dict(decision_counts),
        "clusterDropReasonCounts": dict(cluster_drop_counts),
        "nmsDropReasonCounts": dict(nms_drop_counts),
        "kickConfidenceMean": round(_mean(kick_conf), 6),
        "snareConfidenceMean": round(_mean(snare_conf), 6),
        "kickMarginMean": round(_mean(kick_margin), 6),
        "snareMarginMean": round(_mean(snare_margin), 6),
    }


def read_times_from_midi(
    midi_path: Path,
    pitches: set[int] | None = None,
    min_velocity_threshold: int = MAIN_MIN_VELOCITY_DEFAULT,
) -> list[float]:
    try:
        import pretty_midi
    except Exception:
        return []
    try:
        pm = pretty_midi.PrettyMIDI(str(midi_path))
    except Exception:
        return []
    out: list[float] = []
    for inst in pm.instruments:
        for n in inst.notes:
            if n.velocity <= VEL_ANCHOR_MAX or n.velocity < min_velocity_threshold:
                continue
            if pitches is None or int(n.pitch) in pitches:
                out.append(float(n.start))
    out.sort()
    return out


def read_engine_times(
    midi_path: Path,
    role: str,
    min_velocity_threshold: int = MAIN_MIN_VELOCITY_DEFAULT,
) -> list[float]:
    pitch = 36 if role == "drums_kick" else 38
    try:
        import pretty_midi
    except Exception:
        return []
    try:
        pm = pretty_midi.PrettyMIDI(str(midi_path))
    except Exception:
        return []
    out = []
    for inst in pm.instruments:
        if not inst.is_drum:
            continue
        for n in inst.notes:
            if n.velocity <= VEL_ANCHOR_MAX or n.velocity < min_velocity_threshold:
                continue
            if n.pitch == pitch:
                out.append(float(n.start))
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


def _count_matches(gt_times: list[float], det_times: list[float], tol: float) -> int:
    gt_sorted = sorted(gt_times)
    det_sorted = sorted(det_times)
    i = 0
    j = 0
    matched = 0
    while i < len(gt_sorted) and j < len(det_sorted):
        dt = det_sorted[j] - gt_sorted[i]
        if abs(dt) <= tol:
            matched += 1
            i += 1
            j += 1
        elif det_sorted[j] < gt_sorted[i] - tol:
            j += 1
        else:
            i += 1
    return matched


def estimate_best_offset(gt_times: list[float], det_times: list[float], tol: float = MATCH_SEC) -> float:
    """
    Estimate fixed sync offset between key-MIDI timeline and detected timeline.
    Positive offset means: shifted_gt = gt + offset.
    """
    if not gt_times or not det_times:
        return 0.0

    gt = sorted(gt_times)
    det = sorted(det_times)
    max_candidates = 32
    gt_s = gt[:max_candidates]
    det_s = det[:max_candidates]
    candidates = {0.0}
    for dg in det_s:
        for gg in gt_s:
            off = dg - gg
            if -4.0 <= off <= 4.0:
                candidates.add(round(off, 3))
    # Include median-based candidate for stability on dense files.
    candidates.add(round((det[len(det) // 2] - gt[len(gt) // 2]), 3))

    best = 0.0
    best_score = (-1, 0.0)
    for off in sorted(candidates):
        shifted = [t + off for t in gt]
        m = _count_matches(shifted, det, tol)
        # maximize matches, then prefer smaller absolute offset
        score = (m, -abs(off))
        if score > best_score:
            best_score = score
            best = off
    return float(best)


def estimate_best_affine_sync(
    gt_times: list[float],
    det_times: list[float],
    tol: float = MATCH_SEC,
    *,
    scale_min: float = 0.97,
    scale_max: float = 1.03,
    scale_step: float = 0.001,
) -> tuple[float, float]:
    """
    Estimate (scale, offset) such that transformed_gt = gt * scale + offset best matches detected times.
    Bounded scale keeps alignment conservative for anti-cheat evaluation.
    """
    if not gt_times or not det_times:
        return (1.0, 0.0)

    gt = sorted(gt_times)
    det = sorted(det_times)
    max_pairs = 16
    gt_s = gt[:max_pairs]
    det_s = det[:max_pairs]
    n_scale = int(round((scale_max - scale_min) / scale_step))
    scale_values = [scale_min + i * scale_step for i in range(max(0, n_scale) + 1)]

    best_scale = 1.0
    best_offset = 0.0
    best_score = (-1, float("-inf"), float("-inf"))

    for scale in scale_values:
        offsets = {0.0, round(det[len(det) // 2] - scale * gt[len(gt) // 2], 3)}
        for dg in det_s:
            for gg in gt_s:
                off = dg - scale * gg
                if -4.0 <= off <= 4.0:
                    offsets.add(round(off, 3))
        for off in sorted(offsets):
            shifted = [t * scale + off for t in gt]
            matched = _count_matches(shifted, det, tol)
            score = (
                matched,
                -abs(scale - 1.0),
                -abs(off),
            )
            if score > best_score:
                best_score = score
                best_scale = float(scale)
                best_offset = float(off)
    return (best_scale, best_offset)


def _build_key_map(
    run_clips: list[dict], keys_clips: list[dict], run_manifest_dir: Path, keys_manifest_dir: Path
) -> dict[str, dict]:
    by_id: dict[str, dict] = {}
    for kc in keys_clips:
        clip_id = kc.get("id")
        if not clip_id:
            continue
        by_id[clip_id] = kc

    out: dict[str, dict] = {}
    for rc in run_clips:
        clip_id = rc.get("id")
        if not clip_id:
            continue
        if clip_id in by_id:
            out[clip_id] = by_id[clip_id]
            continue
        if rc.get("midiPath"):
            out[clip_id] = {
                "id": clip_id,
                "midiPath": rc["midiPath"],
                "kickPitches": rc.get("kickPitches"),
                "snarePitches": rc.get("snarePitches"),
            }
            continue
        out[clip_id] = {}

    for clip_id, info in out.items():
        midi = info.get("midiPath")
        if midi:
            base = keys_manifest_dir if clip_id in by_id else run_manifest_dir
            info["midiPath"] = str(_resolve(midi, base))
    return out


def _style_summary(rows: list[dict], key: str) -> dict[str, dict]:
    by_group: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_group[str(r.get(key) or "unknown")].append(r)
    out: dict[str, dict] = {}
    for group in sorted(by_group.keys()):
        entries = by_group[group]
        passed = sum(1 for e in entries if e.get("pass"))
        total = len(entries)
        out[group] = {"passed": passed, "total": total, "pct": round(100.0 * passed / total, 1) if total else 0.0}
    return out


def _load_ids_filter(path: Path) -> set[str]:
    with open(path) as f:
        raw = f.read().strip()
    if not raw:
        return set()
    try:
        payload = json.loads(raw)
        if isinstance(payload, list):
            return {str(x).strip() for x in payload if str(x).strip()}
    except Exception:
        pass
    return {line.strip() for line in raw.splitlines() if line.strip()}


def main() -> int:
    ap = argparse.ArgumentParser(description="Blind manual eval for real drum test sets")
    ap.add_argument(
        "--run-manifest",
        type=str,
        default=str(APP_ROOT / ".internal_eval" / "manual_tests" / "holdout_run_manifest.json"),
        help="Manifest with clips to run (audio path and id required)",
    )
    ap.add_argument(
        "--keys-manifest",
        type=str,
        default=str(APP_ROOT / ".internal_eval" / "manual_tests" / "holdout_keys_manifest.json"),
        help="Manifest with key MIDI paths by clip id",
    )
    ap.add_argument(
        "--ledger",
        type=str,
        default=str(APP_ROOT / ".internal_eval" / "manual_tests" / "ledgers" / "holdout_latest.json"),
        help="Ledger output path",
    )
    ap.add_argument(
        "--out-dir",
        type=str,
        default=str(APP_ROOT / ".internal_eval" / "manual_tests" / "out"),
        help="Output directory for engine midi outputs",
    )
    ap.add_argument("--threshold", type=float, default=90.0, help="Required pass percent")
    ap.add_argument(
        "--engine-timeout-sec",
        type=int,
        default=240,
        help="Per-clip timeout for basic_drum_engine.py subprocess",
    )
    ap.add_argument("--require", action="store_true", help="Fail if manifests missing/empty")
    ap.add_argument("--no-blind-copy", action="store_true", help="Disable randomized blind audio copy")
    ap.add_argument("--id-regex", type=str, default="", help="Only evaluate clip IDs matching this regex")
    ap.add_argument("--ids-file", type=str, default="", help="Optional file with clip IDs (JSON list or newline-delimited)")
    ap.add_argument("--max-clips", type=int, default=0, help="Optional cap on number of clips after filtering (0 = all)")
    ap.add_argument(
        "--no-sync-align",
        action="store_true",
        help="Disable key-origin normalization + fixed offset alignment during scoring",
    )
    ap.add_argument(
        "--sync-align-mode",
        type=str,
        default="affine",
        choices=["offset", "affine"],
        help="Sync alignment mode for key->det timeline mapping",
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
    ap.add_argument(
        "--emit-engine-debug",
        action="store_true",
        help="Write per-clip engine debug JSON and attach summaries to ledger rows",
    )
    ap.add_argument(
        "--debug-events-dir",
        type=str,
        default="",
        help="Directory for debug event JSON (default: <out-dir>/_engine_debug)",
    )
    args = ap.parse_args()

    run_manifest_path = Path(args.run_manifest).resolve()
    keys_manifest_path = Path(args.keys_manifest).resolve()
    blind_copy = not args.no_blind_copy

    if not run_manifest_path.is_file():
        if args.require:
            print(f"Run manifest not found: {run_manifest_path}", file=sys.stderr)
            return 1
        print(f"No run manifest found at {run_manifest_path}; skipping.")
        return 0

    with open(run_manifest_path) as f:
        run_manifest = json.load(f)
    run_clips = run_manifest.get("clips", [])

    if args.id_regex:
        pattern = re.compile(args.id_regex)
        run_clips = [c for c in run_clips if pattern.search(str(c.get("id") or ""))]

    if args.ids_file:
        ids_path = Path(args.ids_file).resolve()
        if not ids_path.is_file():
            print(f"IDs file not found: {ids_path}", file=sys.stderr)
            return 1
        selected_ids = _load_ids_filter(ids_path)
        run_clips = [c for c in run_clips if str(c.get("id") or "") in selected_ids]

    if args.max_clips and args.max_clips > 0:
        run_clips = run_clips[: args.max_clips]

    if not run_clips:
        if args.require:
            print(f"Run manifest has no clips: {run_manifest_path}", file=sys.stderr)
            return 1
        print(f"No clips in run manifest: {run_manifest_path}; skipping.")
        return 0

    keys_clips = []
    if keys_manifest_path.is_file():
        with open(keys_manifest_path) as f:
            keys_manifest = json.load(f)
        keys_clips = keys_manifest.get("clips", [])
    elif args.require:
        print(f"Keys manifest not found: {keys_manifest_path}", file=sys.stderr)
        return 1

    out_root = Path(args.out_dir).resolve()
    out_root.mkdir(parents=True, exist_ok=True)
    blind_root = out_root / "_blind_inputs"
    blind_root.mkdir(parents=True, exist_ok=True)
    if args.emit_engine_debug:
        debug_root = Path(args.debug_events_dir).resolve() if args.debug_events_dir else (out_root / "_engine_debug")
        debug_root.mkdir(parents=True, exist_ok=True)
    else:
        debug_root = None

    key_map = _build_key_map(run_clips, keys_clips, run_manifest_path.parent, keys_manifest_path.parent)
    do_sync_align = not args.no_sync_align

    ledger_rows: list[dict] = []
    passed = 0
    total_clips = len(run_clips)
    for idx, clip in enumerate(run_clips, start=1):
        cid = clip.get("id") or f"clip_{len(ledger_rows):03d}"
        print(f"[{idx}/{total_clips}] {cid}", flush=True)
        audio_path = _resolve(clip["audioPath"], run_manifest_path.parent)
        key_info = key_map.get(cid) or {}
        midi_path_str = key_info.get("midiPath")
        midi_path = Path(midi_path_str) if midi_path_str else None

        if not audio_path.is_file() or not midi_path or not midi_path.is_file():
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
            continue

        run_audio = audio_path
        if blind_copy:
            ext = audio_path.suffix.lower() or ".wav"
            blind_dir = blind_root / cid
            blind_dir.mkdir(parents=True, exist_ok=True)
            blind_name = f"{uuid.uuid4().hex}{ext}"
            blind_audio = blind_dir / blind_name
            shutil.copy2(audio_path, blind_audio)
            run_audio = blind_audio

        out_dir = out_root / cid
        out_dir.mkdir(parents=True, exist_ok=True)
        debug_path = (debug_root / f"{cid}_events.json") if debug_root is not None else None
        engine_out, engine_err = run_engine(
            run_audio,
            out_dir,
            clip.get("bpm"),
            args.engine_timeout_sec,
            args.min_velocity_threshold,
            args.enable_asymmetric_precision_gate,
            debug_events_path=debug_path,
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
            continue

        kick_gt_raw = read_times_from_midi(
            midi_path,
            set(key_info.get("kickPitches") or sorted(DEFAULT_KICK_PITCHES)),
            min_velocity_threshold=args.min_velocity_threshold,
        )
        snare_gt_raw = read_times_from_midi(
            midi_path,
            set(key_info.get("snarePitches") or sorted(DEFAULT_SNARE_PITCHES)),
            min_velocity_threshold=args.min_velocity_threshold,
        )
        key_all = read_times_from_midi(midi_path, None, min_velocity_threshold=args.min_velocity_threshold)
        key_origin = min(key_all) if key_all else 0.0

        kick_det = read_engine_times(
            Path(engine_out["drums_kick"]),
            "drums_kick",
            min_velocity_threshold=args.min_velocity_threshold,
        )
        snare_det = read_engine_times(
            Path(engine_out["drums_snare"]),
            "drums_snare",
            min_velocity_threshold=args.min_velocity_threshold,
        )

        if do_sync_align:
            kick_gt = [t - key_origin for t in kick_gt_raw]
            snare_gt = [t - key_origin for t in snare_gt_raw]
            gt_all = sorted(kick_gt + snare_gt)
            det_all = sorted(kick_det + snare_det)
            if args.sync_align_mode == "affine":
                sync_scale, sync_offset = estimate_best_affine_sync(gt_all, det_all, tol=MATCH_SEC)
            else:
                sync_scale, sync_offset = (1.0, estimate_best_offset(gt_all, det_all, tol=MATCH_SEC))
            kick_gt = [t * sync_scale + sync_offset for t in kick_gt]
            snare_gt = [t * sync_scale + sync_offset for t in snare_gt]
        else:
            kick_gt = kick_gt_raw
            snare_gt = snare_gt_raw
            sync_scale = 1.0
            sync_offset = 0.0

        kick_recall, kick_prec = compute_metrics(kick_gt, kick_det)
        snare_recall, snare_prec = compute_metrics(snare_gt, snare_det)

        pass_kick = (kick_recall >= RECALL_MIN and kick_prec >= PRECISION_MIN) if kick_gt else (len(kick_det) <= 1)
        pass_snare = (snare_recall >= RECALL_MIN and snare_prec >= PRECISION_MIN) if snare_gt else (len(snare_det) <= 1)
        ok = pass_kick and pass_snare
        if ok:
            passed += 1

        row = {
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
            "key_origin_sec": round(key_origin, 4),
            "sync_scale": round(sync_scale, 6),
            "sync_offset_sec": round(sync_offset, 4),
            "pass": ok,
        }
        if debug_path is not None:
            row["debugEventsPath"] = str(debug_path.resolve())
            debug_summary = _debug_summary(debug_path)
            if debug_summary is not None:
                row["engineDebugSummary"] = debug_summary
        ledger_rows.append(row)
        print(
            f"  {cid} — {'PASS' if ok else 'FAIL'} "
            f"(K R/P: {kick_recall:.2f}/{kick_prec:.2f} S R/P: {snare_recall:.2f}/{snare_prec:.2f})",
            flush=True,
        )

    total = len(ledger_rows)
    pct = round(100.0 * passed / total, 1) if total else 0.0
    by_style = _style_summary(ledger_rows, "style")
    by_meter = _style_summary(ledger_rows, "meter")
    failure_modes = {
        "kick_recall": sum(1 for r in ledger_rows if r.get("kick_recall", 1.0) < RECALL_MIN),
        "kick_precision": sum(1 for r in ledger_rows if r.get("kick_precision", 1.0) < PRECISION_MIN),
        "snare_recall": sum(1 for r in ledger_rows if r.get("snare_recall", 1.0) < RECALL_MIN),
        "snare_precision": sum(1 for r in ledger_rows if r.get("snare_precision", 1.0) < PRECISION_MIN),
    }
    debug_decisions: Counter = Counter()
    debug_cluster_drop_reasons: Counter = Counter()
    debug_nms_drop_reasons: Counter = Counter()
    debug_kick_margin: list[float] = []
    debug_snare_margin: list[float] = []
    for r in ledger_rows:
        ds = r.get("engineDebugSummary")
        if not isinstance(ds, dict):
            continue
        for k, v in (ds.get("decisionCounts") or {}).items():
            debug_decisions[str(k)] += int(v)
        for k, v in (ds.get("clusterDropReasonCounts") or {}).items():
            debug_cluster_drop_reasons[str(k)] += int(v)
        for k, v in (ds.get("nmsDropReasonCounts") or {}).items():
            debug_nms_drop_reasons[str(k)] += int(v)
        debug_kick_margin.append(float(ds.get("kickMarginMean") or 0.0))
        debug_snare_margin.append(float(ds.get("snareMarginMean") or 0.0))

    ledger = {
        "summary": {"passed": passed, "total": total, "pct": pct},
        "config": {
            "runManifest": str(run_manifest_path),
            "keysManifest": str(keys_manifest_path),
            "outDir": str(out_root),
            "blindCopy": blind_copy,
            "syncAlign": do_sync_align,
            "syncAlignMode": args.sync_align_mode,
            "threshold": args.threshold,
            "minVelocityThreshold": int(args.min_velocity_threshold),
            "enableAsymmetricPrecisionGate": bool(args.enable_asymmetric_precision_gate),
            "emitEngineDebug": bool(args.emit_engine_debug),
            "enginePython": ENGINE_PYTHON,
        },
        "scoring": {
            "matchSec": MATCH_SEC,
            "recallMin": RECALL_MIN,
            "precisionMin": PRECISION_MIN,
            "minVelocityThreshold": int(args.min_velocity_threshold),
        },
        "byStyle": by_style,
        "byMeter": by_meter,
        "failureModes": failure_modes,
        "engineDebugAggregate": {
            "decisionCounts": dict(debug_decisions),
            "clusterDropReasonCounts": dict(debug_cluster_drop_reasons),
            "nmsDropReasonCounts": dict(debug_nms_drop_reasons),
            "kickMarginMeanOfMeans": round(_mean(debug_kick_margin), 6),
            "snareMarginMeanOfMeans": round(_mean(debug_snare_margin), 6),
        },
        "clips": ledger_rows,
    }

    ledger_path = Path(args.ledger).resolve()
    ledger_path.parent.mkdir(parents=True, exist_ok=True)
    with open(ledger_path, "w") as f:
        json.dump(ledger, f, indent=2)
    print(f"Ledger written to {ledger_path}")
    print(f"\n=== BLIND MANUAL EVAL: {passed}/{total} passed ({pct:.1f}%) ===")
    return 0 if pct >= args.threshold else 1


if __name__ == "__main__":
    raise SystemExit(main())
