import { type HubSnapshot } from "../domain/types";
import { remediationForReason } from "./controlPlaneReasonTaxonomy";

export type UninstallReasonCode =
  | "ok_uninstall_completed"
  | "blocked_app_not_found"
  | "blocked_not_installed"
  | "blocked_uninstall_busy";

export const UNINSTALL_REASON_CODES = [
  "ok_uninstall_completed",
  "blocked_app_not_found",
  "blocked_not_installed",
  "blocked_uninstall_busy"
] as const;

export type UninstallResult = {
  snapshot: HubSnapshot;
  appId: string;
  ok: boolean;
  reasonCode: UninstallReasonCode;
  remediation: string;
};

export function runUninstall(snapshot: HubSnapshot, appId: string): UninstallResult {
  const app = snapshot.entitlements.find((entry) => entry.id === appId);
  if (!app) {
    return {
      snapshot,
      appId,
      ok: false,
      reasonCode: "blocked_app_not_found",
      remediation: remediationForReason("blocked_app_not_found")
    };
  }

  if (!app.installedVersion) {
    return {
      snapshot,
      appId,
      ok: false,
      reasonCode: "blocked_not_installed",
      remediation: remediationForReason("blocked_not_installed")
    };
  }

  if (app.installState === "installing" || app.updateAvailable) {
    return {
      snapshot,
      appId,
      ok: false,
      reasonCode: "blocked_uninstall_busy",
      remediation: remediationForReason("blocked_invalid_transition")
    };
  }

  return {
    snapshot: {
      ...snapshot,
      entitlements: snapshot.entitlements
        .map((entry) =>
          entry.id === appId
            ? {
                ...entry,
                installedVersion: null,
                installState: "not-installed" as const,
                updateAvailable: false
              }
            : entry
        )
        .sort((a, b) => a.id.localeCompare(b.id))
    },
    appId,
    ok: true,
    reasonCode: "ok_uninstall_completed",
    remediation: remediationForReason("ok_version_supported")
  };
}
