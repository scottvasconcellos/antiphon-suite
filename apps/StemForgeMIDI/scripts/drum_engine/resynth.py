"""
Drum resynthesis: trigger one-shot samples at classified event times to produce
clean, bleed-free audio stems (kick.wav, snare.wav, tops.wav).

Sample directory layout (any depth of subdirs is fine; only direct children are read):
    {sampleDir}/kick/   — one or more .wav files (sorted for velocity layering)
    {sampleDir}/snare/  — one or more .wav files
    {sampleDir}/tops/   — one or more .wav files (hi-hats, cymbals, perc)

Events for drums_tops and drums_perc are merged into the single "tops" stem.
"""
from __future__ import annotations

import math
from pathlib import Path


# Role → sub-directory name inside sampleDir
_ROLE_DIR = {
    "drums_kick": "kick",
    "drums_snare": "snare",
    "drums_tops": "tops",
    "drums_perc": "tops",  # perc goes to the same tops stem
}

# Output stems we produce (3 lanes)
OUTPUT_STEMS = ("kick", "snare", "tops")

# Map output stem → source roles whose events feed it
_STEM_ROLES = {
    "kick": ["drums_kick"],
    "snare": ["drums_snare"],
    "tops": ["drums_tops", "drums_perc"],
}


def _load_samples(role_dir: Path) -> tuple[list, int] | None:
    """
    Load all .wav files from role_dir.
    Returns (list_of_mono_float32_arrays, sample_rate) or None if no files found.
    Samples are sorted by filename for deterministic velocity layering.
    """
    try:
        import numpy as np
        import soundfile as sf
    except ImportError:
        return None

    wav_files = sorted(role_dir.glob("*.wav"))
    if not wav_files:
        return None

    samples: list = []
    sr_out: int | None = None
    for wf in wav_files:
        try:
            data, sr = sf.read(str(wf), dtype="float32", always_2d=False)
        except Exception:
            continue
        # Convert stereo to mono by averaging channels
        if data.ndim == 2:
            data = data.mean(axis=1)
        if sr_out is None:
            sr_out = sr
        elif sr != sr_out:
            # Resample to match first file's SR using simple linear interp (no librosa dep here)
            try:
                import librosa
                data = librosa.resample(data, orig_sr=sr, target_sr=sr_out)
            except Exception:
                # Skip mismatched sample rather than crash
                continue
        samples.append(data)

    if not samples or sr_out is None:
        return None
    return samples, sr_out


def _pick_sample(samples: list, velocity: int):
    """
    Pick a sample from the bank based on velocity (0–127).
    With n samples, splits velocity range into n equal buckets.
    """
    n = len(samples)
    if n == 1:
        return samples[0]
    idx = min(int(velocity / 128.0 * n), n - 1)
    return samples[idx]


def render_stems(
    events_by_role: dict[str, list[tuple[float, int]]],
    sample_dir: Path,
    output_dir: Path,
    base_name: str,
    duration_sec: float,
) -> dict[str, str]:
    """
    Render clean audio stems by triggering one-shot samples at event times.

    Parameters
    ----------
    events_by_role : dict mapping role name → list of (time_sec, velocity) tuples
    sample_dir     : directory containing kick/, snare/, tops/ subdirectories
    output_dir     : where to write output .wav files
    base_name      : prefix for output filenames (e.g. the audio stem name)
    duration_sec   : total duration of the output stems

    Returns
    -------
    dict mapping stem name → absolute path string, e.g.
        {"kick": "/path/kick.wav", "snare": "/path/snare.wav", "tops": "/path/tops.wav"}
    Only stems that have both samples and events are included.
    """
    try:
        import numpy as np
    except ImportError:
        return {}

    output_dir.mkdir(parents=True, exist_ok=True)
    out: dict[str, str] = {}

    for stem_name in OUTPUT_STEMS:
        role_dir = sample_dir / stem_name
        loaded = _load_samples(role_dir)
        if loaded is None:
            continue
        samples, sr = loaded

        # Collect all events that feed this stem
        source_roles = _STEM_ROLES[stem_name]
        all_events: list[tuple[float, int]] = []
        for role in source_roles:
            all_events.extend(events_by_role.get(role, []))
        all_events.sort(key=lambda e: e[0])

        if not all_events:
            continue

        n_frames = math.ceil(duration_sec * sr)
        buf = np.zeros(n_frames, dtype=np.float64)

        for t_sec, vel in all_events:
            if t_sec < 0 or t_sec >= duration_sec:
                continue
            sample = _pick_sample(samples, vel)
            gain = vel / 127.0
            start_frame = int(round(t_sec * sr))
            end_frame = min(n_frames, start_frame + len(sample))
            seg_len = end_frame - start_frame
            if seg_len <= 0:
                continue
            buf[start_frame:end_frame] += gain * sample[:seg_len].astype(np.float64)

        # Normalize to prevent clipping while preserving relative levels
        peak = np.abs(buf).max()
        if peak > 1.0:
            buf = buf / peak * 0.95

        out_path = output_dir / f"{base_name}_{stem_name}.wav"
        try:
            import soundfile as sf
            sf.write(str(out_path), buf.astype(np.float32), sr)
            out[stem_name] = str(out_path)
        except Exception:
            pass

    return out
