# Backend hint interface (engine-agnostic)

Optional per-frame confidence hints that the drum engine can consume for tie-breaking or rescue logic. Defined so that a learned (or heuristic) backend can be plugged in without changing the core engine contract.

## Input (to backend)

- Mono or stereo audio segment (numpy array or path).
- Sample rate, optional: hop size override.

## Output (from backend)

A **frame grid** aligned to a fixed hop (e.g. 5–10 ms):

- **times_sec**: 1D array of length `T` (frame centers in seconds).
- **probs**: 2D array of shape `(T, 4)` in order `[kick, snare, tops, perc]`. Values in [0, 1]; rows can sum to ≤ 1 (allow no-hit).
- **onset**: 1D array of length `T` (optional). General onset strength per frame in [0, 1]. If absent, engine may use max(probs) per frame.

## Metadata

- **sample_rate_hz**: int.
- **hop_sec**: float (e.g. 0.005 or 0.01).
- **version**: string (e.g. "v0.1") for compatibility.

## Serialization

- **NumPy**: `npz` with keys `times_sec`, `probs`, `onset` (optional), plus metadata as attributes or a small JSON sidecar.
- **In-memory**: Use `BackendHintGrid` (see `scripts/drum_engine/backend_hint.py`) so that onsets/classify/merge can accept `Optional[BackendHintGrid]`.

## Usage in engine

- **Logging only (first step)**: Run backend, log hints alongside rule-based posteriors; do not change outputs.
- **Tie-break**: When rule posterior margin is low, use `probs[t]` to choose kick vs snare.
- **Rescue**: When NMS would drop a close second hit, keep it if backend `p_kick(t)` or `p_snare(t)` exceeds a threshold (config constant).

All use is gated: run full blind holdout + synthetic; KEEP only if merged holdout improves and synthetic ≥ 90%.
