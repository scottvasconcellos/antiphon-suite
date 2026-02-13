# Layer 5 - Integration Plan (Batch 1)

## Integration Sequence
1. Stabilize domain contract types for session, entitlements, transactions, offline cache.
2. Add explicit gateway interfaces in hub services for all authority endpoints.
3. Add UI view-model mappers from service DTOs to screen state.
4. Add integration tests for happy path and ownership failure path.

## Done Criteria For Structure Entry
- Domain contracts documented and enforced at compile-time.
- Service adapters cover all authority routes.
- UI modules consume mapped view models only.
- Integration tests run under `pnpm test` or `pnpm test:structure`.

## Non-Goals In Batch 1
- No visual polish.
- No new engine implementation.
- No token invention.
