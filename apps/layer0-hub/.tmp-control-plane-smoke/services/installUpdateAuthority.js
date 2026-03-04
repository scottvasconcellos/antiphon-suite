import { transitionLifecycleState } from "../domain/installUpdateStateMachine";
import { createInstallUpdateExecutor } from "./downloadInstallerBoundary";
import { applyArtifactManifest } from "./artifactInstallerExecution";
import { parseArtifactManifest } from "./artifactManifestContract";
export const INSTALL_UPDATE_REASON_CODES = [
    "ok_install_completed",
    "ok_update_completed",
    "blocked_app_not_found",
    "blocked_not_owned",
    "blocked_not_installed",
    "blocked_no_update_available",
    "blocked_invalid_transition",
    "failed_download_step",
    "failed_install_step",
    "failed_update_step",
    "failed_install_non_zero",
    "failed_update_non_zero",
    "failed_install_timeout",
    "failed_update_timeout",
    "failed_gateway",
    "artifact_app_version_mismatch",
    "artifact_missing_file",
    "artifact_digest_mismatch",
    "artifact_partial_apply",
    "artifact_rollback_failed",
    "invalid_artifact_manifest_json",
    "invalid_artifact_manifest_shape",
    "unsupported_artifact_manifest_version"
];
function toLifecycleState(app) {
    if (!app.installedVersion) {
        return app.installState === "installing" ? "Installing" : "NotInstalled";
    }
    if (app.updateAvailable) {
        return "UpdateAvailable";
    }
    return "Ready";
}
function sortEntitlements(entitlements) {
    return [...entitlements].sort((a, b) => a.id.localeCompare(b.id));
}
function mergeApp(snapshot, app) {
    const existingIndex = snapshot.entitlements.findIndex((candidate) => candidate.id === app.id);
    const nextEntitlements = existingIndex === -1
        ? sortEntitlements([...snapshot.entitlements, app])
        : sortEntitlements(snapshot.entitlements.map((candidate) => (candidate.id === app.id ? app : candidate)));
    return {
        ...snapshot,
        entitlements: nextEntitlements
    };
}
export async function runInstallUpdateAuthority(snapshot, action, appId, runStep) {
    const app = snapshot.entitlements.find((candidate) => candidate.id === appId);
    if (!app) {
        return {
            snapshot,
            result: { ok: false, reasonCode: "blocked_app_not_found", appId, lifecycle: { from: "NotInstalled", to: "NotInstalled" } }
        };
    }
    if (!app.owned) {
        const state = toLifecycleState(app);
        return {
            snapshot,
            result: { ok: false, reasonCode: "blocked_not_owned", appId, lifecycle: { from: state, to: state } }
        };
    }
    if (action === "update" && !app.installedVersion) {
        const state = toLifecycleState(app);
        return {
            snapshot,
            result: { ok: false, reasonCode: "blocked_not_installed", appId, lifecycle: { from: state, to: state } }
        };
    }
    if (action === "update" && !app.updateAvailable) {
        const state = toLifecycleState(app);
        return {
            snapshot,
            result: { ok: false, reasonCode: "blocked_no_update_available", appId, lifecycle: { from: state, to: state } }
        };
    }
    const from = toLifecycleState(app);
    const beginTransition = transitionLifecycleState(from, action === "install" ? "BeginInstall" : "BeginUpdate");
    if (beginTransition.reason === "no_op_invalid_transition") {
        return {
            snapshot,
            result: { ok: false, reasonCode: "blocked_invalid_transition", appId, lifecycle: { from, to: from } }
        };
    }
    const stepResult = await runStep(action, appId);
    if (!stepResult.ok) {
        const failureTransition = transitionLifecycleState(beginTransition.to, action === "install" ? "InstallFailed" : "UpdateFailed");
        return {
            snapshot,
            result: {
                ok: false,
                reasonCode: stepResult.reasonCode,
                appId,
                lifecycle: { from, to: failureTransition.to },
                ...(stepResult.artifactRollback ? { artifactRollback: stepResult.artifactRollback } : {})
            }
        };
    }
    const completeTransition = transitionLifecycleState(beginTransition.to, action === "install" ? "InstallSucceeded" : "UpdateSucceeded");
    return {
        snapshot: mergeApp(snapshot, stepResult.app),
        result: {
            ok: true,
            reasonCode: action === "install" ? "ok_install_completed" : "ok_update_completed",
            appId,
            lifecycle: { from, to: completeTransition.to }
        }
    };
}
export async function runInstallUpdateAuthorityWithBoundary(snapshot, action, appId, boundary) {
    return runInstallUpdateAuthority(snapshot, action, appId, createInstallUpdateExecutor({
        provider: boundary.provider,
        installer: boundary.installer,
        getApp: (id) => snapshot.entitlements.find((entry) => entry.id === id) ?? null
    }));
}
export async function runInstallUpdateAuthorityWithArtifactExecutor(snapshot, action, appId, input) {
    const app = snapshot.entitlements.find((candidate) => candidate.id === appId);
    if (!app) {
        const result = await runInstallUpdateAuthority(snapshot, action, appId, async () => ({ ok: false, reasonCode: "failed_gateway" }));
        return {
            ...result,
            fileSystem: input.fileSystem
        };
    }
    let fileSystemAfter = input.fileSystem;
    const manifestVersionHint = parseArtifactManifest(input.manifestRaw).manifest?.appVersion ?? null;
    const result = await runInstallUpdateAuthority(snapshot, action, appId, async () => {
        const applied = applyArtifactManifest({
            appId,
            manifestRaw: input.manifestRaw,
            payloadFiles: input.payloadFiles,
            targetDir: input.targetDir,
            fileSystem: fileSystemAfter,
            inject: input.inject
        });
        fileSystemAfter = applied.fileSystem;
        if (!applied.ok) {
            return {
                ok: false,
                reasonCode: applied.reasonCode,
                artifactRollback: applied.rollback
            };
        }
        return {
            ok: true,
            app: {
                ...app,
                installedVersion: manifestVersionHint ?? app.version,
                installState: "installed",
                updateAvailable: action === "install"
            }
        };
    });
    return {
        ...result,
        fileSystem: fileSystemAfter
    };
}
