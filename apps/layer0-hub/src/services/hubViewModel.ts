import { type MusicPipelineResult } from "../domain/musicEngineContracts";
import { type EntitledApp, type HubState, type InstallTransaction } from "../domain/types";

export type HubViewModel = {
  statusLine: string;
  installedCount: number;
  ownedCount: number;
  pendingUpdates: number;
  intelligenceHeadline: string;
  intelligenceDetail: string;
  intelligenceEngineId: string;
  intelligenceEngineName: string;
  intelligenceEngineVersion: string;
  intelligenceSelectionSource: "requested" | "default" | "unavailable";
  intelligenceSelectionReason: string;
};

export function toHubViewModel(hubState: HubState, intelligence: MusicPipelineResult | null): HubViewModel {
  if (hubState.status.mode !== "ready") {
    return {
      statusLine: hubState.status.message,
      installedCount: 0,
      ownedCount: 0,
      pendingUpdates: 0,
      intelligenceHeadline: "Music Intelligence offline",
      intelligenceDetail: intelligence?.message ?? "Unavailable while runtime is in error state.",
      intelligenceEngineId: intelligence?.engineId ?? "none",
      intelligenceEngineName: intelligence?.engineName ?? "none",
      intelligenceEngineVersion: intelligence?.engineVersion ?? "0.0.0",
      intelligenceSelectionSource: intelligence?.selectionSource ?? "unavailable",
      intelligenceSelectionReason: intelligence?.selectionReason ?? "No selection."
    };
  }

  const snapshot = hubState.snapshot;
  return {
    statusLine: snapshot.session
      ? "Signed in: ownership state synced and ready for install authority actions."
      : "Signed out: offline cache remains available for existing installs.",
    installedCount: snapshot.entitlements.filter((app) => app.installedVersion).length,
    ownedCount: snapshot.entitlements.filter((app) => app.owned).length,
    pendingUpdates: snapshot.entitlements.filter((app) => app.updateAvailable).length,
    intelligenceHeadline: intelligence?.projection?.headline ?? "Music Intelligence unavailable",
    intelligenceDetail: intelligence?.projection?.detail ?? intelligence?.message ?? "No recommendation available.",
    intelligenceEngineId: intelligence?.engineId ?? "none",
    intelligenceEngineName: intelligence?.engineName ?? "none",
    intelligenceEngineVersion: intelligence?.engineVersion ?? "0.0.0",
    intelligenceSelectionSource: intelligence?.selectionSource ?? "unavailable",
    intelligenceSelectionReason: intelligence?.selectionReason ?? "No selection."
  };
}

export function toInstallActionLabel(app: EntitledApp): string {
  if (app.installState === "installing") {
    return "Installing...";
  }
  if (app.installedVersion) {
    return app.updateAvailable ? "Apply update" : "Reinstall";
  }
  return "Install";
}

export function toTransactionLabel(tx: InstallTransaction): string {
  return `${tx.action.toUpperCase()} ${tx.status.toUpperCase()}`;
}

export function toDisplayDate(value: string | null): string {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleString();
}

export function toEngineSummaryLine(vm: HubViewModel): string {
  return `Engine ${vm.intelligenceEngineId} [${vm.intelligenceEngineName} v${vm.intelligenceEngineVersion}] (${vm.intelligenceSelectionSource})`;
}
