import { type EntitledApp } from "../domain/types";
import { type InstallUpdateAction, type InstallUpdateStepResult } from "./installUpdateAuthority";

export type DownloadProviderResultCode =
  | "ok_download_ready"
  | "failed_download_step"
  | "failed_gateway";

export type InstallerResultCode =
  | "ok_install_apply"
  | "ok_update_apply"
  | "failed_install_step"
  | "failed_update_step";

export type DownloadProviderResult = {
  ok: boolean;
  reasonCode: DownloadProviderResultCode;
};

export type InstallerResult =
  | { ok: true; reasonCode: "ok_install_apply" | "ok_update_apply"; app: EntitledApp }
  | { ok: false; reasonCode: "failed_install_step" | "failed_update_step" };

export type DownloadProvider = {
  fetchPackage(action: InstallUpdateAction, appId: string): Promise<DownloadProviderResult>;
};

export type Installer = {
  applyPackage(action: InstallUpdateAction, app: EntitledApp): Promise<InstallerResult>;
};

export function createInstallUpdateExecutor(boundary: {
  provider: DownloadProvider;
  installer: Installer;
  getApp: (appId: string) => EntitledApp | null;
}) {
  return async (action: InstallUpdateAction, appId: string): Promise<InstallUpdateStepResult> => {
    const app = boundary.getApp(appId);
    if (!app) {
      return { ok: false, reasonCode: "failed_gateway" };
    }

    const fetched = await boundary.provider.fetchPackage(action, appId);
    if (!fetched.ok) {
      return { ok: false, reasonCode: fetched.reasonCode === "failed_download_step" ? "failed_download_step" : "failed_gateway" };
    }

    const installed = await boundary.installer.applyPackage(action, app);
    if (!installed.ok) {
      return { ok: false, reasonCode: installed.reasonCode };
    }
    return { ok: true, app: installed.app };
  };
}

export function createDeterministicStubBoundary(outputs: Record<string, { provider: DownloadProviderResult; installer?: InstallerResult }>) {
  const provider: DownloadProvider = {
    async fetchPackage(action, appId) {
      return outputs[`${action}:${appId}`]?.provider ?? { ok: false, reasonCode: "failed_gateway" };
    }
  };
  const installer: Installer = {
    async applyPackage(action, app) {
      const fallback: InstallerResult = {
        ok: false,
        reasonCode: action === "install" ? "failed_install_step" : "failed_update_step"
      };
      return outputs[`${action}:${app.id}`]?.installer ?? fallback;
    }
  };
  return { provider, installer };
}
