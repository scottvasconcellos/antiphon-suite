# Operator Failure Remediation

Top control-plane failure classes and what to do. Source: `controlPlaneReasonTaxonomy.ts`.

## Emitted by current HubEngine (install/update path)

The following reason codes are returned by the main Hub install/update flow (`hubEngine.ts` + authority + artifact fetcher + disk installer):

- **Authority:** `failed_gateway`, `blocked_app_not_found`, `blocked_not_owned`, `blocked_not_installed`, `blocked_no_update_available`, `blocked_invalid_transition`
- **Artifact fetch:** `artifact_not_found`, `artifact_missing_file`, `artifact_read_error`, `browser_environment`
- **Disk install:** `artifact_digest_mismatch`, `artifact_write_error`, `artifact_parse_error`, `artifact_directory_error`, `browser_environment`
- **Success (browser):** `ok_browser_install`, `ok_browser_update`

Codes in the tables below that are not in this list are **reserved** or emitted by other paths (e.g. download boundary, persistence simulation, artifact installer execution, trust verification).

## Install/Update failures

| Reason Code | Remediation |
|-------------|-------------|
| `failed_download_step` | retry_install (reserved / download boundary) |
| `failed_install_step` | retry_install (reserved / download boundary) |
| `failed_update_step` | retry_update (reserved / download boundary) |
| `failed_gateway` | retry_or_offline_cache |
| `browser_environment` | none (state synced in browser; sync to disk on desktop) |
| `ok_browser_install` | none |
| `ok_browser_update` | none |
| `artifact_missing_file` | retry_install |
| `artifact_not_found` | retry_install |
| `artifact_read_error` | retry_install |
| `artifact_digest_mismatch` | retry_install |
| `artifact_parse_error` | retry_install |
| `artifact_directory_error` | retry_install |
| `artifact_write_error` | retry_install |
| `artifact_partial_apply` | retry_update (reserved / installer execution) |
| `artifact_rollback_failed` | rebuild_cache (reserved / installer execution) |
| `blocked_app_not_found` | rebuild_cache |
| `blocked_not_owned` | refresh_online_session |
| `blocked_not_installed` | none (install first) |
| `blocked_no_update_available` | none |

## Persistence / cache failures

| Reason Code | Remediation |
|-------------|-------------|
| `invalid_json` | rebuild_cache |
| `invalid_root_shape` | rebuild_cache |
| `unsupported_schema_or_version` | upgrade_or_downgrade_cache_version |
| `atomic_write_power_loss` | retry_atomic_write (reserved / persistence simulation) |
| `atomic_write_conflict` | retry_atomic_write (reserved / persistence simulation) |
| `atomic_write_corrupt_temp` | rebuild_cache (reserved / persistence simulation) |

## Trust / offline failures

| Reason Code | Remediation |
|-------------|-------------|
| `offline_entitlement_expired` | refresh_online_session |
| `clock_skew_detected` | refresh_online_session |
| `invalid_trust_artifact_json` | rebuild_trust_artifact |
| `artifact_signature_invalid` | reissue_artifact_signature |

## Recovery flow

1. **Retry**: `retry_install`, `retry_update`, `retry_atomic_write` — run the action again.
2. **Refresh session**: `refresh_online_session` — sign in again or revalidate entitlements.
3. **Rebuild**: `rebuild_cache`, `rebuild_trust_artifact`, `rebuild_artifact_manifest` — clear local state and refetch from authority.
4. **Offline fallback**: `retry_or_offline_cache` — if authority unreachable, previously authorized apps remain runnable (hub-optional).
