# Operator Failure Remediation

Top control-plane failure classes and what to do. Source: `controlPlaneReasonTaxonomy.ts`.

## Install/Update failures

| Reason Code | Remediation |
|-------------|-------------|
| `failed_download_step` | retry_install |
| `failed_install_step` | retry_install |
| `failed_update_step` | retry_update |
| `failed_gateway` | retry_or_offline_cache |
| `artifact_missing_file` | retry_install |
| `artifact_digest_mismatch` | retry_install |
| `artifact_partial_apply` | retry_update |
| `artifact_rollback_failed` | rebuild_cache |
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
| `atomic_write_power_loss` | retry_atomic_write |
| `atomic_write_conflict` | retry_atomic_write |
| `atomic_write_corrupt_temp` | rebuild_cache |

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
