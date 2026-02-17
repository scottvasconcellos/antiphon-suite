# Antiphon Suite Monorepo (Layer 1 Control-Plane)

Silent control-plane for auth, entitlement, install/update authority, offline trust, and launch boundaries.

## Operator Runbook

**Daily verify (one command):**
```bash
npm install && npm run gate
```

**RC finalize (when releasing):**
```bash
npm run rc0-release && npm run rc0-tag && npm run rc0-finalize
```

`gate` runs smoke, public-surface lock, reason-coverage, rc-check, legacy guard, integration checks (including demo), proofs, and operator-contract check. If gate passes, you are good.

If gate fails: run `npm run smoke` to isolate; if `rc-check` fails, commit or stash scoped changes (legacy quarantine drift is ignored).

## Reference

- `npm run gate` — Full validation (smoke + lock checks + proofs)
- `npm run smoke` — Build, typecheck, control-plane + foundation smoke
- `npm run demo` — Human-readable entitlement/install/trust proof (also run by gate)
- `npm run rc-check` — Scoped clean-state preflight; required before RC finalize
- `npm run rc0-release` — Dry-run manifest; `rc0-tag` — create tag; `rc0-finalize` — final manifest (tag must target HEAD)

## Hub-Optional

Previously authorized apps remain runnable offline without Hub process presence.

## Public API

Layer apps integrate via `apps/layer0-hub/src/services/publicControlPlane.ts`.

## Support

- **Hub runbook** — `docs/HUB_RUNBOOK.md` — How to run Hub + authority, env vars, common failures.
- **Layer-app spec** — `docs/LAYER_APP_COMPATIBILITY_SPEC.md` — Artifact manifest format, entitlement mapping, launch boundary.

## Failure Codes

See `docs/OPERATOR_FAILURE_REMEDIATION.md` for failure→remediation mapping.

- `repo_scope_not_clean`: uncommitted scoped changes; commit or stash
- `legacy_staged_forbidden`: frozen music-domain files staged; unstage
- `scope_config_changed_unacknowledged`: update `control-plane.scope.ack.json` after scope change
