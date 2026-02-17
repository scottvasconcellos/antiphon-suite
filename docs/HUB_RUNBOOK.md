# Hub Runbook

How to run the Antiphon Hub and entitlement authority, and how to troubleshoot common failures.

## Quick start

### Run Hub in stub mode (no authority)

```bash
cd apps/layer0-hub
VITE_ANTIPHON_ENGINE_MODE=stub pnpm dev
```

Open http://localhost:5173. Hub uses in-memory stub data: one owned app (`Antiphon Stub App`), no sign-in required for install/update.

### Run Hub + Authority (full stack)

**Terminal 1 — Authority (API)**

```bash
cd apps/layer0-authority
pnpm dev
```

Authority listens on http://localhost:8799 (or `PORT`).

**Terminal 2 — Hub (UI)**

```bash
cd apps/layer0-hub
VITE_ANTIPHON_API_URL=http://localhost:8799 pnpm dev
```

Open http://localhost:5173. Hub fetches entitlements from the authority. Sign in with a valid email (e.g. `producer@antiphon.audio`) to see owned apps and run install/update.

## Environment variables

| Variable | App | Default | Description |
|----------|-----|---------|-------------|
| `VITE_ANTIPHON_ENGINE_MODE` | Hub | — | `stub` = use stub engine (no authority). Omit for real engine. |
| `VITE_ANTIPHON_API_URL` | Hub | — | Authority base URL (e.g. `http://localhost:8799`). Required when not in stub mode. |
| `PORT` | Authority | 8799 | Authority server port. |

## Hub UI overview

- **App catalog** — Owned apps with Install/Update buttons.
- **Status section** — Cache schema, identity, entitlement, launch readiness, recent ops, status line.

## Common failures and fixes

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| "Set VITE_ANTIPHON_API_URL to connect…" | Hub started without API URL and not in stub mode | Set `VITE_ANTIPHON_API_URL` or `VITE_ANTIPHON_ENGINE_MODE=stub` |
| Install/Update buttons disabled | Engine not ready or status error | Check status line; ensure authority is running and reachable |
| Empty app catalog | Not signed in or no owned entitlements | Sign in (authority must return owned apps); in stub mode, bootstrap auto-loads stub apps |
| Gate fails with EPERM on listen | Sandbox/network restrictions | Run `npm run gate` with full permissions (e.g. outside sandbox) |
| `rc-check` fails | Uncommitted scoped changes | Commit or stash control-plane changes |
| `legacy_staged_forbidden` | Frozen music-domain files staged | Unstage those files |

For full failure→remediation mapping, see `docs/OPERATOR_FAILURE_REMEDIATION.md`.

## Layer apps

To ship a new layer app or understand artifact format, see `docs/LAYER_APP_COMPATIBILITY_SPEC.md`.

## Gate and smoke

- **`npm run gate`** — Full validation (smoke, lock checks, proofs, integration demo). Run before merge.
- **`npm run smoke`** — Build, typecheck, control-plane smoke, foundation smoke.
- **`npm run demo`** — Human-readable entitlement/install/trust proof (included in gate).
