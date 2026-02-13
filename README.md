# Antiphon Suite Monorepo (Layer 1 Control-Plane)

This repo contains the Layer 1 Hub control-plane foundation.
It is silent infrastructure for auth, entitlement, install/update, offline trust, and launch boundaries.

## Operator Commands

- `npm run smoke`
  - Runs deterministic headless checks:
    - `node scripts/control-plane-smoke.mjs`
    - `node scripts/foundation-smoke.mjs`

- `npm run gate`
  - Prints repo status (read-only)
  - Runs `npm run smoke`
  - Verifies public API surface snapshot
  - Verifies reason coverage snapshot
  - Exits non-zero on any failure

- `npm run demo:hub`
  - Starts Hub dev server and prints where to open it

- `npm run demo:layer`
  - Runs deterministic layer-app example harness against current control-plane artifacts

- `npm run release:check`
  - Runs `npm run gate`
  - Requires clean git status
  - Prints current commit hash
  - Exits non-zero on any failure

## Hub-Optional Meaning

"Hub-optional" means previously authorized apps can still run offline without Hub process presence.
The control-plane persists trust artifacts and validates them deterministically.
This is anti-gating posture, not runtime DRM.

## Public API Surface

The only intended integration surface for layer apps is:

- `apps/layer0-hub/src/services/publicControlPlane.ts`

Use this file for control-plane imports; avoid internal domain/service module coupling in app consumers.
