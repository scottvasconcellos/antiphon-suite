#!/usr/bin/env python3
"""
StemForge Drum — bare-bones skeleton HTTP server.
Serves skeleton.html and POST /transcribe: upload audio, run engine, return MIDI as base64.

Run from app root: .venv/bin/python scripts/skeleton_server.py
Then open http://localhost:9876
"""

from __future__ import annotations

import base64
import json
import shutil
import subprocess
import sys
import uuid
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
APP_ROOT = SCRIPT_DIR.parent

MIDI_KEYS = ("drums_kick", "drums_snare", "drums_tops", "drums_perc")
GM_PITCH = {"drums_kick": 36, "drums_snare": 38, "drums_tops": 42, "drums_perc": 47}
PORT = 9876


def _merge_to_gm_midi(result: dict, bpm: float | None) -> bytes:
    """Combine all four lane MIDIs into one GM drum MIDI (channel 10)."""
    import io
    import pretty_midi

    pm_out = pretty_midi.PrettyMIDI(initial_tempo=float(bpm or 120.0))
    drums = pretty_midi.Instrument(program=0, is_drum=True, name="Drums")
    for role, pitch in GM_PITCH.items():
        path_str = result.get(role)
        if not path_str:
            continue
        p = Path(path_str)
        if not p.is_file():
            continue
        try:
            src = pretty_midi.PrettyMIDI(str(p))
            for inst in src.instruments:
                for note in inst.notes:
                    if note.velocity > 1:  # skip anchor notes
                        drums.notes.append(
                            pretty_midi.Note(
                                velocity=note.velocity,
                                pitch=pitch,
                                start=note.start,
                                end=note.end,
                            )
                        )
        except Exception:
            pass
    drums.notes.sort(key=lambda n: n.start)
    pm_out.instruments.append(drums)
    buf = io.BytesIO()
    pm_out.write(buf)
    return buf.getvalue()


def _engine_python() -> str:
    venv_py = APP_ROOT / ".venv" / "bin" / "python3"
    return str(venv_py) if venv_py.is_file() else sys.executable


def _demucs_python() -> str | None:
    """Return path to the demucs venv python, or None if not installed."""
    p = APP_ROOT / ".demucs_venv" / "bin" / "python3"
    return str(p) if p.is_file() else None


def _separate_drums(audio_path: Path, work_dir: Path) -> tuple[Path | None, str | None]:
    """Run HT-Demucs --two-stems=drums and return (drums_stem_path, error_or_None).
    Returns (None, reason) if demucs is unavailable or separation fails."""
    py = _demucs_python()
    if py is None:
        return None, "Demucs not installed (.demucs_venv not found)"
    sep_dir = work_dir / "demucs_out"
    sep_dir.mkdir(parents=True, exist_ok=True)
    try:
        r = subprocess.run(
            [py, "-m", "demucs", "--two-stems=drums", "-o", str(sep_dir), str(audio_path)],
            capture_output=True, text=True, timeout=300,
        )
        if r.returncode != 0:
            err = (r.stderr or r.stdout or "").strip()
            # Trim to keep note brief
            brief = err[:400] if len(err) > 400 else err
            return None, f"Demucs failed (exit {r.returncode}): {brief}"
        # demucs writes: sep_dir / {model} / {stem_name} / drums.wav
        for drums_wav in sep_dir.rglob("drums.wav"):
            return drums_wav, None
        return None, "Demucs ran but drums.wav not found in output"
    except subprocess.TimeoutExpired:
        return None, "Demucs timed out (>300 s)"
    except Exception as exc:
        return None, f"Demucs error: {exc}"


def _run_engine(audio_path: Path, output_dir: Path, bpm: float | None) -> dict:
    payload: dict = {
        "audioPath": str(audio_path.resolve()),
        "outputDir": str(output_dir.resolve()),
        "useRawMidi": False,
        "minVelocityThreshold": 40,
    }
    if bpm is not None and bpm > 0:
        payload["bpm"] = bpm
    r = subprocess.run(
        [_engine_python(), str(SCRIPT_DIR / "basic_drum_engine.py")],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        cwd=str(APP_ROOT),
    )
    if r.returncode != 0:
        err = (r.stderr or r.stdout or "").strip()
        try:
            data = json.loads(err)
            err = data.get("error", err)
        except Exception:
            pass
        raise RuntimeError(err or "Engine failed")
    return json.loads(r.stdout.strip())


def create_app():
    try:
        from flask import Flask, request, send_from_directory
    except ImportError:
        sys.exit("Flask required. Run: pip install flask")

    app = Flask(__name__)

    @app.route("/")
    def index():
        return send_from_directory(APP_ROOT, "skeleton.html")

    @app.route("/transcribe", methods=["POST"])
    def transcribe():
        # Optional CORS for same-origin or file:// opening
        if request.method == "OPTIONS":
            return "", 204, [
                ("Access-Control-Allow-Origin", "*"),
                ("Access-Control-Allow-Methods", "POST"),
                ("Access-Control-Allow-Headers", "Content-Type"),
            ]
        out_headers = {}
        if request.headers.get("Origin"):
            out_headers["Access-Control-Allow-Origin"] = "*"

        if "audio" not in request.files:
            return (
                json.dumps({"ok": False, "error": "Missing audio file"}),
                400,
                [("Content-Type", "application/json")] + list(out_headers.items()),
            )
        f = request.files["audio"]
        if not f or f.filename == "":
            return (
                json.dumps({"ok": False, "error": "No file selected"}),
                400,
                [("Content-Type", "application/json")] + list(out_headers.items()),
            )
        bpm_raw = request.form.get("bpm", "").strip()
        bpm = float(bpm_raw) if bpm_raw else None
        if bpm is not None and (bpm < 40 or bpm > 300):
            bpm = None
        use_separate = request.form.get("separate", "0") not in ("0", "false", "")

        uploads_dir = APP_ROOT / ".skeleton_uploads"
        uploads_dir.mkdir(parents=True, exist_ok=True)
        run_id = uuid.uuid4().hex[:12]
        out_dir = uploads_dir / f"out_{run_id}"
        out_dir.mkdir(parents=True, exist_ok=True)
        ext = Path(f.filename or "audio").suffix or ".wav"
        audio_path = uploads_dir / f"{run_id}{ext}"
        out_dir_to_clean = out_dir
        try:
            f.save(str(audio_path))
            engine_input = audio_path
            note = None
            if use_separate:
                drums_stem, demucs_err = _separate_drums(audio_path, out_dir)
                if drums_stem:
                    engine_input = drums_stem
                    note = "Clean drum stem extracted with HT-Demucs → transcription applied"
                else:
                    note = f"Demucs unavailable — running on original audio. ({demucs_err})"
            result = _run_engine(engine_input, out_dir, bpm)
            gm_bytes = _merge_to_gm_midi(result, bpm)
            if not gm_bytes:
                return (
                    json.dumps({"ok": False, "error": "Engine produced no MIDI files"}),
                    500,
                    [("Content-Type", "application/json")] + list(out_headers.items()),
                )
            stem = Path(f.filename or "audio").stem or "drums"
            payload: dict = {
                "ok": True,
                "files": [{"name": f"{stem}_gm.mid", "content": base64.b64encode(gm_bytes).decode("ascii")}],
            }
            if note:
                payload["note"] = note
            return (
                json.dumps(payload),
                200,
                [("Content-Type", "application/json")] + list(out_headers.items()),
            )
        except RuntimeError as e:
            return (
                json.dumps({"ok": False, "error": str(e)}),
                500,
                [("Content-Type", "application/json")] + list(out_headers.items()),
            )
        except Exception as e:
            return (
                json.dumps({"ok": False, "error": str(e)}),
                500,
                [("Content-Type", "application/json")] + list(out_headers.items()),
            )
        finally:
            if audio_path.exists():
                try:
                    audio_path.unlink()
                except Exception:
                    pass
            if out_dir_to_clean.exists():
                try:
                    shutil.rmtree(out_dir_to_clean, ignore_errors=True)
                except Exception:
                    pass

    return app


def main() -> None:
    app = create_app()
    print(f"StemForge Drum skeleton — http://localhost:{PORT}")
    app.run(host="127.0.0.1", port=PORT, debug=False)


if __name__ == "__main__":
    main()
