import { type EntitledApp } from "../domain/types";
import { remediationForReason } from "./controlPlaneReasonTaxonomy";

export type UpdateRollbackDecision = {
  appId: string;
  preservedInstalledVersion: string | null;
  reasonCode:
    | "ok_update_rollback_applied"
    | "blocked_no_last_known_good"
    | "blocked_channel_policy"
    | "blocked_no_update_available";
  remediation: string;
};

export const UPDATE_ROLLBACK_REASON_CODES = [
  "ok_update_rollback_applied",
  "blocked_no_last_known_good",
  "blocked_channel_policy",
  "blocked_no_update_available"
] as const;

export function applyUpdateRollback(
  app: EntitledApp,
  options: { fallbackChannel?: "stable" | "beta"; clearCacheRequired?: boolean } = {}
): UpdateRollbackDecision {
  if (!app.installedVersion) {
    return {
      appId: app.id,
      preservedInstalledVersion: null,
      reasonCode: "blocked_no_last_known_good",
      remediation: remediationForReason("blocked_no_update_available")
    };
  }
  if (options.fallbackChannel === "stable" && app.updateAvailable) {
    return {
      appId: app.id,
      preservedInstalledVersion: app.installedVersion,
      reasonCode: "blocked_channel_policy",
      remediation: remediationForReason("blocked_channel_policy")
    };
  }
  if (options.clearCacheRequired) {
    return {
      appId: app.id,
      preservedInstalledVersion: app.installedVersion,
      reasonCode: "blocked_no_update_available",
      remediation: remediationForReason("blocked_no_update_available")
    };
  }
  return {
    appId: app.id,
    preservedInstalledVersion: app.installedVersion,
    reasonCode: "ok_update_rollback_applied",
    remediation: remediationForReason("ok_update_candidate_selected")
  };
}
