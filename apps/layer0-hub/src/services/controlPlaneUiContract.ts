import { type HubViewModel } from "./hubViewModel";
import { type ControlPlaneViewModel } from "./controlPlaneViewModel";
import { type ControlPlaneOperationEntry } from "./controlPlaneOperationsViewModel";

export type ControlPlaneUiContract = {
  statusLine: string;
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
  return {
    statusLine: hubVm.statusLine,
    entitlementLine: `Entitlement: ${controlPlaneVm.entitlement.outcome} (${controlPlaneVm.entitlement.reason})`,
    installUpdateLine: `Install/Update: ${controlPlaneVm.installUpdate.state} (${controlPlaneVm.installUpdate.reasonCode})`,
    launchTokenLine: `Launch token: ${controlPlaneVm.launchToken.status} (${controlPlaneVm.launchToken.reason})`,
    cacheLine: `Cache schema: ${controlPlaneVm.persistedCache.schema}@v${controlPlaneVm.persistedCache.version} restorable=${String(controlPlaneVm.persistedCache.restorable)}`,
    launchReadinessLine:
      controlPlaneVm.launchReadiness.length === 0
        ? "Launch readiness: none"
        : `Launch readiness: ${controlPlaneVm.launchReadiness.map((entry) => `${entry.appId}:${entry.reason}`).join(", ")}`,
    recentOpsLine:
      opsVm.length === 0
        ? "Recent ops: none"
        : `Recent ops: ${opsVm.map((op) => `${op.id}:${op.status}`).join(", ")}`
  };
}
