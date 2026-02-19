const path = require("path");
const fs = require("fs");
const { app, BrowserWindow, ipcMain, Tray, Menu } = require("electron");

const isDev = process.env.NODE_ENV === "development" || process.env.ELECTRON_DEV;
const HUB_DEV_PORT = 4311;

const PREFS_PATH = path.join(app.getPath("userData"), "desktop-prefs.json");

function loadPrefs() {
  try {
    const raw = fs.readFileSync(PREFS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { closeToTray: false, launchAtLogin: false, autoInstallUpdates: false };
  }
}

function savePrefs(prefs) {
  try {
    fs.mkdirSync(path.dirname(PREFS_PATH), { recursive: true });
    fs.writeFileSync(PREFS_PATH, JSON.stringify(prefs, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save desktop prefs:", err);
  }
}

let mainWindow = null;
let tray = null;
let autoUpdaterRef = null;

function createTray(win) {
  const iconPath = path.join(app.getAppPath(), "dist", "brand", "logo-mark.png");
  const icon = path.join(__dirname, "icon-tray.png");
  const resolved = fs.existsSync(icon) ? icon : fs.existsSync(iconPath) ? iconPath : null;
  if (!resolved) return;
  tray = new Tray(resolved);
  tray.setToolTip("Antiphon Manager");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Show Antiphon Manager", click: () => win.show() },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() },
    ])
  );
  tray.on("click", () => win.show());
}

function createWindow() {
  const isMac = process.platform === "darwin";
  const prefs = loadPrefs();

  if (prefs.launchAtLogin !== undefined) {
    try {
      app.setLoginItemSettings({ openAtLogin: !!prefs.launchAtLogin });
    } catch (err) {
      console.error("setLoginItemSettings failed:", err);
    }
  }

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    title: "Antiphon Manager",
    frame: false,
    titleBarStyle: isMac ? "hiddenInset" : undefined,
    roundedCorners: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
    show: false,
  });

  const win = mainWindow;

  ipcMain.on("window-close", () => win.close());
  ipcMain.on("window-minimize", () => win.minimize());
  ipcMain.on("window-maximize", () => {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });

  ipcMain.handle("get-launch-at-login", () => {
    try {
      return app.getLoginItemSettings().openAtLogin;
    } catch {
      return false;
    }
  });
  ipcMain.handle("set-launch-at-login", (_, value) => {
    try {
      app.setLoginItemSettings({ openAtLogin: !!value });
      savePrefs({ ...loadPrefs(), launchAtLogin: !!value });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  });
  ipcMain.handle("get-close-to-tray", () => loadPrefs().closeToTray === true);
  ipcMain.handle("set-close-to-tray", (_, value) => {
    savePrefs({ ...loadPrefs(), closeToTray: !!value });
  });

  ipcMain.handle("get-auto-install-updates", () => loadPrefs().autoInstallUpdates === true);
  ipcMain.handle("set-auto-install-updates", (_, value) => {
    const prefs = { ...loadPrefs(), autoInstallUpdates: !!value };
    savePrefs(prefs);
    if (typeof mainWindow?.webContents?.send === "function" && autoUpdaterRef) {
      autoUpdaterRef.autoDownload = !!value;
      autoUpdaterRef.autoInstallOnAppQuit = !!value;
    }
  });
  ipcMain.handle("restart-to-update", () => {
    if (autoUpdaterRef) autoUpdaterRef.quitAndInstall(false, true);
  });

  win.on("close", (e) => {
    if (loadPrefs().closeToTray && tray) {
      e.preventDefault();
      win.hide();
    }
  });

  win.once("ready-to-show", () => {
    win.show();
    createTray(win);
  });

  if (isDev) {
    win.loadURL(`http://localhost:${HUB_DEV_PORT}`).catch(() => {
      win.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
    });
  } else {
    win.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  }

  // Auto-updater: only when packaged (not dev)
  if (!isDev && app.isPackaged) {
    try {
      const { autoUpdater } = require("electron-updater");
      autoUpdaterRef = autoUpdater;
      const wantAuto = loadPrefs().autoInstallUpdates === true;
      autoUpdater.autoDownload = wantAuto;
      autoUpdater.autoInstallOnAppQuit = wantAuto;
      autoUpdater.on("update-available", () => {
        if (win && !win.isDestroyed()) win.webContents.send("update-available");
      });
      autoUpdater.on("update-downloaded", () => {
        if (win && !win.isDestroyed()) win.webContents.send("update-ready");
      });
      autoUpdater.on("error", (err) => {
        if (win && !win.isDestroyed()) win.webContents.send("update-error", err.message);
      });
      autoUpdater.checkForUpdates().catch(() => {});
    } catch (err) {
      console.error("Auto-updater init failed:", err);
    }
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (tray) tray.destroy();
  app.quit();
});
