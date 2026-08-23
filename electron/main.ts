import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { HikvisionISAPIClient, HikvisionConfig } from './hikvisionClient';

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

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';

  if (isDev) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Load local built index.html
    const indexPath = path.join(app.getAppPath(), 'dist/index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
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

// Hikvision Real Hardware IPC Handlers
ipcMain.handle('device:hikvision-test', async (event, config: HikvisionConfig) => {
  const startTime = Date.now();
  try {
    const client = new HikvisionISAPIClient(config);
    const info = await client.getDeviceInfo();
    const deviceTime = await client.getDeviceTime();
    const responseTimeMs = Date.now() - startTime;
    return {
      success: true,
      message: `CONNECTED: Successfully verified Hikvision ${info.model} at ${config.ipAddress}:${config.port}`,
      responseTimeMs,
      firmwareVersion: info.firmwareVersion,
      serialNumber: info.serialNumber,
      deviceName: info.deviceName,
      model: info.model,
      deviceTime
    };
  } catch (err: any) {
    return {
      success: false,
      message: `CONNECTION FAILED: ${err.message}`,
      responseTimeMs: Date.now() - startTime
    };
  }
});

ipcMain.handle('device:hikvision-download', async (event, config: HikvisionConfig, startDate?: string, endDate?: string) => {
  try {
    const client = new HikvisionISAPIClient(config);
    const events = await client.getAttendanceEvents(startDate, endDate);
    return {
      success: true,
      events,
      count: events.length,
      message: `Downloaded ${events.length} attendance records from Hikvision ${config.ipAddress}:${config.port}`
    };
  } catch (err: any) {
    return {
      success: false,
      events: [],
      count: 0,
      message: `Failed to download attendance logs: ${err.message}`
    };
  }
});

