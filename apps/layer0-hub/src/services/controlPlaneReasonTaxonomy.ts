export const CONTROL_PLANE_REASON_TAXONOMY = {
  ok_version_supported: "none",
  unsupported_contract_version: "upgrade_or_downgrade_to_supported_version",
  ok_cache_loaded: "none",
  invalid_json: "rebuild_cache",
  invalid_root_shape: "rebuild_cache",
  unsupported_schema_or_version: "upgrade_or_downgrade_cache_version",
  invalid_offline_cache: "rebuild_cache",
  invalid_install_state: "rebuild_cache",
  invalid_entitlement_decision: "rebuild_cache",
  stale_timestamp: "refresh_online_session",
  ok_offline_entitlement_fresh: "none",
  offline_entitlement_expired: "refresh_online_session",
  clock_skew_detected: "refresh_online_session",
  ok_mixed_entitlement_timestamps: "none",
  mixed_entitlement_timestamps_skewed: "refresh_online_session",
  ok_install_completed: "none",
  ok_update_completed: "none",
  blocked_app_not_found: "rebuild_cache",
  blocked_not_owned: "refresh_online_session",
  blocked_not_installed: "none",
  blocked_no_update_available: "none",
  blocked_invalid_transition: "none",
  failed_download_step: "retry_install",
  failed_install_step: "retry_install",
  failed_update_step: "retry_update",
  failed_install_non_zero: "retry_install",
  failed_update_non_zero: "retry_update",
  failed_install_timeout: "retry_install",
  failed_update_timeout: "retry_update",
  failed_gateway: "retry_or_offline_cache",
  ok_update_candidate_selected: "none",
  ok_update_rollback_applied: "none",
  blocked_channel_policy: "none",
  blocked_no_last_known_good: "none",
  malformed: "reissue_token",
  signature_invalid: "reissue_token",
  expired: "reissue_token",
  claims_invalid: "reissue_token"
  ,
  ok_trust_artifact_loaded: "none",
  invalid_trust_artifact_json: "rebuild_trust_artifact",
  invalid_trust_artifact_shape: "rebuild_trust_artifact",
  unsupported_trust_artifact_version: "upgrade_or_downgrade_to_supported_version",
  trust_artifact_clock_skew: "refresh_online_session"
  ,
  ok_artifact_manifest_loaded: "none",
  invalid_artifact_manifest_json: "rebuild_artifact_manifest",
  invalid_artifact_manifest_shape: "rebuild_artifact_manifest",
  unsupported_artifact_manifest_version: "upgrade_or_downgrade_to_supported_version",
  ok_artifact_apply_completed: "none",
  artifact_missing_file: "retry_install",
  artifact_digest_mismatch: "retry_install",
  artifact_partial_apply: "retry_update",
  artifact_rollback_failed: "rebuild_cache"
  ,
  ok_artifact_trust_verified: "none",
  artifact_signature_missing: "reissue_artifact_signature",
  artifact_signature_invalid: "reissue_artifact_signature",
  artifact_manifest_corrupt: "rebuild_artifact_manifest",
  artifact_app_version_mismatch: "retry_install",
  artifact_signature_clock_skew: "refresh_online_session"
  ,
  ok_uninstall_completed: "none",
  blocked_uninstall_busy: "none"
} as const;

export type ControlPlaneReasonCode = keyof typeof CONTROL_PLANE_REASON_TAXONOMY;
export type ControlPlaneRemediation = (typeof CONTROL_PLANE_REASON_TAXONOMY)[ControlPlaneReasonCode];

export function remediationForReason(code: ControlPlaneReasonCode): ControlPlaneRemediation {
  return CONTROL_PLANE_REASON_TAXONOMY[code];
}

export function listReasonCodes(): ControlPlaneReasonCode[] {
  return Object.keys(CONTROL_PLANE_REASON_TAXONOMY).sort() as ControlPlaneReasonCode[];
}
