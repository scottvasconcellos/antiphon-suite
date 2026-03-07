#!/usr/bin/env python3
"""
Compare two drum-eval ledgers and generate a learning-focused progress report.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path


def _load_ledger(path: Path) -> dict:
    with open(path) as f:
        return json.load(f)


def _rows(ledger: dict) -> list[dict]:
    if "cases" in ledger:
        return ledger["cases"]
    if "clips" in ledger:
        return ledger["clips"]
    return []


def _idx(rows: list[dict]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for r in rows:
        rid = str(r.get("id") or r.get("case") or "")
        if rid:
            out[rid] = r
    return out


def _pass_pct(rows: list[dict]) -> float:
    if not rows:
        return 0.0
    passed = sum(1 for r in rows if r.get("pass"))
    return round(100.0 * passed / len(rows), 1)


def _group_pass(rows: list[dict], key: str) -> dict[str, dict]:
    by: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by[str(r.get(key) or "unknown")].append(r)
    out: dict[str, dict] = {}
    for group in sorted(by.keys()):
        total = len(by[group])
        passed = sum(1 for r in by[group] if r.get("pass"))
        out[group] = {"passed": passed, "total": total, "pct": round(100.0 * passed / total, 1) if total else 0.0}
    return out


def _score_row(r: dict) -> float:
    # Lower is better; this returns a "badness score" for ranking hardest clips.
    kick_recall_gap = max(0.0, 0.90 - float(r.get("kick_recall", 1.0)))
    kick_prec_gap = max(0.0, 0.85 - float(r.get("kick_precision", 1.0)))
    snare_recall_gap = max(0.0, 0.90 - float(r.get("snare_recall", 1.0)))
    snare_prec_gap = max(0.0, 0.85 - float(r.get("snare_precision", 1.0)))
    return round(kick_recall_gap + kick_prec_gap + snare_recall_gap + snare_prec_gap, 4)


def _to_markdown(
    baseline_name: str,
    candidate_name: str,
    baseline_rows: list[dict],
    candidate_rows: list[dict],
) -> str:
    b_idx = _idx(baseline_rows)
    c_idx = _idx(candidate_rows)
    ids = sorted(set(b_idx.keys()) & set(c_idx.keys()))

    fixed: list[str] = []
    regressed: list[str] = []
    persistent_fail: list[str] = []
    for rid in ids:
        b_pass = bool(b_idx[rid].get("pass"))
        c_pass = bool(c_idx[rid].get("pass"))
        if (not b_pass) and c_pass:
            fixed.append(rid)
        elif b_pass and (not c_pass):
            regressed.append(rid)
        elif (not b_pass) and (not c_pass):
            persistent_fail.append(rid)

    hardest = sorted(
        [c_idx[rid] for rid in persistent_fail],
        key=_score_row,
        reverse=True,
    )[:20]

    b_pct = _pass_pct(baseline_rows)
    c_pct = _pass_pct(candidate_rows)
    delta = round(c_pct - b_pct, 1)

    b_style = _group_pass(baseline_rows, "style")
    c_style = _group_pass(candidate_rows, "style")
    b_meter = _group_pass(baseline_rows, "meter")
    c_meter = _group_pass(candidate_rows, "meter")

    lines = []
    lines.append("# Drum Eval Progress Report")
    lines.append("")
    lines.append("## Overall")
    lines.append(f"- Baseline (`{baseline_name}`): {b_pct:.1f}%")
    lines.append(f"- Candidate (`{candidate_name}`): {c_pct:.1f}%")
    lines.append(f"- Delta: {delta:+.1f} points")
    lines.append(f"- Fixed clips: {len(fixed)}")
    lines.append(f"- Regressed clips: {len(regressed)}")
    lines.append(f"- Persistent failures: {len(persistent_fail)}")
    lines.append("")

    lines.append("## Fixed Clips")
    if fixed:
        for rid in fixed:
            lines.append(f"- {rid}")
    else:
        lines.append("- none")
    lines.append("")

    lines.append("## Regressed Clips")
    if regressed:
        for rid in regressed:
            lines.append(f"- {rid}")
    else:
        lines.append("- none")
    lines.append("")

    lines.append("## Hardest Persistent Fails")
    if hardest:
        for row in hardest:
            rid = row.get("id") or row.get("case")
            style = row.get("style", "unknown")
            meter = row.get("meter", "unknown")
            lines.append(
                f"- {rid} ({meter} / {style}) "
                f"K R/P {row.get('kick_recall', 1.0):.2f}/{row.get('kick_precision', 1.0):.2f} "
                f"S R/P {row.get('snare_recall', 1.0):.2f}/{row.get('snare_precision', 1.0):.2f}"
            )
    else:
        lines.append("- none")
    lines.append("")

    lines.append("## Style Delta")
    all_styles = sorted(set(b_style.keys()) | set(c_style.keys()))
    for style in all_styles:
        b = b_style.get(style, {}).get("pct", 0.0)
        c = c_style.get(style, {}).get("pct", 0.0)
        lines.append(f"- {style}: {b:.1f}% -> {c:.1f}% ({c - b:+.1f})")
    lines.append("")

    lines.append("## Meter Delta")
    all_meters = sorted(set(b_meter.keys()) | set(c_meter.keys()))
    for meter in all_meters:
        b = b_meter.get(meter, {}).get("pct", 0.0)
        c = c_meter.get(meter, {}).get("pct", 0.0)
        lines.append(f"- {meter}: {b:.1f}% -> {c:.1f}% ({c - b:+.1f})")
    lines.append("")

    lines.append("## Next Iteration Queue")
    if hardest:
        lines.append("- Focus on the top 10 persistent fails above before touching passing clips.")
        lines.append("- Prioritize clips where snare recall < 0.90 first, then kick recall.")
        lines.append("- Re-run eval, then regenerate this report to verify no regressions.")
    else:
        lines.append("- No persistent fail set from overlapping clip IDs.")

    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description="Compare two eval ledgers and write progress report")
    ap.add_argument("--baseline-ledger", required=True, help="Baseline ledger path")
    ap.add_argument("--candidate-ledger", required=True, help="Candidate ledger path")
    ap.add_argument("--out-md", required=True, help="Output markdown report path")
    ap.add_argument("--out-json", default="", help="Optional output JSON summary path")
    args = ap.parse_args()

    baseline_path = Path(args.baseline_ledger).resolve()
    candidate_path = Path(args.candidate_ledger).resolve()
    out_md = Path(args.out_md).resolve()
    out_json = Path(args.out_json).resolve() if args.out_json else None

    baseline = _load_ledger(baseline_path)
    candidate = _load_ledger(candidate_path)
    b_rows = _rows(baseline)
    c_rows = _rows(candidate)
    markdown = _to_markdown(baseline_path.name, candidate_path.name, b_rows, c_rows)

    out_md.parent.mkdir(parents=True, exist_ok=True)
    out_md.write_text(markdown)
    print(f"Wrote report: {out_md}")

    if out_json:
        payload = {
            "baseline": str(baseline_path),
            "candidate": str(candidate_path),
            "baselinePct": _pass_pct(b_rows),
            "candidatePct": _pass_pct(c_rows),
            "baselineCount": len(b_rows),
            "candidateCount": len(c_rows),
        }
        out_json.parent.mkdir(parents=True, exist_ok=True)
        out_json.write_text(json.dumps(payload, indent=2))
        print(f"Wrote summary JSON: {out_json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
