#!/usr/bin/env python3
"""
Basic Drum Engine — Librosa-based drum onset detection and role assignment (kick/snare/tops/perc).
Built-in engine; StemForge Drums merge (run_stemforge_drums) combines this with Omnizart/ADT-lib when available.
Uses low/mid/high energy bands, spectral centroid, transient sharpness, and attack energy.
When bpm/beat_times not provided, estimates BPM from the same audio so MIDI lines up in the DAW.
Future kick detection improvements: see docs/research/low_frequency_onsets_research.md (multi-ODF stack).

In:  JSON stdin: { "audioPath": "<path>" [, "outputDir": "<dir>", "bpm": number, "beat_times": number[], "minVelocityThreshold": number ] }
Out: JSON stdout: { "drums_kick", "drums_snare", "drums_tops", "drums_perc" } (paths)
On error: JSON stderr { "error": "..." }, exit 1.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from drum_engine.backend_hint import BackendHintGrid, backend_hint_from_numpy
from drum_engine.classify import classify_features
from drum_engine.config import EngineConfig
from drum_engine.features import compute_scales, extract_onset_features, filter_by_energy
from drum_engine.merge import infer_events, to_by_role
from drum_engine.onsets import detect_onset_candidates_with_low_rise


def emit_error(msg: str) -> None:
    print(json.dumps({"error": msg}), file=sys.stderr)
    sys.exit(1)


def read_input() -> dict:
    raw = sys.stdin.read().strip()
    if not raw:
        emit_error('Missing JSON input: { "audioPath": "..." }')
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        emit_error(f"Invalid JSON: {e}")


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


def _grid_filter_onsets(
    onset_times: list[float],
    bpm: float,
    duration_sec: float,
    subdivision: int = 16,
) -> list[float]:
    """When BPM is known, snap each onset to the nearest sub-beat grid position
    and drop anything that lands more than one 32nd note away from any grid point.
    This eliminates arrhythmic reverb tails / room resonance candidates that the
    onset detector fires on in real acoustic drum recordings.
    subdivision=16 → 16th-note grid; tol = half of that (32nd note).
    """
    if bpm <= 0 or duration_sec <= 0:
        return onset_times
    sub_sec = 60.0 / bpm / (subdivision / 4)  # duration of one subdivided step
    tol = sub_sec / 2.0  # tolerance = half a subdivision (32nd note for 16ths)

    out: list[float] = []
    seen: set[int] = set()
    for t in onset_times:
        # nearest grid slot index
        slot = round(t / sub_sec)
        grid_t = slot * sub_sec
        if abs(t - grid_t) <= tol and slot not in seen:
            seen.add(slot)
            out.append(t)  # keep original time so low_origin_set lookups still match
    return sorted(out)


def _set_tempo_map(pm, bpm: float, beat_times: list[float] | None, duration_sec: float) -> None:
    """Write tempo from audio into the MIDI so the DAW grid matches."""
    res = pm.resolution
    if not beat_times or len(beat_times) < 2:
        pm._tick_scales = [(0, 60.0 / (bpm * res))]
        max_tick = int(duration_sec * bpm * res / 60) + 100
        pm._update_tick_to_time(max_tick)
        return

    times = [0.0] + [float(t) for t in beat_times]
    bpms = []
    for i in range(len(times) - 1):
        dt = times[i + 1] - times[i]
        bpms.append((60.0 / dt) if dt > 0.01 else bpm)
    if not bpms:
        bpms = [bpm]

    tick_scales = [(0, 60.0 / (bpms[0] * res))]
    last_tick = 0
    last_t = 0.0
    last_scale = tick_scales[0][1]
    for i in range(1, len(times)):
        t_val = times[i]
        bpm_val = bpms[min(i - 1, len(bpms) - 1)]
        tick_delta = (t_val - last_t) / last_scale
        tick = last_tick + int(round(tick_delta))
        new_scale = 60.0 / (bpm_val * res)
        if abs(new_scale - last_scale) > 1e-9:
            tick_scales.append((tick, new_scale))
            last_scale = new_scale
        last_tick, last_t = tick, t_val
    pm._tick_scales = tick_scales
    final_tick = last_tick + int(round((duration_sec - last_t) / last_scale)) + 100
    pm._update_tick_to_time(max(final_tick, last_tick + 1))


def _write_empty_outputs(
    *,
    audio_path: Path,
    output_dir: Path,
    bpm: float,
    beat_times: list[float] | None,
    duration_sec: float,
    use_raw_midi: bool,
    pretty_midi_mod,
) -> dict[str, str]:
    out_paths: dict[str, str] = {}
    base = audio_path.stem
    if use_raw_midi:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from raw_midi_drums import write_drum_track_by_role

        for role in ROLES:
            path = output_dir / f"{base}_{role}.mid"
            write_drum_track_by_role(path, bpm, duration_sec, GM_NOTE[role], [])
            out_paths[role] = str(path)
    else:
        for role in ROLES:
            out_pm = pretty_midi_mod.PrettyMIDI(initial_tempo=bpm)
            _set_tempo_map(out_pm, bpm, beat_times, duration_sec)
            out_pm.instruments.append(pretty_midi_mod.Instrument(program=0, is_drum=True))
            path = output_dir / f"{base}_{role}.mid"
            out_pm.write(str(path))
            out_paths[role] = str(path)
    return out_paths


def _write_event_debug(
    debug_path: Path,
    audio_path: Path,
    bpm: float,
    duration_sec: float,
    events,
    diagnostics: dict | None = None,
) -> None:
    by_role = {role: [] for role in ROLES}
    rows = []
    for e in events:
        by_role[e.role].append(float(e.confidence))
        rows.append(
            {
                "time_sec": round(float(e.time_sec), 6),
                "role": e.role,
                "velocity": int(e.velocity),
                "confidence": round(float(e.confidence), 6),
                "margin": round(float(getattr(e, "margin", 0.0)), 6),
                "sub_share": round(float(getattr(e, "sub_share", 0.0)), 6),
                "mid_share": round(float(getattr(e, "mid_share", 0.0)), 6),
                "low_rise": round(float(getattr(e, "low_rise", 0.0)), 6),
            }
        )
    summary = {}
    for role in ROLES:
        vals = by_role[role]
        summary[role] = {
            "count": len(vals),
            "mean_confidence": round(sum(vals) / len(vals), 6) if vals else 0.0,
        }
    payload = {
        "audioPath": str(audio_path),
        "bpm": float(bpm),
        "duration_sec": float(duration_sec),
        "event_count": len(rows),
        "summary_by_role": summary,
        "events": rows,
        "merge_diagnostics": diagnostics or {},
    }
    debug_path.parent.mkdir(parents=True, exist_ok=True)
    with open(debug_path, "w") as f:
        json.dump(payload, f, indent=2)


def _load_backend_hint_grid_from_npz(npz_path: Path) -> BackendHintGrid | None:
    """
    Load a BackendHintGrid from a NumPy .npz file following BACKEND_HINT_SPEC.

    Expected keys:
      - times_sec: 1D array of frame-center times in seconds
      - probs: (T, 4) array of [kick, snare, tops, perc] probabilities
      - onset: optional 1D array of onset strengths in [0, 1]

    Metadata (sample_rate_hz, hop_sec, version) are optional; if missing,
    hop_sec/sample_rate_hz are derived from times_sec.
    """
    try:
        import numpy as np  # type: ignore[import-not-found]
    except Exception:
        return None

    try:
        data = np.load(str(npz_path), allow_pickle=True)
    except Exception:
        return None

    if "times_sec" not in data or "probs" not in data:
        return None

    times_sec = data["times_sec"]
    probs = data["probs"]
    onset = data["onset"] if "onset" in data else None

    if times_sec.ndim != 1 or probs.ndim != 2 or probs.shape[1] != 4:
        return None

    if len(times_sec) != probs.shape[0]:
        return None

    # Derive hop_sec and sample_rate_hz from times if not explicitly provided.
    if len(times_sec) > 1:
        diffs = np.diff(times_sec.astype(float))
        # Guard against zeros/negatives; fall back to 10 ms.
        valid_diffs = diffs[diffs > 1e-6]
        hop_sec = float(np.median(valid_diffs)) if valid_diffs.size else 0.01
    else:
        hop_sec = 0.01

    sample_rate_hz = int(round(1.0 / hop_sec)) if hop_sec > 0 else 100

    # Allow metadata overrides if present.
    sample_rate_hz = int(getattr(data, "sample_rate_hz", sample_rate_hz))
    hop_sec = float(getattr(data, "hop_sec", hop_sec))
    version = str(getattr(data, "version", "v0.1"))

    return backend_hint_from_numpy(
        times_sec=times_sec,
        probs=probs,
        onset=onset,
        sample_rate_hz=sample_rate_hz,
        hop_sec=hop_sec,
        version=version,
    )


def run(
    audio_path: Path,
    output_dir: Path,
    bpm: float | None = None,
    beat_times: list[float] | None = None,
    use_raw_midi: bool = False,
    min_velocity_threshold: int | None = None,
    enable_asymmetric_precision_gate: bool | None = None,
    debug_events_path: Path | None = None,
    hint_grid: BackendHintGrid | None = None,
    audio_override: Path | None = None,
    sample_dir: Path | None = None,
    use_backend_hints_inline: bool = False,
    use_drummer_knowledge: bool = False,
    use_real_backend: bool = False,
    use_onset_suppressor: bool = False,
    enable_kick_reverb_snare_filter: bool = False,
) -> dict[str, str]:
    try:
        import librosa
        import pretty_midi
    except ImportError as e:
        emit_error(f"Missing dependency: {e}. Install: pip install librosa pretty-midi numpy")

    cfg_kwargs = {}
    if min_velocity_threshold is not None:
        cfg_kwargs["min_velocity_threshold"] = max(1, min(127, int(min_velocity_threshold)))
    if enable_asymmetric_precision_gate is not None:
        cfg_kwargs["enable_asymmetric_precision_gate"] = bool(enable_asymmetric_precision_gate)
    if use_drummer_knowledge:
        cfg_kwargs["use_drummer_knowledge"] = True
    if use_onset_suppressor:
        cfg_kwargs["use_onset_suppressor"] = True
    if enable_kick_reverb_snare_filter:
        cfg_kwargs["enable_kick_reverb_snare_filter"] = True
    cfg = EngineConfig(**cfg_kwargs)

    # Phase 3: real backend (Demucs → Omnizart CNN → DrummerKnowledgeRescue).
    # Demucs drum stem separation only helps full-mix audio; drum-only stems
    # are passed through unchanged (Demucs still runs but produces the same signal).
    if use_real_backend and hint_grid is None:
        try:
            from drum_engine.stem_separator import separate_drums
            stem_out_dir = output_dir / "_demucs"
            stem_path, sep_err = separate_drums(audio_override or audio_path, output_dir=stem_out_dir)
            if stem_path is not None and stem_path.is_file():
                audio_override = stem_path  # engine will load the drum stem
        except Exception:
            pass  # stem separation failure is non-fatal; fall through to original audio
        # Regardless of stem success, always run the Omnizart CNN backend.
        try:
            from drum_engine.backend_omnizart import run_inference as _omnizart_infer
            hint_grid = _omnizart_infer(audio_override or audio_path)
        except Exception:
            pass
        # Always apply DrummerKnowledgeRescue when real backend is active.
        if not use_drummer_knowledge:
            use_drummer_knowledge = True
            cfg_kwargs["use_drummer_knowledge"] = True
            cfg = EngineConfig(**cfg_kwargs)

    # Phase 2: auto-generate hint grid from backend when requested and not already loaded.
    elif use_backend_hints_inline and hint_grid is None:
        try:
            from drum_engine.backend_mlv0 import run_inference as _backend_infer
            hint_grid = _backend_infer(audio_override or audio_path)
        except Exception:
            pass

    sr = 22050
    load_path = audio_override or audio_path
    try:
        y, sr = librosa.load(str(load_path), sr=sr, mono=True)
    except Exception as e:
        emit_error(f"Failed to load audio: {e}")

    if y.size == 0:
        emit_error("Audio file is empty")

    duration_sec = float(len(y)) / sr

    bpm_explicit = bpm is not None and bpm > 0
    if not bpm_explicit:
        bpm = _estimate_bpm(y, sr)
    bpm = max(40.0, min(300.0, float(bpm)))

    onset_times, onset_low_rise, low_origin_set = detect_onset_candidates_with_low_rise(
        y,
        sr,
        duration_sec=duration_sec,
        bpm=bpm,
        cfg=cfg,
    )

    if beat_times:
        onset_times = [_quantize_to_beat(t, beat_times) for t in onset_times]
        seen = set()
        unique = []
        for t in onset_times:
            key = round(t, 4)
            if key not in seen:
                seen.add(key)
                unique.append(t)
        onset_times = unique
    elif bpm_explicit:
        # BPM was provided by the user: snap all candidates to a 16th-note grid
        # and drop anything that doesn't land near a grid position.  This is the
        # single most effective filter against arrhythmic reverb-tail / room-
        # resonance false positives in real acoustic drum recordings.
        onset_times = _grid_filter_onsets(onset_times, bpm, duration_sec, subdivision=16)

    if not onset_times:
        out_paths = _write_empty_outputs(
            audio_path=audio_path,
            output_dir=output_dir,
            bpm=bpm,
            beat_times=beat_times,
            duration_sec=duration_sec,
            use_raw_midi=use_raw_midi,
            pretty_midi_mod=pretty_midi,
        )
        if debug_events_path:
            _write_event_debug(debug_events_path, audio_path, bpm, duration_sec, [])
        return out_paths

    # Phase 2: apply DrummerKnowledgeRescue to hint grid using detected onset_times.
    if hint_grid is not None and cfg.use_drummer_knowledge:
        try:
            from drum_engine.drummer_knowledge import apply_drummer_knowledge
            hint_grid = apply_drummer_knowledge(hint_grid, bpm, onset_times, cfg)
        except Exception:
            pass  # Never let DrummerKnowledge failure block MIDI output

    features = extract_onset_features(y, sr, onset_times, cfg)
    scales = compute_scales(features)
    filtered = filter_by_energy(features, scales, cfg)
    # Transient gate: drop candidates whose energy does not rise sharply at onset.
    # Reverb tails / room modes have rms_after ≈ rms_before (ratio ≈ 1.0).
    # Real drum hits have a steep energy increase (ratio >> 1.5).
    if cfg.min_onset_transient_ratio > 0:
        filtered = [f for f in filtered if f.transient_ratio >= cfg.min_onset_transient_ratio]
    # Phase 4: onset-level binary suppressor — drop reverb-tail / room-mode false positives
    # BEFORE classify.  Trained on ENST+A2MD real data; keeps real kicks, snares, and tops.
    if cfg.use_onset_suppressor and filtered:
        try:
            from drum_engine.onset_suppressor import load_or_train, apply_suppressor
            _manifest_path = Path(__file__).resolve().parent.parent / ".internal_eval" / "real_stems" / "manifest.json"
            _model_path = Path(__file__).resolve().parent / "drum_engine" / "onset_suppressor_model.pkl"
            _suppressor = load_or_train(_manifest_path, _model_path)
            if _suppressor is not None:
                filtered = apply_suppressor(
                    filtered,
                    _suppressor,
                    min_kick_p=cfg.onset_suppressor_min_kick_p,
                    min_snare_p=cfg.onset_suppressor_min_snare_p,
                    tops_high_share_min=cfg.tops_high_share_min,
                )
        except Exception:
            pass  # suppressor failure is non-fatal; continue with unfiltered candidates
    if not filtered:
        out_paths = _write_empty_outputs(
            audio_path=audio_path,
            output_dir=output_dir,
            bpm=bpm,
            beat_times=beat_times,
            duration_sec=duration_sec,
            use_raw_midi=use_raw_midi,
            pretty_midi_mod=pretty_midi,
        )
        if debug_events_path:
            _write_event_debug(debug_events_path, audio_path, bpm, duration_sec, [])
        return out_paths

    posteriors = classify_features(
        filtered, scales, cfg, bpm=bpm, onset_low_rise=onset_low_rise, hint_grid=hint_grid,
        low_origin_set=low_origin_set,
    )
    merge_diagnostics = {} if debug_events_path else None
    events = infer_events(
        posteriors, cfg, scales, bpm=bpm, diagnostics=merge_diagnostics, hint_grid=hint_grid
    )
    by_role = to_by_role(events, min_velocity_threshold=cfg.min_velocity_threshold)

    base = audio_path.stem
    out_paths: dict[str, str] = {}
    # Anchor note extends MIDI to exactly duration_sec so check_duration passes.
    # Use a 10ms window (not 1ms) to guarantee note-on and note-off are at
    # different MIDI ticks at all BPMs — otherwise PrettyMIDI drops zero-tick notes.
    end_anchor_start = max(0.0, duration_sec - 0.010)
    end_anchor_end = duration_sec

    if use_raw_midi:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from raw_midi_drums import write_drum_track_by_role

        for role in ROLES:
            path = output_dir / f"{base}_{role}.mid"
            write_drum_track_by_role(path, bpm, duration_sec, GM_NOTE[role], by_role[role])
            out_paths[role] = str(path)
    else:
        for role in ROLES:
            out_pm = pretty_midi.PrettyMIDI(initial_tempo=bpm)
            _set_tempo_map(out_pm, bpm, beat_times, duration_sec)
            drum_inst = pretty_midi.Instrument(program=0, is_drum=True)
            pitch = GM_NOTE[role]
            for start, vel in by_role[role]:
                if start >= duration_sec:
                    continue
                end = min(start + 0.08, duration_sec)
                drum_inst.notes.append(pretty_midi.Note(velocity=vel, pitch=pitch, start=start, end=end))
            drum_inst.notes.append(
                pretty_midi.Note(velocity=1, pitch=pitch, start=end_anchor_start, end=end_anchor_end)
            )
            out_pm.instruments.append(drum_inst)
            path = output_dir / f"{base}_{role}.mid"
            out_pm.write(str(path))
            out_paths[role] = str(path)

    if debug_events_path:
        _write_event_debug(debug_events_path, audio_path, bpm, duration_sec, events, diagnostics=merge_diagnostics)

    # Optional resynthesis: render clean one-shot audio stems if sampleDir is provided.
    if sample_dir is not None and sample_dir.is_dir():
        try:
            from drum_engine.resynth import render_stems
            audio_stems = render_stems(
                events_by_role=by_role,
                sample_dir=sample_dir,
                output_dir=output_dir,
                base_name=base,
                duration_sec=duration_sec,
            )
            for stem_name, stem_path in audio_stems.items():
                out_paths[f"audio_{stem_name}"] = stem_path
        except Exception:
            pass  # Resynth is optional; never fail the MIDI output over it

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

    use_raw_midi = data.get("useRawMidi") or data.get("use_raw_midi") or False
    min_velocity_threshold = None
    min_velocity_raw = data.get("minVelocityThreshold", data.get("min_velocity_threshold"))
    if isinstance(min_velocity_raw, (int, float)):
        min_velocity_threshold = int(min_velocity_raw)
    enable_asymmetric_precision_gate = None
    gate_raw = data.get("enableAsymmetricPrecisionGate", data.get("enable_asymmetric_precision_gate"))
    if isinstance(gate_raw, bool):
        enable_asymmetric_precision_gate = gate_raw
    debug_events_path = None
    debug_path_raw = data.get("debugEventsPath")
    if debug_path_raw:
        debug_events_path = Path(str(debug_path_raw)).resolve()
    elif os.environ.get("STEMFORGE_DRUM_DEBUG_EVENTS") == "1":
        debug_events_path = out_dir / f"{audio_path.stem}_drum_events_debug.json"
    # Optional backend hint grid (Phase 2+: loaded from .npz if requested).
    hint_grid: BackendHintGrid | None = None
    backend_hint_npz_raw = data.get("backendHintNpzPath")
    use_backend_hints = bool(data.get("useBackendHints", False))
    use_backend_hints_inline = bool(data.get("useBackendHintsInline", False))
    use_drummer_knowledge = bool(data.get("useDrummerKnowledge", False))
    use_real_backend = bool(data.get("useRealBackend", False))
    use_onset_suppressor = bool(data.get("useOnsetSuppressor", False))
    if not use_onset_suppressor and os.environ.get("STEMFORGE_DRUM_USE_ONSET_SUPPRESSOR") == "1":
        use_onset_suppressor = True
    enable_kick_reverb_snare_filter = bool(data.get("enableKickReverbSnareFilter", False))
    if not use_backend_hints and os.environ.get("STEMFORGE_DRUM_USE_BACKEND_HINTS") == "1":
        use_backend_hints = True
    if not use_backend_hints_inline and os.environ.get("STEMFORGE_DRUM_USE_BACKEND_HINTS_INLINE") == "1":
        use_backend_hints_inline = True
    backend_hint_npz_path: Path | None = None
    if backend_hint_npz_raw:
        backend_hint_npz_path = Path(str(backend_hint_npz_raw)).resolve()
    elif use_backend_hints:
        # Default convention: alongside audio, <stem>_backend_hints.npz
        backend_hint_npz_path = audio_path.with_name(f"{audio_path.stem}_backend_hints.npz")
    if backend_hint_npz_path and backend_hint_npz_path.is_file():
        hint_grid = _load_backend_hint_grid_from_npz(backend_hint_npz_path)

    # Optional stem-first audio override (Phase 3: stem-first mode).
    audio_override: Path | None = None
    stem_path_raw = data.get("drumStemPath")
    use_stem_flag = bool(data.get("useDrumStem", False))
    if not use_stem_flag and os.environ.get("STEMFORGE_DRUM_USE_STEM") == "1":
        use_stem_flag = True
    if stem_path_raw:
        candidate = Path(str(stem_path_raw)).resolve()
        if candidate.is_file():
            audio_override = candidate
    elif use_stem_flag:
        # Default convention: alongside audio, <stem>_drum_stem.(wav|flac)
        for ext in (".wav", ".flac"):
            candidate = audio_path.with_name(f"{audio_path.stem}_drum_stem{ext}")
            if candidate.is_file():
                audio_override = candidate
                break

    sample_dir: Path | None = None
    sample_dir_raw = data.get("sampleDir")
    if sample_dir_raw:
        candidate = Path(str(sample_dir_raw)).resolve()
        if candidate.is_dir():
            sample_dir = candidate

    out_paths = run(
        audio_path,
        out_dir,
        bpm=bpm,
        beat_times=beat_times,
        use_raw_midi=use_raw_midi,
        min_velocity_threshold=min_velocity_threshold,
        enable_asymmetric_precision_gate=enable_asymmetric_precision_gate,
        debug_events_path=debug_events_path,
        hint_grid=hint_grid,
        audio_override=audio_override,
        sample_dir=sample_dir,
        use_backend_hints_inline=use_backend_hints_inline,
        use_drummer_knowledge=use_drummer_knowledge,
        use_real_backend=use_real_backend,
        use_onset_suppressor=use_onset_suppressor,
        enable_kick_reverb_snare_filter=enable_kick_reverb_snare_filter,
    )
    print(json.dumps(out_paths))


if __name__ == "__main__":
    main()
