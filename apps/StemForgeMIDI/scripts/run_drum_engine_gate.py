#!/usr/bin/env python3
"""
Quality gate for drum engine changes.

Runs synthetic, manual-holdout, and real-stem benchmarks with pass-rate thresholds.
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
    """Prefer app .venv so eval and engine share the same deps (librosa, pretty_midi, etc.)."""
    venv_py = APP_ROOT / ".venv" / "bin" / "python3"
    if venv_py.is_file():
        return str(venv_py)
    return sys.executable


def _run(cmd: list[str]) -> tuple[int, str, str]:
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=str(APP_ROOT))
    return (r.returncode, r.stdout, r.stderr)


def _load_pct(ledger_path: Path, key: str) -> float:
    with open(ledger_path) as f:
        ledger = json.load(f)
    return float(ledger.get("summary", {}).get(key, 0.0))


def main() -> int:
    ap = argparse.ArgumentParser(description="Drum engine quality gate (synthetic + real benchmarks)")
    ap.add_argument("--synthetic-threshold", type=float, default=90.0, help="Required synthetic pass percent")
    ap.add_argument("--manual-threshold", type=float, default=90.0, help="Required manual holdout pass percent")
    ap.add_argument("--real-threshold", type=float, default=85.0, help="Required real-stem pass percent")
    ap.add_argument(
        "--manual-run-manifest",
        type=str,
        default=str(APP_ROOT / ".internal_eval" / "manual_tests" / "holdout_run_manifest.json"),
        help="Manual holdout run manifest path",
    )
    ap.add_argument(
        "--manual-keys-manifest",
        type=str,
        default=str(APP_ROOT / ".internal_eval" / "manual_tests" / "holdout_keys_manifest.json"),
        help="Manual holdout keys manifest path",
    )
    ap.add_argument("--require-manual", action="store_true", help="Fail if manual holdout manifests are missing")
    ap.add_argument(
        "--real-manifest",
        type=str,
        default=str(APP_ROOT / ".internal_eval" / "real_stems" / "manifest.json"),
        help="Real-stem manifest path",
    )
    ap.add_argument("--require-real", action="store_true", help="Fail if real manifest is missing")
    ap.add_argument(
        "--external-run-manifest",
        type=str,
        default="",
        help="Optional external holdout run manifest (for E-GMD/GMD/StemGMD manifests)",
    )
    ap.add_argument(
        "--external-keys-manifest",
        type=str,
        default="",
        help="Optional external holdout keys manifest",
    )
    ap.add_argument("--external-threshold", type=float, default=85.0, help="Required external holdout pass percent")
    ap.add_argument(
        "--require-external",
        action="store_true",
        help="Fail if external holdout manifests are missing (requires both run and keys manifests)",
    )
    ap.add_argument(
        "--sample-dir",
        type=str,
        default="",
        help="Optional: sample kit directory; if present, run_internal_eval uses it for a resynth smoke-test",
    )
    ap.add_argument(
        "--use-backend-hints",
        action="store_true",
        help="Run all eval steps with inline backend hints + DrummerKnowledgeRescue enabled (Phase 2 A/B test)",
    )
    ap.add_argument(
        "--use-real-backend",
        action="store_true",
        help="Run all eval steps with Demucs stem separation + Omnizart CNN + DrummerKnowledgeRescue (Phase 3)",
    )
    args = ap.parse_args()

    synth_ledger = APP_ROOT / ".internal_eval" / "gate_synthetic_ledger.json"
    manual_ledger = APP_ROOT / ".internal_eval" / "gate_manual_ledger.json"
    real_ledger = APP_ROOT / ".internal_eval" / "gate_real_ledger.json"
    external_ledger = APP_ROOT / ".internal_eval" / "gate_external_ledger.json"
    synth_ledger.parent.mkdir(parents=True, exist_ok=True)

    print("Running synthetic internal eval...")
    synth_cmd = [_engine_python(), str(SCRIPT_DIR / "run_internal_eval.py"), "--ledger", str(synth_ledger)]
    if args.sample_dir:
        sample_dir = Path(args.sample_dir).resolve()
        if sample_dir.is_dir():
            synth_cmd += ["--sample-dir", str(sample_dir)]
    if args.use_real_backend:
        synth_cmd += ["--use-real-backend"]
    elif args.use_backend_hints:
        synth_cmd += ["--use-backend-hints"]
    rc, out, err = _run(synth_cmd)
    if out:
        print(out.strip())
    if err:
        print(err.strip(), file=sys.stderr)
    synth_pct = _load_pct(synth_ledger, "pct")
    synth_ok = synth_pct >= args.synthetic_threshold
    print(f"Synthetic gate: {synth_pct:.1f}% (required {args.synthetic_threshold:.1f}%)")

    manual_run_manifest = Path(args.manual_run_manifest).resolve()
    manual_keys_manifest = Path(args.manual_keys_manifest).resolve()
    manual_ok = not args.require_manual
    manual_pct = 0.0
    if manual_run_manifest.is_file() and manual_keys_manifest.is_file():
        print("Running manual blind holdout eval...")
        rcm, outm, errm = _run(
            [
                _engine_python(),
                str(SCRIPT_DIR / "run_blind_manual_eval.py"),
                "--run-manifest",
                str(manual_run_manifest),
                "--keys-manifest",
                str(manual_keys_manifest),
                "--ledger",
                str(manual_ledger),
                "--out-dir",
                str(APP_ROOT / ".internal_eval" / "manual_tests" / "out" / "gate"),
                "--threshold",
                str(args.manual_threshold),
            ]
        )
        if outm:
            print(outm.strip())
        if errm:
            print(errm.strip(), file=sys.stderr)
        manual_pct = _load_pct(manual_ledger, "pct")
        manual_ok = manual_pct >= args.manual_threshold
    else:
        msg = f"Manual holdout manifests missing: run={manual_run_manifest} keys={manual_keys_manifest}"
        if args.require_manual:
            print(msg, file=sys.stderr)
            manual_ok = False
        else:
            print(f"{msg}. Skipping manual gate (use --require-manual to enforce).")
            manual_ok = True

    if manual_run_manifest.is_file() and manual_keys_manifest.is_file():
        print(f"Manual gate: {manual_pct:.1f}% (required {args.manual_threshold:.1f}%)")

    real_manifest = Path(args.real_manifest).resolve()
    real_ok = not args.require_real
    real_pct = 0.0
    if real_manifest.is_file():
        print("Running real-stem eval...")
        real_cmd = [
            _engine_python(),
            str(SCRIPT_DIR / "run_real_stem_eval.py"),
            "--manifest",
            str(real_manifest),
            "--ledger",
            str(real_ledger),
            "--require",
        ]
        if args.use_real_backend:
            real_cmd += ["--use-real-backend", "--engine-timeout-sec", "900"]
        elif args.use_backend_hints:
            real_cmd += ["--use-backend-hints"]
        rc2, out2, err2 = _run(real_cmd)
        if out2:
            print(out2.strip())
        if err2:
            print(err2.strip(), file=sys.stderr)
        real_pct = _load_pct(real_ledger, "pct")
        real_ok = real_pct >= args.real_threshold
    else:
        msg = f"Real-stem manifest missing: {real_manifest}"
        if args.require_real:
            print(msg, file=sys.stderr)
            real_ok = False
        else:
            print(f"{msg}. Skipping real gate (use --require-real to enforce).")
            real_ok = True

    if real_manifest.is_file():
        print(f"Real gate: {real_pct:.1f}% (required {args.real_threshold:.1f}%)")

    external_run_manifest = Path(args.external_run_manifest).resolve() if args.external_run_manifest else None
    external_keys_manifest = Path(args.external_keys_manifest).resolve() if args.external_keys_manifest else None
    external_ok = not args.require_external
    external_pct = 0.0
    if external_run_manifest and external_keys_manifest:
        if external_run_manifest.is_file() and external_keys_manifest.is_file():
            print("Running external holdout eval...")
            rce, oute, erre = _run(
                [
                    _engine_python(),
                    str(SCRIPT_DIR / "run_blind_manual_eval.py"),
                    "--run-manifest",
                    str(external_run_manifest),
                    "--keys-manifest",
                    str(external_keys_manifest),
                    "--ledger",
                    str(external_ledger),
                    "--out-dir",
                    str(APP_ROOT / ".internal_eval" / "external_bench" / "out" / "gate"),
                    "--threshold",
                    str(args.external_threshold),
                ]
            )
            if oute:
                print(oute.strip())
            if erre:
                print(erre.strip(), file=sys.stderr)
            external_pct = _load_pct(external_ledger, "pct")
            external_ok = external_pct >= args.external_threshold
        else:
            msg = (
                f"External manifests missing: run={external_run_manifest} "
                f"keys={external_keys_manifest}"
            )
            if args.require_external:
                print(msg, file=sys.stderr)
                external_ok = False
            else:
                print(f"{msg}. Skipping external gate (use --require-external to enforce).")
                external_ok = True
    else:
        if args.require_external:
            print(
                "External gate required but manifests were not provided. "
                "Set --external-run-manifest and --external-keys-manifest.",
                file=sys.stderr,
            )
            external_ok = False
        else:
            external_ok = True

    if external_run_manifest and external_keys_manifest and external_run_manifest.is_file() and external_keys_manifest.is_file():
        print(f"External gate: {external_pct:.1f}% (required {args.external_threshold:.1f}%)")

    ok = synth_ok and manual_ok and real_ok and external_ok
    print(f"Overall gate: {'PASS' if ok else 'FAIL'}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
