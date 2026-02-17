# Layer App Compatibility Spec

This spec defines what a **layer app** must ship to be installable, updatable, and launchable via the Antiphon Hub control-plane.

## Scope

- **Artifact manifest** — JSON schema and validation rules
- **Entitlement mapping** — How ownership/entitlement maps to install/update/launch
- **Launch boundary** — How Hub issues and layer apps verify launch tokens
- **Examples** — Reference fixtures in this repo

## 1. Artifact Manifest

### Schema

Each layer app ships a `manifest.json` at the root of its artifact directory. The manifest must conform to:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | yes | Must be `antiphon.artifact-manifest` |
| `version` | number | yes | Must be `1` |
| `appId` | string | yes | Canonical app identifier (e.g. `antiphon.layer.hello-world`) |
| `appVersion` | string | yes | Semantic version (e.g. `1.0.0`, `1.1.0-beta.1`) |
| `channel` | string | yes | `stable` or `beta` |
| `digestAlgorithm` | string | yes | Must be `sha256` |
| `files` | array | yes | List of payload files with path, size, sha256 |
| `signature` | object | no | Optional trust envelope (keyId, algorithm, signature) |

### File entry

Each entry in `files` must have:

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | Relative path within the artifact |
| `size` | number | File size in bytes |
| `sha256` | string | Lowercase hex SHA-256 digest |

### Example

```json
{
  "schema": "antiphon.artifact-manifest",
  "version": 1,
  "appId": "antiphon.layer.hello-world",
  "appVersion": "1.0.0",
  "channel": "stable",
  "digestAlgorithm": "sha256",
  "files": [
    {
      "path": "app.txt",
      "size": 19,
      "sha256": "a9b2d666a9b2d666a9b2d666a9b2d666a9b2d666a9b2d666a9b2d666a9b2d666"
    }
  ],
  "signature": {
    "keyId": "layer-hello-k1",
    "algorithm": "ed25519",
    "signature": "77933ff1"
  }
}
```

### Reference fixtures

| App | Path | Versions |
|-----|------|----------|
| hello-world | `apps/layer-app-hello-world/artifacts/` | v1 (1.0.0), v2 (1.1.0) |
| rhythm | `apps/layer-app-rhythm/artifacts/` | v1 (1.0.0), v2 (1.1.0-beta.1) |

## 2. Entitlement Mapping

### Flow

1. **Authority** — The entitlement authority (e.g. `layer0-authority`) returns a list of owned apps with `id`, `name`, `version`, `installedVersion`, `owned`, `updateAvailable`.
2. **Hub** — The Hub engine bootstraps from the authority and persists the snapshot. Install/update decisions use the authority’s entitlement list.
3. **App ID alignment** — The authority’s `id` must align with the artifact manifest’s `appId` for install/update to succeed. (Authority may use product IDs like `hub-synth` with a mapping layer; the artifact manifest always uses the canonical `appId`.)

### Install / update authority rules

- **Install** — Allowed only if the app is owned and not yet installed.
- **Update** — Allowed only if the app is owned, installed, and `updateAvailable` is true.
- **Blocked** — `blocked_not_owned`, `blocked_not_installed`, `blocked_no_update_available`, `blocked_app_not_found`.

### Reason codes

See `apps/layer0-hub/src/services/installUpdateAuthority.ts` for the full taxonomy. Common success codes:

- `ok_install_completed`
- `ok_update_completed`

### Demo layer apps: version and lifecycle semantics

For the demo layer apps shipped in this repo:

- `apps/layer-app-hello-world/artifacts/`
  - `v1/manifest.json` → `appVersion: 1.0.0`
  - `v2/manifest.json` → `appVersion: 1.1.0`
- `apps/layer-app-rhythm/artifacts/`
  - `v1/manifest.json` → `appVersion: 1.0.0`
  - `v2/manifest.json` → `appVersion: 1.1.0-beta.1`

The entitlement authority (`apps/layer0-authority`) advertises the **latest distributable version** for each demo app:

- `antiphon.layer.hello-world` → `version: "1.1.0"`, `installedVersion: null`, `updateAvailable: false`
- `antiphon.layer.rhythm` → `version: "1.1.0-beta.1"`, `installedVersion: null`, `updateAvailable: false`

This means:

- A **fresh install** of a demo app installs the authority’s `version`:
  - Hello World → `1.1.0` (artifact directory `v2/`)
  - Rhythm → `1.1.0-beta.1` (artifact directory `v2/`)
- Earlier artifacts (`1.0.0` in `v1/` for each app) are kept as **reference fixtures** and for internal scenario tests; they are not currently exposed as a “first install then update” path in the live entitlement data.
- The `updateAvailable` flag for these demo apps is `false` after install, so the Hub does not currently offer a user-visible update flow for them. Future real apps can model a full `1.0.0 → 1.1.0` lifecycle by:
  - Advertising `version: "1.0.0"`, `installedVersion: null`, `updateAvailable: false` initially.
  - Flipping to `version: "1.1.0"`, `installedVersion: "1.0.0"`, `updateAvailable: true` when the update is available.

Version strings map to artifact directories by convention:

- `1.0.0` → `v1/`
- `1.1.0` and `1.1.0-beta.1` → `v2/`

The Hub’s artifact fetcher performs this mapping when resolving which manifest and payload files to read from disk for a given entitlement `version`.

## 3. Launch Boundary

### Hub-optional behavior

Layer apps must remain runnable **without** the Hub process. After a user is once authorized and installs an app, the app can run offline and without Hub.

### Launch token

The Hub may issue a launch token (JWT-like) for verification. Layer apps can:

- Verify the token if present (recommended for audit).
- Run without a token when Hub is absent, as long as the app was previously installed and authorized.

### Trust invariants

- `authorizedOnce` — User was authenticated at least once.
- `hubOptionalRunnable` — App runs without Hub after first authorization.
- `offlineRunnableWithoutHub` — App runs offline without Hub.

## 4. Directory Layout for Layer Apps

Each layer app should ship at least:

```
apps/<layer-app-name>/
  artifacts/
    v1/
      manifest.json
      <payload files>
    v2/
      manifest.json
      <payload files>
```

Version directories (`v1`, `v2`, …) contain the manifest and payload files referenced by the manifest.

## 5. Integration Checklist

For a new layer app:

1. Add artifact directories under `apps/<layer-app-name>/artifacts/`.
2. Add `manifest.json` per version with correct `appId`, `appVersion`, `channel`, and `files`.
3. Ensure payload file digests in `manifest.json` match actual file SHA-256.
4. Register the app with the entitlement authority (or demo fixtures) so `owned` and `updateAvailable` are set correctly.
5. Run `npm run gate` to confirm control-plane smoke, integration checks, and proofs pass.

## 6. Failure Remediation

See `docs/OPERATOR_FAILURE_REMEDIATION.md` for failure→remediation mapping.

Common artifact-related failures:

- `artifact_missing_file` — Payload file not found at path in manifest.
- `artifact_digest_mismatch` — File SHA-256 does not match manifest.
- `invalid_artifact_manifest_json` — Malformed JSON.
- `invalid_artifact_manifest_shape` — Missing or invalid required fields.
- `unsupported_artifact_manifest_version` — Schema or version not supported.
