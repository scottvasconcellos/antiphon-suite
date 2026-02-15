const path = require('path');
const { app, BrowserWindow } = require('electron');

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV;

function createWindow() {
  const win = new BrowserWindow({
    width: 460,
    height: 580,
    minWidth: 400,
    minHeight: 500,
    title: 'Figma Bundle Generator',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    win.loadURL('http://localhost:5173').catch(() => {
      win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
    });
  } else {
    win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
