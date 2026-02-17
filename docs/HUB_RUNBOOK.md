# Hub Runbook

How to run the Antiphon Hub and entitlement authority, and how to troubleshoot common failures.

## How to open the Hub app (view now)

**Fastest (stub mode, no backend):**

1. From the monorepo root: `cd apps/layer0-hub && VITE_ANTIPHON_ENGINE_MODE=stub pnpm dev`
2. In your browser open **http://localhost:5173**

**With Authority (full stack, real entitlements):**

1. Terminal 1: `cd apps/layer0-authority && pnpm dev` (API on http://localhost:8787)
2. Terminal 2: `cd apps/layer0-hub && VITE_ANTIPHON_API_URL=http://localhost:8787 pnpm dev`
3. In your browser open **http://localhost:5173**

## Quick start

All commands below are from the **monorepo root** (the folder that contains `apps/`, `docs/`, `package.json`).

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

Authority listens on http://localhost:8787 (or set `PORT`).

**Terminal 2 — Hub (UI)**

```bash
cd apps/layer0-hub
VITE_ANTIPHON_API_URL=http://localhost:8787 pnpm dev
```

Open http://localhost:5173. Hub fetches entitlements from the authority. Sign in with a valid email (e.g. `producer@antiphon.audio`) to see owned apps and run install/update.

## Auth (Firebase)

**Short version:** See **`docs/PHASE4_TLDR.md`** for a 3-step checklist (paste config, enable sign-in methods, run).

When Firebase is configured, the Hub shows **Google**, **Apple**, and **Email+password** sign-in. The Hub sends the Firebase ID token to the Authority; the Authority verifies it (project `antiphon-sso`) and creates a session. When Firebase is not configured, the Hub shows **email-only** sign-in (Authority `POST /auth/session`); stub mode also uses email-only.

- **Hub**: Set Firebase web app config via env (see table below). Copy `.env.example` to `.env` and fill in locally. Never commit `.env` (it is gitignored).
- **Authority**: Set `FIREBASE_PROJECT_ID=antiphon-sso` so `POST /auth/firebase` can verify tokens. No service account required (verification uses Google public keys).
- **Firebase Console**: Enable Google, Apple, and Email/Password under Authentication → Sign-in method. Add authorized domains (e.g. `localhost`) for redirects.

## Environment variables

| Variable | App | Default | Description |
|----------|-----|---------|-------------|
| `VITE_ANTIPHON_ENGINE_MODE` | Hub | — | `stub` = use stub engine (no authority). Omit for real engine. |
| `VITE_ANTIPHON_API_URL` | Hub | — | Authority base URL (e.g. `http://localhost:8787`). Required when not in stub mode. |
| `VITE_FIREBASE_API_KEY` | Hub | — | Firebase web API key (from Firebase Console). Optional; if set with auth domain and project ID, Hub shows Firebase sign-in. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Hub | — | Firebase auth domain (e.g. `antiphon-sso.firebaseapp.com`). |
| `VITE_FIREBASE_PROJECT_ID` | Hub | — | Firebase project ID (e.g. `antiphon-sso`). |
| `VITE_FIREBASE_*` | Hub | — | Optional: `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`, `MEASUREMENT_ID`. Or use a single `VITE_FIREBASE_CONFIG` JSON string. |
| `FIREBASE_PROJECT_ID` | Authority | — | Firebase project ID for ID token verification (e.g. `antiphon-sso`). When set, `POST /auth/firebase` is enabled. |
| `PORT` | Authority | 8787 | Authority server port. |

## Hub UI overview

- **Sign in** — When not signed in: Firebase (Google, Apple, Email+password) or email-only form. When signed in: identity and Sign out in the hero; app catalog below.
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

### Installed apps location

When you install a layer app via the Hub UI, artifacts are installed to disk at:

```
~/.antiphon/apps/<appId>/<version>/
```

For example:
- `~/.antiphon/apps/antiphon.layer.hello-world/1.0.0/`
- `~/.antiphon/apps/antiphon.layer.rhythm/1.1.0-beta.1/`

Each installation directory contains:
- `manifest.json` — The artifact manifest
- Payload files (e.g. `app.txt`) — The actual app files

You can override the base directory by setting `ANTIPHON_APPS_DIR` environment variable.

### Launch tokens

When an app is installed and owned, you can generate a launch token via the **Launch** button in the Hub UI. The token is a JWT that includes:
- `appId` — The app identifier
- `userId` — The user who installed the app
- `entitlementOutcome` — "Authorized" or "OfflineAuthorized"
- `issuedAt` — Token issuance timestamp (epoch seconds)
- `expiresAt` — Token expiration (1 hour TTL)

The token is copied to your clipboard when you click Launch. Layer apps can verify this token to confirm they are authorized to run. Tokens remain valid even after signing out (hub-optional behavior).

## Gate and smoke

- **`npm run gate`** — Full validation (smoke, lock checks, proofs, integration demo). Run before merge.
- **`npm run smoke`** — Build, typecheck, control-plane smoke, foundation smoke.
- **`npm run demo`** — Human-readable entitlement/install/trust proof (included in gate).
