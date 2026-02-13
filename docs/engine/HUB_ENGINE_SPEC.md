# HubEngine Specification (v1.1)

## Deterministic Contract
- Inputs: current `HubSnapshot` plus a typed `HubEvent`.
- Output: next `HubState` with stable status message and no side effects.
- Determinism rule: same snapshot + same event payload -> identical state output.

## Orchestrator Responsibilities
- Route snapshot-derived engine input into the selected `MusicEnginePlugin`.
- Sequence calls as `HubEngine -> MusicEnginePlugin -> MusicProjectionAdapter`.
- Enforce plugin output contract before adapter projection.
- Return taxonomy-safe result (`ready` or `runtime-error`) without throwing.
- Preserve deterministic behavior for identical snapshot and plugin inputs.

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
- `runtime-error` also covers plugin exceptions and contract violations.

## Contract Boundaries
- Domain (`applyHubEvent`) accepts only resolved data payloads and never performs IO.
- Services/gateways own all network and storage side effects.
- UI consumes only returned `HubState` and never mutates snapshot directly.
- Adapter boundary uses `HubEngineContract`; runtime may wire `HubEngine` (networked) or `StubHubEngine` (headless deterministic).
- Plugin boundary uses `MusicEnginePlugin.evaluate(input)` and must return `{ lane, reason, confidence }`.
- Adapter boundary uses `MusicProjectionAdapter.toProjection(output)` and must return UI-safe projection data (no business logic).

## Invariants
- `session = null` after `SIGNED_OUT`.
- `RESET` returns `DEFAULT_HUB_SNAPSHOT` and configuration-error status.
- `APP_INSTALLED` and `APP_UPDATED` upsert a single entitlement by `id`.
- Events that carry transactions replace snapshot transaction list.

## Minimal Deterministic Path
- `applyHubEvent(snapshot, event)` is the single headless transition function.
- Runtime/service layers perform IO first, then call `applyHubEvent`.

## Verification
- `pnpm test:engine` validates deterministic transition behavior and invariants.
- `pnpm test:engine` also validates minimal `HubEngine` class paths with a headless fake gateway/store.
- `pnpm test:engine` validates orchestrator -> `StubHubEngine` -> `MusicIntelligence` adapter determinism.
- `pnpm test:engine` validates contract enforcement on invalid plugin output and runtime-error taxonomy mapping.
- `pnpm test:engine` validates edge cases: expired offline trust, zero-owned install routing, adapter exception mapping, and confidence clamping.
