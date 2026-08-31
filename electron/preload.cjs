const { contextBridge, ipcRenderer } = require('electron');

// Secure Preload Bridge exposing safe OS desktop APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  getAppDataPath: () => ipcRenderer.invoke('app:get-app-data-path'),
  dbInit: () => ipcRenderer.invoke('db:init'),
  dbSaveAll: (state) => ipcRenderer.invoke('db:save-all', state),
  dbClear: () => ipcRenderer.invoke('db:clear'),
  dbGetPath: () => ipcRenderer.invoke('db:get-path'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  saveBackupDialog: (defaultName) => ipcRenderer.invoke('dialog:save-backup', defaultName),
  openBackupDialog: () => ipcRenderer.invoke('dialog:open-backup'),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:write-file', filePath, content),
  readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
  testHikvisionDevice: (config) => ipcRenderer.invoke('device:hikvision-test', config),
  downloadHikvisionAttendance: (config, startDate, endDate) => ipcRenderer.invoke('device:hikvision-download', config, startDate, endDate),
  searchHikvisionUsers: (config) => ipcRenderer.invoke('device:hikvision-search-users', config),
  onHikvisionProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('hikvision:download-progress', handler);
    return () => ipcRenderer.removeListener('hikvision:download-progress', handler);
  },
});

