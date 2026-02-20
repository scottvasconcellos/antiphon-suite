# STEM Forge: App and Engine

The **STEM Forge app** is the app we are building: bulk upload stems, auto-process MIDI, per-stem clone choice, export all MIDI and stems, backing vocals / custom lyrics (MIDI for timing). All local, watermark-free.

## Open the STEM Forge app

From repo root:

```bash
pnpm run stem-forge:app
```

Then open **http://localhost:5174** in your browser. (Port may differ; check terminal.)

Use the app to upload stems, process, choose clone per stem, and export. CLI pipeline remains available for scripting: see `STEM_FORGE_RUNBOOK.md`.

## CLI only (no app UI)

Use **real paths** to your WAV files (not `/path/to/stem1.wav`). Run from repo root:

```bash
pnpm run stem-forge:health
pnpm run stem-forge:pipeline -- --stems ./my-stems/guitar.wav ./my-stems/vocal.wav
# With clone (optional): --router requires Ollama + model (ollama pull qwen2.5-coder:7b)
pnpm run stem-forge:pipeline -- --stems ./my-stems/guitar.wav --router --clone --mir
```

## Product goals (locked in)

- Bulk upload stems → auto-process all MIDI (mono + poly).
- Per-stem choice: continue to high-fidelity, human-like clone (MIDI + original synergistically) or not.
- Export all MIDI and new-generated stems; watermark-free (no Suno/Lyria), local only.
- Backing vocals: custom lyrics, custom editing; MIDI used to time lyric blocks.

See `FOSS_AND_LOCAL_LLM_STACK.md` and `STEM_FORGE_RELEASE_READINESS.md` for engine details.
