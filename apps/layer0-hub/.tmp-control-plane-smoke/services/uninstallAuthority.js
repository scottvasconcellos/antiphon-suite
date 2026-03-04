import { remediationForReason } from "./controlPlaneReasonTaxonomy";
export const UNINSTALL_REASON_CODES = [
    "ok_uninstall_completed",
    "blocked_app_not_found",
    "blocked_not_installed",
    "blocked_uninstall_busy"
];
export function runUninstall(snapshot, appId) {
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
        const reasonCode = "blocked_uninstall_busy";
        return {
            snapshot,
            appId,
            ok: false,
            reasonCode,
            remediation: remediationForReason(reasonCode)
        };
    }
    const reasonCode = "ok_uninstall_completed";
    return {
        snapshot: {
            ...snapshot,
            entitlements: snapshot.entitlements
                .map((entry) => entry.id === appId
                ? {
                    ...entry,
                    installedVersion: null,
                    installState: "not-installed",
                    updateAvailable: false
                }
                : entry)
                .sort((a, b) => a.id.localeCompare(b.id))
        },
        appId,
        ok: true,
        reasonCode,
        remediation: remediationForReason(reasonCode)
    };
}
