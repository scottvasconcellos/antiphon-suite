import { type HubViewModel } from "./hubViewModel";
import { type ControlPlaneViewModel } from "./controlPlaneViewModel";
import { type ControlPlaneOperationEntry } from "./controlPlaneOperationsViewModel";

export type ControlPlaneUiContract = {
  statusLine: string;
  identityLine: string;
  entitlementLine: string;
  installUpdateLine: string;
  launchTokenLine: string;
  cacheLine: string;
  launchReadinessLine: string;
  recentOpsLine: string;
};

export function toControlPlaneUiContract(
  hubVm: HubViewModel,
  controlPlaneVm: ControlPlaneViewModel,
  opsVm: ControlPlaneOperationEntry[]
): ControlPlaneUiContract {
  const entitlementLabel =
    controlPlaneVm.entitlement.outcome === "Authorized"
      ? "Allowed"
      : controlPlaneVm.entitlement.outcome === "OfflineAuthorized"
        ? "OfflineAllowed"
        : "Denied";
  const installLabel =
    controlPlaneVm.installUpdate.reasonCode.startsWith("ok_")
      ? "Installed"
      : controlPlaneVm.installUpdate.reasonCode.includes("update")
        ? "Updating"
        : "Failed";
  const launchLabel = (ready: boolean) => (ready ? "Runnable" : "NotRunnable");
  const appEntries = [...controlPlaneVm.launchReadiness].sort((a, b) => a.appId.localeCompare(b.appId));

  return {
    statusLine: hubVm.statusLine,
    identityLine: hubVm.statusLine.startsWith("Signed in") ? "Identity: Present" : "Identity: Absent",
    entitlementLine:
      appEntries.length === 0
        ? `Entitlement: ${entitlementLabel} (${controlPlaneVm.entitlement.reason})`
        : `Entitlement: ${appEntries.map((entry) => `${entry.appId}=${entitlementLabel}:${controlPlaneVm.entitlement.reason}`).join(", ")}`,
    launchTokenLine: `Launch token: ${controlPlaneVm.launchToken.status} (${controlPlaneVm.launchToken.reason})`,
    cacheLine: `Cache schema: ${controlPlaneVm.persistedCache.schema}@v${controlPlaneVm.persistedCache.version} restorable=${String(controlPlaneVm.persistedCache.restorable)}`,
    launchReadinessLine:
      appEntries.length === 0
        ? "Launch readiness: none"
        : `Launch readiness: ${appEntries.map((entry) => `${entry.appId}=${launchLabel(entry.ready)}:${entry.reason}`).join(", ")}`,
    installUpdateLine:
      appEntries.length === 0
        ? `Install/Update: ${installLabel} (${controlPlaneVm.installUpdate.reasonCode})`
        : `Install/Update: ${appEntries.map((entry) => `${entry.appId}=${installLabel}:${controlPlaneVm.installUpdate.reasonCode}`).join(", ")}`,
    recentOpsLine:
      opsVm.length === 0
        ? "Recent ops: none"
        : `Recent ops: ${opsVm.map((op) => `${op.id}:${op.status}`).join(", ")}`
  };
}
