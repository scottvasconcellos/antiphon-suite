# Dataset split lock

Once generated, dev/holdout splits are **immutable**. This file records where split manifests live and how they were produced so the boundary is auditable.

## Seed and ratio

- **Seed**: 4242 (fixed; do not change).
- **Holdout ratio**: 0.30 (30% of clips per family in holdout).

## Per-family manifest locations

Under `.internal_eval/external_bench/<family>/`:

| Family      | Dev run manifest      | Dev keys manifest   | Holdout run manifest   | Holdout keys manifest  |
|------------|-----------------------|---------------------|------------------------|------------------------|
| mdbdrums   | dev_run_manifest.json | dev_keys_manifest.json | holdout_run_manifest.json | holdout_keys_manifest.json |
| enst_dry   | (same pattern)        |                     |                        |                        |
| enst_wet   | (same pattern)        |                     |                        |                        |
| a2md       | (same pattern)        |                     |                        |                        |
| star_full  | (same pattern)        |                     |                        |                        |
| floodsnare | (same pattern)        |                     |                        |                        |

## Generating splits

Use `scripts/prepare_additional_real_benchmarks.py` (or family-specific preparers) with `--seed 4242` and `--holdout-ratio 0.30`. Do not regenerate with a different seed or ratio for existing families; create a new family folder if you need a different split.

## Referenced by

- `GROUND_ZERO_STEMFORGE_MIDI.md` (Dataset contract).
- Merged report script: only ledgers produced with Contract V1 and these splits are included in the authoritative merged report.
