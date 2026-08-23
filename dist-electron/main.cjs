var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var isDev = process.env.NODE_ENV === "development" || !import_electron.app.isPackaged;
var mainWindow = null;
function createWindow() {
  mainWindow = new import_electron.BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: "LankaHR - Sri Lankan HRM, Attendance & Payroll System",
    frame: true,
    autoHideMenuBar: false,
    backgroundColor: "#0a0f1d",
    webPreferences: {
      preload: import_path.default.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    const indexPath = import_path.default.join(__dirname, "../dist/index.html");
    mainWindow.loadFile(indexPath);
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
import_electron.app.whenReady().then(() => {
  createWindow();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
import_electron.ipcMain.handle("app:get-version", () => {
  return import_electron.app.getVersion();
});
import_electron.ipcMain.handle("app:get-app-data-path", () => {
  const userDataDir = import_electron.app.getPath("userData");
  return userDataDir;
});
import_electron.ipcMain.handle("dialog:save-backup", async (event, defaultName) => {
  if (!mainWindow) return null;
  const { filePath } = await import_electron.dialog.showSaveDialog(mainWindow, {
    title: "Save LankaHR Database Backup",
    defaultPath: defaultName || `LankaHR_Backup_${(/* @__PURE__ */ new Date()).toISOString().substring(0, 10)}.json`,
    filters: [
      { name: "LankaHR Database File (*.json, *.db)", extensions: ["json", "db"] },
      { name: "All Files", extensions: ["*"] }
    ]
  });
  return filePath;
});
import_electron.ipcMain.handle("dialog:open-backup", async () => {
  if (!mainWindow) return null;
  const { filePaths } = await import_electron.dialog.showOpenDialog(mainWindow, {
    title: "Select LankaHR Backup File to Restore",
    filters: [
      { name: "LankaHR Database File (*.json, *.db)", extensions: ["json", "db"] },
      { name: "All Files", extensions: ["*"] }
    ],
    properties: ["openFile"]
  });
  return filePaths && filePaths.length > 0 ? filePaths[0] : null;
});
import_electron.ipcMain.handle("fs:write-file", async (event, filePath, content) => {
  try {
    import_fs.default.writeFileSync(filePath, content, "utf-8");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
import_electron.ipcMain.handle("fs:read-file", async (event, filePath) => {
  try {
    const data = import_fs.default.readFileSync(filePath, "utf-8");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
