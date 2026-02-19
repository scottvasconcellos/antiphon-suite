/**
 * Electron preload API exposed when the Hub runs inside the desktop shell.
 */
interface ElectronAPI {
  platform: "darwin" | "win32" | "linux";
  close: () => void;
  minimize: () => void;
  maximize: () => void;
  getLaunchAtLogin: () => Promise<boolean>;
  setLaunchAtLogin: (value: boolean) => Promise<boolean>;
  getCloseToTray: () => Promise<boolean>;
  setCloseToTray: (value: boolean) => Promise<void>;
  getAutoInstallUpdates: () => Promise<boolean>;
  setAutoInstallUpdates: (value: boolean) => Promise<void>;
  setUpdateCallback: (cb: (status: "available" | "ready" | "error", errorMessage?: string) => void) => void;
  restartToUpdate: () => Promise<void>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
