import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script — runs in a privileged context before the renderer page loads.
 * Use contextBridge to safely expose Node/Electron APIs to the renderer.
 * Never expose full ipcRenderer — only whitelisted methods.
 */
contextBridge.exposeInMainWorld('antiphon', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  // Example: expose a typed IPC send
  // send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
});
