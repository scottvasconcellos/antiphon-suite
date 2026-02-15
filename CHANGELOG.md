# Changelog

## RC0 - YYYY-MM-DD

- Added scoped `rc-check` with scope governance lock (`control-plane.scope.json` + ack hash).
- Added staged legacy guard to block frozen legacy/music-domain files from commits.
- Added trust/install boundary proof lock via `scripts/proof-trust-install-boundary.mjs`.
- Added long-run determinism + clock-drift proof lock via `scripts/proof-long-run-determinism.mjs`.
- Added operator contract lock via `scripts/operator-contract-check.mjs`.
- Added deterministic RC0 dry-run release manifest via `scripts/rc0-release-dry-run.mjs`.
