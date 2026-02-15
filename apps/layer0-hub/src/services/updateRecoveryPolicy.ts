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
  artifactRecovery: "retain_last_known_good" | "clear_corrupt_descriptor" | "none";
};

export const UPDATE_ROLLBACK_REASON_CODES = [
  "ok_update_rollback_applied",
  "blocked_no_last_known_good",
  "blocked_channel_policy",
  "blocked_no_update_available"
] as const;

export function applyUpdateRollback(
  app: EntitledApp,
  options: {
    fallbackChannel?: "stable" | "beta";
    clearCacheRequired?: boolean;
    artifactDescriptor?: { filePath: string; checksum: string } | null;
    descriptorCorrupt?: boolean;
  } = {}
): UpdateRollbackDecision {
  if (!app.installedVersion) {
    const reasonCode = "blocked_no_last_known_good";
    return {
      appId: app.id,
      preservedInstalledVersion: null,
      reasonCode,
      remediation: remediationForReason(reasonCode),
      artifactRecovery: "none"
    };
  }
  if (options.fallbackChannel === "stable" && app.updateAvailable) {
    return {
      appId: app.id,
      preservedInstalledVersion: app.installedVersion,
      reasonCode: "blocked_channel_policy",
      remediation: remediationForReason("blocked_channel_policy"),
      artifactRecovery: "retain_last_known_good"
    };
  }
  if (options.descriptorCorrupt) {
    return {
      appId: app.id,
      preservedInstalledVersion: app.installedVersion,
      reasonCode: "blocked_no_update_available",
      remediation: remediationForReason("blocked_no_update_available"),
      artifactRecovery: "clear_corrupt_descriptor"
    };
  }
  if (options.clearCacheRequired) {
    return {
      appId: app.id,
      preservedInstalledVersion: app.installedVersion,
      reasonCode: "blocked_no_update_available",
      remediation: remediationForReason("blocked_no_update_available"),
      artifactRecovery: "retain_last_known_good"
    };
  }
  return {
    appId: app.id,
    preservedInstalledVersion: app.installedVersion,
    reasonCode: "ok_update_rollback_applied",
    remediation: remediationForReason("ok_update_rollback_applied"),
    artifactRecovery: options.artifactDescriptor ? "retain_last_known_good" : "none"
  };
}
