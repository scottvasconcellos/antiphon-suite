export function toHubViewModel(hubState) {
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
