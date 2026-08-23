const { contextBridge, ipcRenderer } = require('electron');

// Secure Preload Bridge exposing safe OS desktop APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  getAppDataPath: () => ipcRenderer.invoke('app:get-app-data-path'),
  saveBackupDialog: (defaultName) => ipcRenderer.invoke('dialog:save-backup', defaultName),
  openBackupDialog: () => ipcRenderer.invoke('dialog:open-backup'),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:write-file', filePath, content),
  readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
  testHikvisionDevice: (config) => ipcRenderer.invoke('device:hikvision-test', config),
  downloadHikvisionAttendance: (config, startDate, endDate) => ipcRenderer.invoke('device:hikvision-download', config, startDate, endDate),
});
