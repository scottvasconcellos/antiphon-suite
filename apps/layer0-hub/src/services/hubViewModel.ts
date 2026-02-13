import { type EntitledApp, type HubState, type InstallTransaction } from "../domain/types";

export type HubViewModel = {
  statusLine: string;
  installedCount: number;
  ownedCount: number;
  pendingUpdates: number;
};

export function toHubViewModel(hubState: HubState): HubViewModel {
  if (hubState.status.mode !== "ready") {
    return {
      statusLine: hubState.status.message,
      installedCount: 0,
      ownedCount: 0,
      pendingUpdates: 0
    };
  }

  const snapshot = hubState.snapshot;
  return {
    statusLine: snapshot.session
      ? "Signed in: ownership state synced and ready for install authority actions."
      : "Signed out: offline cache remains available for existing installs.",
    installedCount: snapshot.entitlements.filter((app) => app.installedVersion).length,
    ownedCount: snapshot.entitlements.filter((app) => app.owned).length,
    pendingUpdates: snapshot.entitlements.filter((app) => app.updateAvailable).length
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
