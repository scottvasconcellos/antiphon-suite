# Engine Configuration

## Hub Runtime Variables
- `VITE_ANTIPHON_ENGINE_MODE`: `network` (default) or `stub`.
- `VITE_ANTIPHON_MUSIC_ENGINE_ID`: optional explicit engine id.
  - `stub-music-intelligence-v1`
  - `minimal-real-music-intelligence-v1`

## Deterministic Selection Policy
1. If `VITE_ANTIPHON_MUSIC_ENGINE_ID` matches a registered engine id, select it (`selectionSource=requested`).
2. Otherwise apply default policy (`selectionSource=default`):
   - session present -> `minimal-real-music-intelligence-v1`
   - no session -> `stub-music-intelligence-v1`
3. Unknown requested id falls back to default with explicit `selectionReason`.

## Registry Snapshot
- Engine registry snapshot is locked at `apps/layer0-hub/fixtures/music-engine-registry-snapshot.json`.
- `pnpm test:engine` fails when registry identity metadata (`id`, `name`, `version`) changes without fixture updates.

## Telemetry DTO Snapshot
- Authority-facing telemetry DTO snapshot is locked at `apps/layer0-hub/fixtures/music-telemetry-snapshots.json`.
- DTO builder lives in `apps/layer0-hub/src/services/musicTelemetryDto.ts`.
- Schema constant is `AUTHORITY_MUSIC_TELEMETRY_SCHEMA_VERSION` in `apps/layer0-hub/src/domain/musicTelemetryContracts.ts`.
