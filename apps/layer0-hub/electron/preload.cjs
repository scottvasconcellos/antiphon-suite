const { contextBridge, ipcRenderer } = require("electron");

let updateCallback = null;
ipcRenderer.on("update-available", () => {
  if (updateCallback) updateCallback("available");
});
ipcRenderer.on("update-ready", () => {
  if (updateCallback) updateCallback("ready");
});
ipcRenderer.on("update-error", (_, message) => {
  if (updateCallback) updateCallback("error", message);
});

contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,
  close: () => ipcRenderer.send("window-close"),
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  getLaunchAtLogin: () => ipcRenderer.invoke("get-launch-at-login"),
  setLaunchAtLogin: (value) => ipcRenderer.invoke("set-launch-at-login", value),
  getCloseToTray: () => ipcRenderer.invoke("get-close-to-tray"),
  setCloseToTray: (value) => ipcRenderer.invoke("set-close-to-tray", value),
  getAutoInstallUpdates: () => ipcRenderer.invoke("get-auto-install-updates"),
  setAutoInstallUpdates: (value) => ipcRenderer.invoke("set-auto-install-updates", value),
  setUpdateCallback: (cb) => { updateCallback = cb; },
  restartToUpdate: () => ipcRenderer.invoke("restart-to-update"),
});
