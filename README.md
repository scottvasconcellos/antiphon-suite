# Antiphon Suite Monorepo (Layer 1 Control-Plane)

Silent control-plane for auth, entitlement, install/update authority, offline trust, and launch boundaries.

## Quickstart (Operator)

1. `npm install`
2. `npm run gate`
3. `npm run demo`

If `npm run demo` fails, run `npm run smoke`.
If `npm run rc-check` fails, it reports scoped control-plane dirt only; legacy quarantine drift is ignored.

## Command Reference

- `npm run smoke`  
  Deterministic control-plane + foundation checks.

- `npm run gate`  
  Smoke + public surface lock + reason coverage + integration checks.

- `npm run demo`  
  One-command operator proof: entitlements, install/update actions, trust validation, hub-optional marker.

- `npm run rc-check`  
  Scoped clean-state reproducibility preflight (control-plane scope only, required artifacts, node version).

- `node scripts/demo-hub.mjs`  
  Hub-oriented human-readable control-plane status flow.

- `node scripts/demo-layer.mjs`  
  Headless layer-app consumer projection proof.

- `node scripts/proof-layer-app.mjs`  
  End-to-end real layer-app artifact pipeline proof (install -> update -> rollback -> hub-optional).

## Hub-Optional

Previously authorized apps remain runnable offline without Hub process presence.

## Public API Surface

Layer apps integrate only through:
`apps/layer0-hub/src/services/publicControlPlane.ts`
