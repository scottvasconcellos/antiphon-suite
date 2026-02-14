# Antiphon Suite Monorepo (Layer 1 Control-Plane)

Silent control-plane for auth, entitlement, install/update authority, offline trust, and launch boundaries.

## Operator Handbook

- `npm run smoke`  
  Deterministic control-plane + foundation checks (includes artifact trust and installer paths).

- `npm run gate`  
  Runs smoke + public surface lock + reason coverage + integration checks.

- `node scripts/demo-hub.mjs`  
  60-second human-readable control-plane status flow.

- `node scripts/demo-layer.mjs`  
  Headless layer-app consumer projection proof.

- `node scripts/proof-layer-app.mjs`  
  End-to-end real layer-app artifact pipeline proof (install -> update -> rollback -> hub-optional).

## Hub-Optional

Previously authorized apps remain runnable offline without Hub process presence.

## Public API Surface

Layer apps integrate only through:
`apps/layer0-hub/src/services/publicControlPlane.ts`
