import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { HikvisionISAPIClient, HikvisionConfig } from './hikvisionClient';
import { SqliteDatabaseManager } from './sqliteDb';

// Disable hardware acceleration to eliminate Windows GPU command buffer proxy crashes
// [ERROR:gpu\ipc\client\command_buffer_proxy_impl.cc] GPU state invalid
try {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
} catch (gpuErr) {
  console.warn('[Electron] Could not disable hardware acceleration:', gpuErr);
}

console.log(`[Electron] Starting LankaHR Desktop Main Process (Electron v${process.versions.electron}, Node v${process.versions.node}, Platform: ${process.platform})`);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let sqliteDb: SqliteDatabaseManager | null = null;

// Ensure single instance lock on Windows
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Electron] Another instance of LankaHR is already running. Exiting secondary instance.');
  app.quit();
} else {
  app.on('second-instance', () => {
    console.log('[Electron] Second instance launch detected. Focusing existing main window.');
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function getPreloadPath(): string {
  const possiblePaths = [
    path.join(__dirname, 'preload.cjs'),
    path.join(__dirname, '../dist-electron/preload.cjs'),
    path.join(app.getAppPath(), 'dist-electron/preload.cjs'),
    path.join(app.getAppPath(), 'electron/preload.cjs')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return path.join(__dirname, 'preload.cjs');
}

function getProductionIndexPath(): string {
  const candidatePaths = [
    path.join(app.getAppPath(), 'dist', 'index.html'),
    path.join(__dirname, '..', 'dist', 'index.html'),
    path.join(__dirname, '..', '..', 'dist', 'index.html'),
    path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
    path.join(process.resourcesPath, 'dist', 'index.html')
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return path.join(app.getAppPath(), 'dist', 'index.html');
}

function createWindow() {
  console.log('[Electron] Creating BrowserWindow...');

  const preloadPath = getPreloadPath();
  console.log(`[Electron] Preload script path: ${preloadPath} (exists: ${fs.existsSync(preloadPath)})`);

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: 'LankaHR - Sri Lankan HRM, Attendance & Payroll System',
    frame: true,
    show: false, // Show gracefully when ready
    autoHideMenuBar: false,
    backgroundColor: '#0a0f1d',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false // Recommended when using contextBridge with CommonJS preload
    }
  });

  console.log('[Electron] BrowserWindow created successfully. ID:', mainWindow.id);

  // Show window when DOM / renderer is ready
  mainWindow.once('ready-to-show', () => {
    console.log('[Electron] Window ready-to-show event fired. Displaying window.');
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Safety fallback: if ready-to-show takes too long, ensure window is displayed
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('[Electron] Fallback: Forcing window visibility.');
      mainWindow.show();
      mainWindow.focus();
    }
  }, 2500);

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';

  if (isDev) {
    console.log(`[Electron] Development mode active. Loading URL: ${devServerUrl}`);
    mainWindow.loadURL(devServerUrl).catch(err => {
      console.error(`[Electron] Failed to load dev URL (${devServerUrl}):`, err.message);
    });
  } else {
    const prodIndexPath = getProductionIndexPath();
    console.log(`[Electron] Production mode active. Loading file: ${prodIndexPath}`);
    mainWindow.loadFile(prodIndexPath).catch(err => {
      console.error(`[Electron] Failed to load production index.html:`, err.message);
    });
  }

  // WebContents event logging & resilience handlers
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron WebContents] Renderer process finished loading successfully.');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron WebContents] Failed to load URL: ${validatedURL}`);
    console.error(`[Electron WebContents] Error Code: ${errorCode}, Description: ${errorDescription}`);

    if (isDev && errorCode !== -3) { // -3 is ABORTED
      console.log('[Electron WebContents] Retrying dev server connection in 1.5s...');
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(devServerUrl).catch(() => {});
        }
      }, 1500);
    }
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error(`[Electron WebContents] Renderer process gone! Reason: ${details.reason}, Exit Code: ${details.exitCode}`);
  });

  mainWindow.webContents.on('unresponsive', () => {
    console.warn('[Electron WebContents] Renderer process became unresponsive.');
  });

  mainWindow.webContents.on('responsive', () => {
    console.log('[Electron WebContents] Renderer process became responsive again.');
  });

  mainWindow.on('closed', () => {
    console.log('[Electron] BrowserWindow closed event fired.');
    mainWindow = null;
  });
}

// System lifecycle handlers
app.whenReady().then(() => {
  console.log('[Electron] app.whenReady() resolved successfully.');
  createWindow();

  app.on('activate', () => {
    console.log('[Electron] app.activate event fired.');
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch(err => {
  console.error('[Electron] Error during app.whenReady():', err);
});

app.on('window-all-closed', () => {
  console.log('[Electron] app.window-all-closed event fired.');
  if (process.platform !== 'darwin') {
    console.log('[Electron] Quitting application (platform != darwin)...');
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('[Electron] app.before-quit event fired.');
});

app.on('will-quit', () => {
  console.log('[Electron] app.will-quit event fired.');
});

// Process-level safety logging
process.on('uncaughtException', (err) => {
  console.error('[Electron] Uncaught Exception occurred in main process:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Electron] Unhandled Rejection occurred in main process:', reason);
});

// Native IPC Communication Handlers
ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

ipcMain.handle('app:get-app-data-path', () => {
  return app.getPath('userData');
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

// SQLite IPC Handlers
ipcMain.handle('db:init', async () => {
  try {
    if (!sqliteDb) {
      sqliteDb = new SqliteDatabaseManager();
    }
    await sqliteDb.init();
    const state = sqliteDb.getFullState();
    return { success: true, state };
  } catch (err: any) {
    console.error('[Electron IPC db:init] Error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db:save-all', async (event, state: any) => {
  try {
    if (!sqliteDb) {
      sqliteDb = new SqliteDatabaseManager();
      await sqliteDb.init();
    }
    const res = sqliteDb.saveFullState(state);
    return res;
  } catch (err: any) {
    console.error('[Electron IPC db:save-all] Error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db:clear', async () => {
  try {
    if (!sqliteDb) {
      sqliteDb = new SqliteDatabaseManager();
      await sqliteDb.init();
    }
    return sqliteDb.clearDatabase();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db:get-path', () => {
  return sqliteDb ? sqliteDb.getDbPath() : path.join(app.getPath('userData'), 'lankahr.sqlite');
});

// Window Control Handlers
ipcMain.handle('window:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow.maximize();
      return true;
    }
  }
  return false;
});

ipcMain.handle('window:is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('window:close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Hikvision Real Hardware IPC Handlers (Credential Safe)
ipcMain.handle('device:hikvision-test', async (event, config: HikvisionConfig) => {
  const startTime = Date.now();
  try {
    console.log(`[Electron Hikvision] Testing device at IP: ${config.ipAddress}:${config.port}`);
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
    console.error(`[Electron Hikvision] Connection test failed: ${err.message}`);
    return {
      success: false,
      message: `CONNECTION FAILED: ${err.message}`,
      responseTimeMs: Date.now() - startTime
    };
  }
});

ipcMain.handle('device:hikvision-download', async (event, config: HikvisionConfig, startDate?: string, endDate?: string) => {
  try {
    console.log(`[Electron Hikvision] Downloading attendance from IP: ${config.ipAddress}:${config.port} (Range: ${startDate || 'ALL'} to ${endDate || 'ALL'})`);
    const client = new HikvisionISAPIClient(config);
    const events = await client.getAttendanceEvents(startDate, endDate, (progress) => {
      event.sender.send('hikvision:download-progress', progress);
    });
    return {
      success: true,
      events,
      count: events.length,
      message: `Downloaded ${events.length} attendance records from Hikvision ${config.ipAddress}:${config.port}`
    };
  } catch (err: any) {
    console.error(`[Electron Hikvision] Download logs failed: ${err.message}`);
    return {
      success: false,
      events: [],
      count: 0,
      message: `Failed to download attendance logs: ${err.message}`
    };
  }
});

ipcMain.handle('device:hikvision-search-users', async (event, config: HikvisionConfig) => {
  try {
    console.log(`[Electron Hikvision] Searching users on IP: ${config.ipAddress}:${config.port}`);
    const client = new HikvisionISAPIClient(config);
    const users = await client.getUserRecords();
    return {
      success: true,
      users,
      count: users.length,
      message: `Retrieved ${users.length} registered user records from Hikvision terminal at ${config.ipAddress}:${config.port}`
    };
  } catch (err: any) {
    console.error(`[Electron Hikvision] Search users failed: ${err.message}`);
    const isUnsupported = err.message?.includes('not supported') || err.message?.includes('404');
    return {
      success: false,
      users: [],
      count: 0,
      isUnsupported,
      message: isUnsupported
        ? 'Hikvision user synchronization is not supported by this device/API.'
        : `Failed to retrieve Hikvision users: ${err.message}`
    };
  }
});

export { SqliteDatabaseManager };
