# HubEngine Specification (v1)

## Deterministic Contract
- Inputs: current `HubSnapshot` plus a typed `HubEvent`.
- Output: next `HubState` with stable status message and no side effects.
- Determinism rule: same snapshot + same event payload -> identical state output.

## State Model
- Snapshot fields: `session`, `entitlements`, `offlineCache`, `transactions`.
- Status fields: `mode`, `message`.

## Error Handling
- Domain transition logic does not throw for valid events.
- Runtime failures are represented as `status.mode = "runtime-error"` by runtime layer.

## Error Taxonomy
- `configuration-error`: invalid/missing runtime configuration or explicit reset state.
- `runtime-error`: transport/integration failure surfaced by runtime wrapper.
- `ready`: deterministic domain transition completed successfully.

## Contract Boundaries
- Domain (`applyHubEvent`) accepts only resolved data payloads and never performs IO.
- Services/gateways own all network and storage side effects.
- UI consumes only returned `HubState` and never mutates snapshot directly.

## Invariants
- `session = null` after `SIGNED_OUT`.
- `RESET` returns `DEFAULT_HUB_SNAPSHOT` and configuration-error status.
- `APP_INSTALLED` and `APP_UPDATED` upsert a single entitlement by `id`.
- Events that carry transactions replace snapshot transaction list.

## Minimal Deterministic Path
- `applyHubEvent(snapshot, event)` is the single headless transition function.
- Runtime/service layers perform IO first, then call `applyHubEvent`.
