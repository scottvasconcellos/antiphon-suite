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
  failed_gateway: "retry_or_offline_cache",
  malformed: "reissue_token",
  signature_invalid: "reissue_token",
  expired: "reissue_token",
  claims_invalid: "reissue_token"
} as const;

export type ControlPlaneReasonCode = keyof typeof CONTROL_PLANE_REASON_TAXONOMY;
export type ControlPlaneRemediation = (typeof CONTROL_PLANE_REASON_TAXONOMY)[ControlPlaneReasonCode];

export function remediationForReason(code: ControlPlaneReasonCode): ControlPlaneRemediation {
  return CONTROL_PLANE_REASON_TAXONOMY[code];
}

export function listReasonCodes(): ControlPlaneReasonCode[] {
  return Object.keys(CONTROL_PLANE_REASON_TAXONOMY).sort() as ControlPlaneReasonCode[];
}
