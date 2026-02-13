# Antiphon Suite Monorepo (Layer 1 Control-Plane)

This repo provides the Layer 1 Hub control-plane foundation:
auth, entitlement, install/update authority, offline trust, launch boundaries.

## Operator Handbook

- `npm run smoke`
  - Proves deterministic headless control-plane + foundation behavior is stable.

- `npm run gate`
  - Proves smoke passes, public surface snapshot is unchanged, and reason coverage is valid.

- `node scripts/demo-hub.mjs`
  - Proves 60-second operator flow: catalog, entitlements, install/update transitions, channel selection, hub-optional trust proof.

- `node scripts/demo-layer.mjs`
  - Proves a layer-app consumer can read control-plane outcomes deterministically using current artifacts.

## Hub-Optional

Hub-optional means previously authorized apps remain runnable offline without Hub process presence.
Trust artifacts are persisted and validated deterministically.

## Public API Surface

Layer-app integrations must use:

- `apps/layer0-hub/src/services/publicControlPlane.ts`
