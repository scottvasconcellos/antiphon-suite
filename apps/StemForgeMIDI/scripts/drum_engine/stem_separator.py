"""
stem_separator.py — Demucs htdemucs drum stem extraction.

Separates the drum stem from a mixed audio file using Demucs htdemucs.
Returns (drum_stem_path, None) on success, or (None, error_str) on failure.

Demucs is installed in the app .venv with: pip install --no-deps demucs + deps.
htdemucs separates: [drums, bass, other, vocals].
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path


APP_ROOT = Path(__file__).resolve().parents[2]
_DEMUCS_MODEL = "htdemucs"


def separate_drums(
    audio_path: Path,
    output_dir: Path | None = None,
) -> tuple[Path | None, str | None]:
    """
    Run Demucs htdemucs on audio_path and return the drum stem path.

    Parameters
    ----------
    audio_path : Path
        Input audio file (WAV, FLAC, MP3, etc.).
    output_dir : Path | None
        Directory to write the separated stems. If None, uses a temp directory.
        The drum stem is written to output_dir/htdemucs/<stem_name>/drums.wav.

    Returns
    -------
    (drum_stem_path, None)  on success
    (None, error_str)       on failure
    """
    try:
        import torch
        from demucs.apply import apply_model
        from demucs.audio import AudioFile, save_audio
        from demucs.pretrained import get_model
    except ImportError as e:
        return None, f"demucs_not_installed: {e}"

    if not audio_path.is_file():
        return None, f"audio_not_found: {audio_path}"

    # Resolve output directory.
    if output_dir is None:
        tmp = tempfile.mkdtemp(prefix="stemforge_demucs_")
        out_dir = Path(tmp)
    else:
        out_dir = output_dir
        out_dir.mkdir(parents=True, exist_ok=True)

    drum_stem_path = out_dir / f"{audio_path.stem}_drum_stem.wav"

    # Skip if already separated (cached).
    if drum_stem_path.is_file():
        return drum_stem_path, None

    try:
        model = get_model(_DEMUCS_MODEL)
        model.eval()
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model.to(device)

        # Load audio via Demucs AudioFile helper.
        wav = AudioFile(audio_path).read(
            streams=0,
            samplerate=model.samplerate,
            channels=model.audio_channels,
        )
        # wav shape: (channels, samples); apply_model expects (batch, channels, samples)
        wav = wav.unsqueeze(0).to(device)

        with torch.no_grad():
            sources = apply_model(model, wav, device=device, progress=False)
        # sources shape: (batch=1, n_sources, channels, samples)
        sources = sources[0]  # (n_sources, channels, samples)

        # Find drum source index.
        drum_idx = model.sources.index("drums")
        drum_wav = sources[drum_idx]  # (channels, samples)

        save_audio(drum_wav.cpu(), str(drum_stem_path), samplerate=model.samplerate)
        return drum_stem_path, None

    except Exception as e:
        return None, f"demucs_failed: {e}"
