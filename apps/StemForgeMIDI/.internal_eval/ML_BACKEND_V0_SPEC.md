# ML backend v0 — architecture and scope

Minimal learned backend that outputs the BackendHintGrid interface for optional use by the drum engine. Offline only; no real-time requirement for v0.

## Goal

- **Input**: Mono or stereo audio segment.
- **Output**: Per-frame probabilities `(T, 4)` for [kick, snare, tops, perc] plus optional onset strength, matching `BACKEND_HINT_SPEC.md`.

## Training data

- Existing annotated corpora: ENST, A2MD, STAR, GMD, etc.
- Labels: use existing aligner and scoring rule (same `matchSec` window) to assign frame-level labels from reference MIDI.
- No new annotation pipeline for v0.

## Model

- Small convolutional network on log-mel (or multi-band) spectrograms.
- Frame rate: e.g. 5–10 ms hop (configurable).
- Four-class output (softmax or sigmoid); optional auxiliary onset head.
- Export: PyTorch checkpoint + version tag, or ONNX, so the engine can load it via a thin inference wrapper.

## Where it lives

- **Training script**: Under `python-tools/` or a dedicated `ml_backend/` folder (e.g. `train_drum_hint_model.py`). Loads corpora, extracts features, trains, exports.
- **Inference wrapper**: Callable from the engine (or from a small runner script) that returns a `BackendHintGrid` (or numpy arrays for `backend_hint_from_numpy`).
- **Config**: Feature config (n_fft, hop, n_mels, segment length) and model path in a single config file or env; no magic numbers in code.

## Constraints (v0)

- Offline only; 1–2× real-time processing time is acceptable.
- Four-class only (kick, snare, tops, perc).
- No dependency on external cloud APIs; all runs local.

## Gate

Any change that wires this backend into the engine must pass the same promotion rule: merged real holdout improves, synthetic ≥ 90%.
