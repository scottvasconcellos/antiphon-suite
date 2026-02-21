#!/usr/bin/env python3
"""
Basic Drum Engine — Librosa-based drum onset detection and role assignment (kick/snare/tops/perc).
Works out of the box without the optional Drum Engine Pack (Omnizart/ADTLib).
Uses low/mid/high energy bands, spectral centroid, transient sharpness, and attack energy.
When bpm/beat_times not provided, estimates BPM from the same audio so MIDI lines up in the DAW.

In:  JSON stdin: { "audioPath": "<path>" [, "outputDir": "<dir>", "bpm": number, "beat_times": number[] ] }
Out: JSON stdout: { "drums_kick", "drums_snare", "drums_tops", "drums_perc" } (paths)
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
        emit_error("Missing JSON input: { \"audioPath\": \"...\" }")
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        emit_error(f"Invalid JSON: {e}")


# Roles and GM note numbers for output MIDI
ROLES = ("drums_kick", "drums_snare", "drums_tops", "drums_perc")
GM_NOTE = {"drums_kick": 36, "drums_snare": 38, "drums_tops": 42, "drums_perc": 47}


def _estimate_bpm(y, sr) -> float:
    try:
        import librosa
        import numpy as np
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr, units="frames")
        if hasattr(tempo, "__len__") and len(tempo) > 0:
            tempo_val = float(np.median(tempo))
        else:
            tempo_val = float(tempo) if tempo is not None else 120.0
        return max(40.0, min(300.0, tempo_val))
    except Exception:
        return 120.0


def _quantize_to_beat(t: float, beat_times: list[float]) -> float:
    if not beat_times:
        return t
    best = beat_times[0]
    best_d = abs(t - best)
    for b in beat_times:
        d = abs(t - b)
        if d < best_d:
            best_d, best = d, b
    return best


def run(
    audio_path: Path,
    output_dir: Path,
    bpm: float | None = None,
    beat_times: list[float] | None = None,
) -> dict[str, str]:
    try:
        import librosa
        import numpy as np
        import pretty_midi
    except ImportError as e:
        emit_error(f"Missing dependency: {e}. Install: pip install librosa pretty-midi numpy")

    sr = 22050
    try:
        y, sr = librosa.load(str(audio_path), sr=sr, mono=True)
    except Exception as e:
        emit_error(f"Failed to load audio: {e}")

    if y.size == 0:
        emit_error("Audio file is empty")

    duration_sec = float(len(y)) / sr

    # Estimate BPM from audio when not provided so DAW grid and length match
    if bpm is None or bpm <= 0:
        bpm = _estimate_bpm(y, sr)
    bpm = max(40.0, min(300.0, float(bpm)))

    # Onset detection: finer time resolution (hop_length=256) and backtrack to transient start
    hop_length = 256
    onset_frames = librosa.onset.onset_detect(
        y=y, sr=sr, units="frames", backtrack=True, hop_length=hop_length
    )
    onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=hop_length)
    onset_times = [float(t) for t in onset_times]
    # Keep only onsets within audio duration so MIDI length matches source
    onset_times = [t for t in onset_times if 0 <= t < duration_sec - 0.01]

    # Optionally quantize to beat grid so notes line up with bars in Logic
    if beat_times:
        onset_times = [_quantize_to_beat(t, beat_times) for t in onset_times]
        # Deduplicate after quantization (same beat can get multiple onsets)
        seen = set()
        unique = []
        for t in onset_times:
            key = round(t, 4)
            if key not in seen:
                seen.add(key)
                unique.append(t)
        onset_times = unique

    if len(onset_times) == 0:
        out_paths = {}
        for role in ROLES:
            out_pm = pretty_midi.PrettyMIDI(initial_tempo=bpm)
            out_pm.instruments.append(pretty_midi.Instrument(program=0, is_drum=True))
            path = output_dir / f"{audio_path.stem}_{role}.mid"
            out_pm.write(str(path))
            out_paths[role] = str(path)
        return out_paths

    # Feature extraction per onset (n_fft <= win_samples to avoid librosa warning)
    win_ms = 0.08
    win_samples = int(sr * win_ms)
    n_fft = min(2048, win_samples)
    if n_fft < 64:
        n_fft = 64
    hop_stft = min(512, n_fft // 2)
    low_band = (20, 200)
    mid_band = (200, 2000)
    high_band = (2000, 12000)

    features = []  # (t, low, mid, high, centroid, transient_ratio, attack_energy)
    for t in onset_times:
        start_sample = max(0, int((t - 0.01) * sr))
        end_sample = min(len(y), start_sample + win_samples)
        if end_sample <= start_sample:
            end_sample = min(len(y), start_sample + 1024)
        segment = y[start_sample:end_sample]
        if segment.size < 64:
            features.append((float(t), 0.0, 0.0, 0.0, 0.0, 1.0, 0.0))
            continue

        S = np.abs(librosa.stft(segment, n_fft=n_fft, hop_length=hop_stft))
        power = (S ** 2).mean(axis=1)

        def band_energy(lo_hz: float, hi_hz: float) -> float:
            lo_bin = max(0, int(lo_hz * n_fft / sr))
            hi_bin = min(len(power), int(hi_hz * n_fft / sr) + 1)
            return float(np.sqrt(power[lo_bin:hi_bin].sum() + 1e-12))

        low_e = band_energy(low_band[0], low_band[1])
        mid_e = band_energy(mid_band[0], mid_band[1])
        high_e = band_energy(high_band[0], high_band[1])
        centroid = float(librosa.feature.spectral_centroid(S=S, sr=sr).mean()) if S.size else 0.0

        t_center = int(t * sr)
        after_start = t_center
        after_end = min(len(y), t_center + int(0.02 * sr))
        before_start = max(0, t_center - int(0.02 * sr))
        before_end = t_center
        rms_after = float(np.sqrt(np.mean(y[after_start:after_end] ** 2)) + 1e-12)
        rms_before = float(np.sqrt(np.mean(y[before_start:before_end] ** 2)) + 1e-12)
        transient_ratio = rms_after / rms_before if rms_before > 0 else 1.0

        # Attack: RMS in first 5 ms (snare crack / stick attack)
        attack_end = min(len(y), t_center + int(0.005 * sr))
        attack_energy = float(np.sqrt(np.mean(y[after_start:attack_end] ** 2)) + 1e-12)

        features.append((float(t), low_e, mid_e, high_e, centroid, transient_ratio, attack_energy))

    # Normalize with 95th percentile to avoid a few loud hits dominating
    def p95(vals):
        a = np.array(vals)
        return float(np.percentile(a[a > 0], 95)) if np.any(a > 0) else 1.0

    max_low = p95([f[1] for f in features])
    max_mid = p95([f[2] for f in features])
    max_high = p95([f[3] for f in features])
    max_centroid = p95([f[4] for f in features])
    max_transient = p95([f[5] for f in features])
    max_attack = p95([f[6] for f in features])
    if max_low <= 0:
        max_low = 1.0
    if max_mid <= 0:
        max_mid = 1.0
    if max_high <= 0:
        max_high = 1.0
    if max_centroid <= 0:
        max_centroid = 1.0
    if max_transient <= 0:
        max_transient = 1.0
    if max_attack <= 0:
        max_attack = 1.0

    def classify_v1(low_n: float, mid_n: float, high_n: float, centroid_n: float, trans_n: float, attack_n: float) -> str:
        if trans_n > 0.4 and attack_n > 0.3 and (mid_n > 0.25 or high_n > 0.25):
            return "drums_snare"
        if mid_n > 0.5 and trans_n > 0.35:
            return "drums_snare"
        if low_n > 0.45 and low_n >= mid_n and low_n >= high_n and centroid_n < 0.5:
            return "drums_kick"
        if low_n > 0.6:
            return "drums_kick"
        if high_n > 0.35 and (high_n >= low_n or centroid_n > 0.45):
            return "drums_tops"
        if centroid_n > 0.6 and high_n > 0.2:
            return "drums_tops"
        if mid_n > 0.35 and low_n > 0.2 and trans_n < 0.5:
            return "drums_perc"
        return "drums_perc"

    def classify_v2_snare_priority(low_n: float, mid_n: float, high_n: float, centroid_n: float, trans_n: float, attack_n: float) -> str:
        if trans_n > 0.35 and (mid_n > 0.3 or high_n > 0.25):
            return "drums_snare"
        if low_n > 0.5 and low_n >= mid_n and centroid_n < 0.5:
            return "drums_kick"
        if high_n > 0.3:
            return "drums_tops"
        return "drums_perc"

    def classify_v3_kick_priority(low_n: float, mid_n: float, high_n: float, centroid_n: float, trans_n: float, attack_n: float) -> str:
        if low_n > 0.4 and low_n >= high_n and centroid_n < 0.55:
            return "drums_kick"
        if trans_n > 0.4 and attack_n > 0.25 and mid_n > 0.3:
            return "drums_snare"
        if high_n > 0.35 or centroid_n > 0.5:
            return "drums_tops"
        return "drums_perc"

    classifiers = [classify_v1, classify_v2_snare_priority, classify_v3_kick_priority]

    # Cross-reference: vote across classifiers; merge onsets within merge_sec and take majority role
    merge_sec = 0.03
    votes: list[tuple[float, list[str], float, float, float, float, float, float]] = []
    for (t, low_e, mid_e, high_e, centroid, trans, attack) in features:
        low_n = low_e / max_low
        mid_n = mid_e / max_mid
        high_n = high_e / max_high
        centroid_n = centroid / max_centroid
        trans_n = trans / max_transient
        attack_n = attack / max_attack
        roles = [c(low_n, mid_n, high_n, centroid_n, trans_n, attack_n) for c in classifiers]
        votes.append((t, roles, low_e, mid_e, high_e, centroid, trans, attack))

    # Merge nearby onsets: group by time, take median time and majority role
    votes.sort(key=lambda x: x[0])
    merged: list[tuple[float, str, float, float, float]] = []
    i = 0
    while i < len(votes):
        t0, roles0, le, me, he, ce, tr, ae = votes[i]
        group_t = [t0]
        group_roles = [roles0]
        j = i + 1
        while j < len(votes) and votes[j][0] - t0 < merge_sec:
            group_t.append(votes[j][0])
            group_roles.append(votes[j][1])
            j += 1
        t_med = float(np.median(group_t))
        all_roles = [r for rr in group_roles for r in rr]
        counts = {}
        for r in ROLES:
            counts[r] = all_roles.count(r)
        role = max(ROLES, key=lambda r: counts[r])
        vel = int(70 + 45 * (le / max_low + me / max_mid + he / max_high) / 3)
        vel = max(40, min(127, vel))
        merged.append((t_med, role, vel, le, me))
        i = j

    by_role: dict[str, list[tuple[float, int]]] = {r: [] for r in ROLES}
    for t, role, vel, _le, _me in merged:
        by_role[role].append((t, vel))

    # Write one MIDI per role; same length as audio so DAW aligns (end anchor on every track)
    base = audio_path.stem
    out_paths = {}
    end_anchor_start = max(0.0, duration_sec - 0.001)
    end_anchor_end = duration_sec
    for role in ROLES:
        out_pm = pretty_midi.PrettyMIDI(initial_tempo=bpm)
        drum_inst = pretty_midi.Instrument(program=0, is_drum=True)
        pitch = GM_NOTE[role]
        for start, vel in by_role[role]:
            if start >= duration_sec:
                continue
            end = min(start + 0.08, duration_sec)
            drum_inst.notes.append(
                pretty_midi.Note(velocity=vel, pitch=pitch, start=start, end=end)
            )
        drum_inst.notes.append(
            pretty_midi.Note(velocity=1, pitch=pitch, start=end_anchor_start, end=end_anchor_end)
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

    bpm = None
    if "bpm" in data and isinstance(data["bpm"], (int, float)) and data["bpm"] > 0:
        bpm = float(data["bpm"])

    beat_times = None
    if "beat_times" in data and isinstance(data["beat_times"], list):
        beat_times = [float(x) for x in data["beat_times"] if isinstance(x, (int, float))]

    out_paths = run(audio_path, out_dir, bpm=bpm, beat_times=beat_times)
    print(json.dumps(out_paths))


if __name__ == "__main__":
    main()
