# Antiphon Suite Monorepo (Layer 1 Control-Plane)

Silent control-plane for auth, entitlement, install/update authority, offline trust, and launch boundaries.

## Quickstart (Operator)

Daily control-plane verification path:

1. `npm install`
2. `npm run gate`
3. `npm run demo`

If `npm run demo` fails, run `npm run smoke`.
If `npm run rc-check` fails, it reports scoped control-plane dirt only; legacy quarantine drift is ignored.

RC finalization path:

1. `npm run rc0-release`
2. `npm run rc0-tag`
3. `npm run rc0-finalize`

## Command Reference

- `npm run smoke`  
  Deterministic control-plane + foundation checks.

- `npm run gate`  
  Smoke + public surface lock + reason coverage + scoped rc-check + legacy staged guard + integration checks + operator contract check.

- `npm run demo`  
  One-command operator proof: entitlements, install/update actions, trust validation, hub-optional marker.

- `npm run rc-check`  
  Scoped clean-state reproducibility preflight (control-plane scope only, required artifacts, node version, scope governance acknowledgement).

- `npm run rc0-release`  
  Deterministic RC release dry-run manifest build with precondition checks.

- `npm run rc0-finalize`  
  Deterministic final manifest build; requires RC tag to exist and target HEAD.

- `node scripts/demo-hub.mjs`  
  Hub-oriented human-readable control-plane status flow.

- `node scripts/demo-layer.mjs`  
  Headless layer-app consumer projection proof.

- `node scripts/proof-layer-app.mjs`  
  End-to-end real layer-app artifact pipeline proof (install -> update -> rollback -> hub-optional).

- `node scripts/proof-trust-install-boundary.mjs`  
  Deterministic trust + installer boundary failure semantics proof.
- `node scripts/proof-long-run-determinism.mjs`  
  Restart + clock-drift + repeated-cycle determinism proof (snapshot-locked).

## Hub-Optional

Previously authorized apps remain runnable offline without Hub process presence.

## Public API Surface

Layer apps integrate only through:
`apps/layer0-hub/src/services/publicControlPlane.ts`


## Failure Codes

- `repo_scope_not_clean`: control-plane scoped files have uncommitted changes.
- `legacy_staged_forbidden`: frozen legacy/music-domain files are staged in git index.
- `scope_config_changed_unacknowledged`: `control-plane.scope.json` changed without matching acknowledgement hash update.

- `node scripts/operator-contract-check.mjs`  
  Validates rc0 operator contract surface and lock snapshot.
