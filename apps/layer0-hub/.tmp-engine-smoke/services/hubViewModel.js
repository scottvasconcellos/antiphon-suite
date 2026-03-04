import { ENGINE_CAPABILITY_MATRIX_SNAPSHOT_REF, getMusicEngineManifest } from "../domain/musicEngineRegistry.js";
export function toCapabilityMatrixViewModel() {
    return getMusicEngineManifest().map((entry) => {
        const [domainScope, determinismLevel, priorityToken, latencyTier] = entry.capabilitySummary.split("|");
        const fallbackPriority = Number(priorityToken.replace(/^p/, ""));
        return {
            engineId: entry.id,
            domainScope,
            determinismLevel,
            fallbackPriority,
            latencyTier
        };
    });
}
export function toHubViewModel(hubState, intelligence) {
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
            intelligenceSelectionReason: intelligence?.selectionReason ?? "No selection.",
            selectedCapabilitySummary: intelligence?.selectedCapabilitySummary ?? "none",
            capabilityMatrixSnapshotRef: intelligence?.matrixSnapshotRef ?? ENGINE_CAPABILITY_MATRIX_SNAPSHOT_REF,
            capabilityMatrix: toCapabilityMatrixViewModel()
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
        intelligenceSelectionReason: intelligence?.selectionReason ?? "No selection.",
        selectedCapabilitySummary: intelligence?.selectedCapabilitySummary ?? "none",
        capabilityMatrixSnapshotRef: intelligence?.matrixSnapshotRef ?? ENGINE_CAPABILITY_MATRIX_SNAPSHOT_REF,
        capabilityMatrix: toCapabilityMatrixViewModel()
    };
}
export function toInstallActionLabel(app) {
    if (app.installState === "installing") {
        return "Installing...";
    }
    if (app.installedVersion) {
        return app.updateAvailable ? "Apply update" : "Reinstall";
    }
    return "Install";
}
export function toTransactionLabel(tx) {
    return `${tx.action.toUpperCase()} ${tx.status.toUpperCase()}`;
}
export function toDisplayDate(value) {
    if (!value) {
        return "Never";
    }
    return new Date(value).toLocaleString();
}
export function toEngineSummaryLine(vm) {
    return `Engine ${vm.intelligenceEngineId} [${vm.intelligenceEngineName} v${vm.intelligenceEngineVersion}] (${vm.intelligenceSelectionSource})`;
}
