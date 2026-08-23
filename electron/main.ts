import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: 'LankaHR - Sri Lankan HRM, Attendance & Payroll System',
    frame: true,
    autoHideMenuBar: false,
    backgroundColor: '#0a0f1d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Load local built index.html
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// System lifecycle handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Communication Handlers for native Windows OS integration
ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

ipcMain.handle('app:get-app-data-path', () => {
  const userDataDir = app.getPath('userData');
  return userDataDir;
});

ipcMain.handle('dialog:save-backup', async (event, defaultName: string) => {
  if (!mainWindow) return null;
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save LankaHR Database Backup',
    defaultPath: defaultName || `LankaHR_Backup_${new Date().toISOString().substring(0, 10)}.json`,
    filters: [
      { name: 'LankaHR Database File (*.json, *.db)', extensions: ['json', 'db'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return filePath;
});

ipcMain.handle('dialog:open-backup', async () => {
  if (!mainWindow) return null;
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select LankaHR Backup File to Restore',
    filters: [
      { name: 'LankaHR Database File (*.json, *.db)', extensions: ['json', 'db'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });
  return filePaths && filePaths.length > 0 ? filePaths[0] : null;
});

ipcMain.handle('fs:write-file', async (event, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:read-file', async (event, filePath: string) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});
