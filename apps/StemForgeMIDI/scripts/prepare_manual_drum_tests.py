#!/usr/bin/env python3
"""
Regenerate manual test manifests from one or more filesystem roots.

Scans for audio+MIDI pairs (same basename, same folder), splits into dev/holdout
with a fixed seed, and writes dev_manifest.json, holdout_run_manifest.json,
and holdout_keys_manifest.json with absolute paths.
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
APP_ROOT = SCRIPT_DIR.parent

AUDIO_EXTENSIONS = {".wav", ".wave", ".flac", ".mp3"}
MIDI_EXTENSIONS = {".mid", ".midi"}


def _is_hidden(p: Path) -> bool:
    return p.name.startswith(".") or "/._" in str(p)


def find_pairs(root: Path) -> list[tuple[Path, Path]]:
    """Find (audio_path, midi_path) pairs under root. Same folder, same basename."""
    pairs: list[tuple[Path, Path]] = []
    root = root.resolve()
    if not root.is_dir():
        return pairs

    by_dir: dict[Path, dict[str, Path]] = {}
    for f in root.rglob("*"):
        if not f.is_file() or _is_hidden(f):
            continue
        stem = f.stem
        ext = f.suffix.lower()
        parent = f.parent
        if parent not in by_dir:
            by_dir[parent] = {}
        if ext in AUDIO_EXTENSIONS:
            by_dir[parent].setdefault("audio", {})[stem] = f
        elif ext in MIDI_EXTENSIONS:
            by_dir[parent].setdefault("midi", {})[stem] = f

    for parent, maps in by_dir.items():
        audio_map = maps.get("audio", {})
        midi_map = maps.get("midi", {})
        for stem in audio_map:
            if stem in midi_map:
                pairs.append((audio_map[stem].resolve(), midi_map[stem].resolve()))
    return pairs


def _safe_id(audio_path: Path, root: Path) -> str:
    """Stable clip id from relative path."""
    try:
        rel = audio_path.relative_to(root)
    except ValueError:
        rel = audio_path
    parts = rel.parts
    stem = audio_path.stem
    if len(parts) <= 1:
        return re.sub(r"[^\w\-]", "_", stem)
    return re.sub(r"[^\w\-]", "_", "_".join(parts[:-1] + (stem,)))


def main() -> int:
    ap = argparse.ArgumentParser(description="Prepare manual drum test manifests from audio+MIDI roots")
    ap.add_argument(
        "roots",
        nargs="+",
        type=str,
        help="One or more directories to scan for audio+MIDI pairs (same basename)",
    )
    ap.add_argument(
        "--output-dir",
        type=str,
        default="",
        help="Output directory for manifests (default: APP_ROOT/.internal_eval/manual_tests)",
    )
    ap.add_argument(
        "--holdout-ratio",
        type=float,
        default=0.30,
        help="Fraction of clips to put in holdout (0–1)",
    )
    ap.add_argument("--seed", type=int, default=4242, help="RNG seed for dev/holdout split")
    args = ap.parse_args()

    output_dir = (
        Path(args.output_dir).resolve()
        if args.output_dir
        else (APP_ROOT / ".internal_eval" / "manual_tests").resolve()
    )
    output_dir.mkdir(parents=True, exist_ok=True)

    all_pairs: list[tuple[Path, Path, str]] = []
    for r in args.roots:
        root = Path(r).resolve()
        if not root.is_dir():
            print(f"Skipping non-directory: {root}", file=sys.stderr)
            continue
        for audio_path, midi_path in find_pairs(root):
            cid = _safe_id(audio_path, root)
            all_pairs.append((audio_path, midi_path, cid))

    # Dedupe by id (keep first)
    seen: set[str] = set()
    unique: list[tuple[Path, Path, str]] = []
    for a, m, cid in all_pairs:
        if cid in seen:
            continue
        seen.add(cid)
        unique.append((a, m, cid))

    if not unique:
        print("No audio+MIDI pairs found.", file=sys.stderr)
        return 1

    rng = random.Random(args.seed)
    shuffled = list(unique)
    rng.shuffle(shuffled)
    n_holdout = max(0, int(len(shuffled) * args.holdout_ratio))
    n_dev = len(shuffled) - n_holdout
    dev_list = shuffled[:n_dev]
    holdout_list = shuffled[n_dev:]

    def clip_run(audio_path: Path, cid: str) -> dict:
        return {
            "id": cid,
            "audioPath": str(audio_path),
        }

    def clip_keys(cid: str, midi_path: Path) -> dict:
        return {
            "id": cid,
            "midiPath": str(midi_path),
        }

    dev_manifest = {
        "clips": [clip_run(a, cid) for a, _m, cid in dev_list],
    }
    holdout_run_manifest = {
        "clips": [clip_run(a, cid) for a, _m, cid in holdout_list],
    }
    holdout_keys_manifest = {
        "clips": [clip_keys(cid, m) for _a, m, cid in holdout_list],
    }

    dev_path = output_dir / "dev_manifest.json"
    holdout_run_path = output_dir / "holdout_run_manifest.json"
    holdout_keys_path = output_dir / "holdout_keys_manifest.json"

    with open(dev_path, "w") as f:
        json.dump(dev_manifest, f, indent=2)
    with open(holdout_run_path, "w") as f:
        json.dump(holdout_run_manifest, f, indent=2)
    with open(holdout_keys_path, "w") as f:
        json.dump(holdout_keys_manifest, f, indent=2)

    print(f"Found {len(unique)} pairs. Dev: {n_dev}, Holdout: {n_holdout}")
    print(f"  dev_manifest.json        -> {dev_path}")
    print(f"  holdout_run_manifest.json -> {holdout_run_path}")
    print(f"  holdout_keys_manifest.json -> {holdout_keys_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
