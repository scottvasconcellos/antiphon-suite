export function createInstallUpdateExecutor(boundary) {
    return async (action, appId) => {
        const app = boundary.getApp(appId);
        if (!app) {
            return { ok: false, reasonCode: "failed_gateway" };
        }
        const fetched = await boundary.provider.fetchPackage(action, appId);
        if (!fetched.ok) {
            return { ok: false, reasonCode: fetched.reasonCode === "failed_download_step" ? "failed_download_step" : "failed_gateway" };
        }
        const installed = await boundary.installer.applyPackage(action, app, fetched.artifact);
        if (!installed.ok) {
            return { ok: false, reasonCode: installed.reasonCode };
        }
        return { ok: true, app: installed.app };
    };
}
export function createDeterministicStubBoundary(outputs) {
    const provider = {
        async fetchPackage(action, appId) {
            return outputs[`${action}:${appId}`]?.provider ?? { ok: false, reasonCode: "failed_gateway" };
        }
    };
    const installer = {
        async applyPackage(action, app, artifact) {
            const fallback = {
                ok: false,
                reasonCode: action === "install" ? "failed_install_step" : "failed_update_step"
            };
            const entry = outputs[`${action}:${app.id}`];
            if (entry?.provider.ok && entry.provider.artifact && artifact) {
                const samePath = entry.provider.artifact.filePath === artifact.filePath;
                const sameChecksum = entry.provider.artifact.checksum === artifact.checksum;
                if (!samePath || !sameChecksum) {
                    return fallback;
                }
            }
            return entry?.installer ?? fallback;
        }
    };
    return { provider, installer };
}
