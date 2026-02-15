import { type HubState } from "../domain/types";

export type HubViewModel = {
  statusLine: string;
  installedCount: number;
  ownedCount: number;
  pendingUpdates: number;
};

export function toHubViewModel(hubState: HubState): HubViewModel {
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
