# Layer 5 - Integration Plan (Batch 1)

## Integration Sequence
1. Stabilize domain contract types for session, entitlements, transactions, offline cache.
2. Add explicit gateway interfaces in hub services for all authority endpoints.
3. Add UI view-model mappers from service DTOs to screen state.
4. Add integration tests for happy path and ownership failure path.

## Batch 2 Progress
- Implemented authority response contract parsing in hub service layer.
- Implemented UI view-model mapping to keep projection logic out of component render flow.

## Batch 3 Progress
- Isolated UI projection helpers in `hubViewModel.ts`.
- Isolated hub runtime action error handling in `hubRuntime.ts`.

## Batch 5 Progress
- Added executable structure smoke verification in `scripts/structure-smoke.mjs`.
- Covered gateway contract parsing and runtime task recovery paths.
- Wired structure smoke into root `pnpm test` via `scripts/foundation-smoke.mjs`.

## Done Criteria For Structure Entry
- Domain contracts documented and enforced at compile-time.
- Service adapters cover all authority routes.
- UI modules consume mapped view models only.
- Integration tests run under `pnpm test` or `pnpm test:structure`.
- Gateway contract parsing and runtime failure-recovery paths are executable in local smoke verification.

## Non-Goals In Batch 1
- No visual polish.
- No new engine implementation.
- No token invention.
