# Chord Scale Helper

Standalone desktop app: one definitive chord-scale per chord, visible and exportable. Can be managed (install, update, launch) by Antiphon Hub when Hub is present; runs fully offline after first authorization.

## Foundation (this repo)

- **Product authority:** [docs/layer0_chord_scale_helper.md](../../docs/layer0_chord_scale_helper.md)
- **Research index:** [docs/chord_scale_helper_research_index.md](../../docs/chord_scale_helper_research_index.md)
- **Domain types:** `src/domain/` — chord, scale, key, progression, Roman numeral, beat/measure (types only; engine in Operations arc)

## Build

```bash
pnpm run typecheck
```

## Artifacts

- `artifacts/v1/` — appId `antiphon.layer.chord-scale-helper`, version 1.0.0 (stable)
