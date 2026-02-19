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

## Phase D scope

Hub is **maintenance-focused** for RC1; major innovation shifts to Layer apps. This repo remains the silent control-plane for auth, entitlements, install/update, and launch boundaries.

## Foundation guarantees (Phase 5)

At the current milestone, the Layer 1 control-plane guarantees the following for the demo layer apps:

- **On-disk installs**
  - Artifacts for `antiphon.layer.hello-world` and `antiphon.layer.rhythm` are installed to
    `~/.antiphon/apps/<appId>/<version>/` (or `ANTIPHON_APPS_DIR`) using an atomic
    `target.tmp → target` rename.
  - The install path is derived from the entitlement authority’s `version` field and the
    app’s canonical `appId` (see `docs/LAYER_APP_COMPATIBILITY_SPEC.md` for mapping details).
- **Manifest and payload validation**
  - Artifact manifests are parsed and validated via `parseArtifactManifest`.
  - `appId` and `appVersion` in the manifest must match the install request.
  - Each payload file must match the manifest’s declared digest and byte size before the
    install is committed to disk.
- **Launch tokens**
  - Launch tokens are deterministic, signed tokens that encode appId, userId, entitlement
    outcome, and issued/expiry times. They are already exercised by the control-plane smoke
    harness (`scripts/control-plane-smoke.mjs`).

To re-verify the new real-disk installation path introduced in Phase 5, run:

```bash
node scripts/phase5-foundation-e2e.mjs
```

This script delegates to the foundation artifact test in `apps/layer0-hub/tests/foundation-artifact.test.ts`,
which fetches real artifacts from `apps/layer-app-*/artifacts/` and installs them to a
temporary apps directory on disk.

## Public API

Layer apps integrate via `apps/layer0-hub/src/services/publicControlPlane.ts`.

## Support

- **Hub runbook** — `docs/HUB_RUNBOOK.md` — How to run Hub + authority, env vars, common failures.
- **Layer-app spec** — `docs/LAYER_APP_COMPATIBILITY_SPEC.md` — Artifact manifest format, entitlement mapping, launch boundary.
- **Design principles** — `docs/DESIGN_PRINCIPLES.md` — Layout, hierarchy, typography, and logo placement so UIs stay visually consistent; central reference for agents and developers.
- **Legal (shared)** — `docs/legal/` — Canonical Privacy Policy and EULA for all apps and endpoints; Hub and other apps serve or link to these.
- **Shared assets** — `assets/` — Brand logos and other shared PNG/assets; see `assets/README.md`. All apps should pull from here. Hub copies `assets/brand/` into its public folder at build/dev.

## Failure Codes

See `docs/OPERATOR_FAILURE_REMEDIATION.md` for failure→remediation mapping.

- `repo_scope_not_clean`: uncommitted scoped changes; commit or stash
- `legacy_staged_forbidden`: frozen music-domain files staged; unstage
- `scope_config_changed_unacknowledged`: update `control-plane.scope.ack.json` after scope change
