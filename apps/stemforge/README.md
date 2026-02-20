# STEMForge

Bulk upload stems → intelligent analysis → auto-instrument detection → polyphonic separation → MIDI with articulations → high-quality remaster. All local, watermark-free.

## Run the app

From the monorepo root:

```bash
cd "/Users/scottvasconcellos/Documents/My Apps/Antiphon-Suite/antiphon-suite-monorepo"
pnpm --filter @antiphon/stemforge dev
```

Or from the app directory:

```bash
cd apps/stemforge
pnpm dev
```

Then open the URL printed in the terminal (e.g. `http://localhost:5174`). If port 5174 is in use, the server will try 5175, 5176, … and print the final URL.

## Scripts

- **`dev`** / **`start`** — Start the upload/process UI server.
- **`pipeline`** — Run the pipeline from CLI: `node scripts/run-stem-pipeline.mjs --stems path/to/a.wav path/to/b.wav [--clone] [--mir] [--router]`.
- **`normalize`** — FFmpeg normalize.
- **`midi-clean`** — MIDI clean CLI.
- **`smoke`** / **`health`** — Smoke test and health check.

## Docs

See `docs/`: runbook, gaps, architecture, release readiness, FOSS/LLM stack, export options.
