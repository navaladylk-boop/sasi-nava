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

// electron/hikvisionClient.ts
var import_http = __toESM(require("http"), 1);
var import_https = __toESM(require("https"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var HikvisionISAPIClient = class {
  constructor(config) {
    this.config = {
      ...config,
      port: config.port || 80,
      timeoutMs: config.timeoutMs || 5e3,
      useHttps: config.useHttps || false
    };
  }
  parseDigestAuthHeader(authHeader) {
    const params = {};
    const matches = authHeader.replace(/^Digest\s+/, "").match(/(\w+)="?([^",]+)"?/g);
    if (matches) {
      matches.forEach((m) => {
        const eqIdx = m.indexOf("=");
        if (eqIdx !== -1) {
          const key = m.substring(0, eqIdx).trim();
          let val = m.substring(eqIdx + 1).trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1);
          }
          params[key] = val;
        }
      });
    }
    return params;
  }
  generateDigestHeader(method, uri, realm, nonce, qop, opaque) {
    const username = this.config.username || "admin";
    const password = this.config.password || "";
    const ha1 = import_crypto.default.createHash("md5").update(`${username}:${realm}:${password}`).digest("hex");
    const ha2 = import_crypto.default.createHash("md5").update(`${method}:${uri}`).digest("hex");
    let response;
    let header = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}"`;
    if (qop) {
      const nc = "00000001";
      const cnonce = import_crypto.default.randomBytes(8).toString("hex");
      response = import_crypto.default.createHash("md5").update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest("hex");
      header += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}", response="${response}"`;
    } else {
      response = import_crypto.default.createHash("md5").update(`${ha1}:${nonce}:${ha2}`).digest("hex");
      header += `, response="${response}"`;
    }
    if (opaque) {
      header += `, opaque="${opaque}"`;
    }
    return header;
  }
  request(method, uri, body, authHeader) {
    return new Promise((resolve, reject) => {
      const client = this.config.useHttps ? import_https.default : import_http.default;
      const headers = {
        "Accept": "application/json, text/xml, */*",
        "User-Agent": "LankaHR-Desktop/1.0"
      };
      if (body) {
        if (body.trim().startsWith("{") || body.trim().startsWith("[")) {
          headers["Content-Type"] = "application/json";
        } else {
          headers["Content-Type"] = "application/xml";
        }
        headers["Content-Length"] = Buffer.byteLength(body).toString();
      }
      if (authHeader) {
        headers["Authorization"] = authHeader;
      }
      const req = client.request(
        {
          hostname: this.config.ipAddress,
          port: this.config.port,
          path: uri,
          method,
          headers,
          timeout: this.config.timeoutMs
        },
        (res) => {
          let responseData = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            responseData += chunk;
          });
          res.on("end", () => {
            resolve({
              statusCode: res.statusCode || 0,
              headers: res.headers,
              data: responseData
            });
          });
        }
      );
      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`Connection timeout (${this.config.timeoutMs}ms) to ${this.config.ipAddress}:${this.config.port}`));
      });
      req.on("error", (err) => {
        let msg = err.message;
        if (err.message.includes("ECONNREFUSED")) {
          msg = `Connection refused by ${this.config.ipAddress}:${this.config.port}. Ensure the device is powered on and port ${this.config.port} is open.`;
        } else if (err.message.includes("EHOSTUNREACH")) {
          msg = `Host unreachable (${this.config.ipAddress}). Check local network subnet and Ethernet/Wi-Fi connection.`;
        } else if (err.message.includes("ETIMEDOUT")) {
          msg = `Connection timed out to ${this.config.ipAddress}:${this.config.port}. Check IP address or Windows Firewall.`;
        }
        reject(new Error(msg));
      });
      if (body) {
        req.write(body);
      }
      req.end();
    });
  }
  async executeWithAuth(method, uri, body) {
    const firstRes = await this.request(method, uri, body);
    if (firstRes.statusCode === 200 || firstRes.statusCode === 201) {
      return { statusCode: firstRes.statusCode, data: firstRes.data };
    }
    if (firstRes.statusCode === 401) {
      const wwwAuth = firstRes.headers["www-authenticate"] || firstRes.headers["WWW-Authenticate"];
      if (!wwwAuth) {
        throw new Error("Authentication failed (401 Unauthorized). Device did not supply authentication realm.");
      }
      const authHeaderStr = Array.isArray(wwwAuth) ? wwwAuth[0] : wwwAuth;
      if (authHeaderStr.toLowerCase().startsWith("digest")) {
        const digestParams = this.parseDigestAuthHeader(authHeaderStr);
        const authHeader = this.generateDigestHeader(
          method,
          uri,
          digestParams.realm || "IP Camera",
          digestParams.nonce || "",
          digestParams.qop,
          digestParams.opaque
        );
        const secondRes = await this.request(method, uri, body, authHeader);
        if (secondRes.statusCode === 200 || secondRes.statusCode === 201) {
          return { statusCode: secondRes.statusCode, data: secondRes.data };
        } else if (secondRes.statusCode === 401) {
          throw new Error("Authentication failed (401 Unauthorized). Incorrect device username or password.");
        } else {
          throw new Error(`Device responded with HTTP status ${secondRes.statusCode}: ${secondRes.data.substring(0, 150)}`);
        }
      } else if (authHeaderStr.toLowerCase().startsWith("basic")) {
        const basicCreds = Buffer.from(`${this.config.username || "admin"}:${this.config.password || ""}`).toString("base64");
        const secondRes = await this.request(method, uri, body, `Basic ${basicCreds}`);
        if (secondRes.statusCode === 200 || secondRes.statusCode === 201) {
          return { statusCode: secondRes.statusCode, data: secondRes.data };
        } else {
          throw new Error("Authentication failed (401 Unauthorized) with Basic credentials.");
        }
      }
    }
    throw new Error(`Device returned unexpected HTTP status ${firstRes.statusCode}`);
  }
  // Get Device Information
  async getDeviceInfo() {
    const res = await this.executeWithAuth("GET", "/ISAPI/System/deviceInfo");
    const data = res.data;
    const getTag = (xml, tag) => {
      const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return match ? match[1].trim() : "";
    };
    let model = "DS-K1A8503MF";
    let serialNumber = "";
    let firmwareVersion = "";
    let deviceName = "Hikvision Attendance Terminal";
    let macAddress = "";
    let deviceType = "";
    if (data.trim().startsWith("{")) {
      try {
        const json = JSON.parse(data);
        const info = json.DeviceInfo || json;
        model = info.model || model;
        serialNumber = info.serialNumber || serialNumber;
        firmwareVersion = info.firmwareVersion || info.softwareVersion || firmwareVersion;
        deviceName = info.deviceName || deviceName;
        macAddress = info.macAddress || macAddress;
        deviceType = info.deviceType || deviceType;
      } catch {
      }
    } else {
      model = getTag(data, "model") || model;
      serialNumber = getTag(data, "serialNumber") || getTag(data, "deviceSerialNumber");
      firmwareVersion = getTag(data, "firmwareVersion") || getTag(data, "softwareVersion");
      deviceName = getTag(data, "deviceName") || deviceName;
      macAddress = getTag(data, "macAddress");
      deviceType = getTag(data, "deviceType");
    }
    return {
      deviceName,
      model,
      serialNumber,
      firmwareVersion,
      macAddress,
      deviceType
    };
  }
  // Get Device Clock
  async getDeviceTime() {
    try {
      const res = await this.executeWithAuth("GET", "/ISAPI/System/time");
      const getTag = (xml, tag) => {
        const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
        return match ? match[1].trim() : "";
      };
      if (res.data.trim().startsWith("{")) {
        const json = JSON.parse(res.data);
        return json.Time?.localTime || (/* @__PURE__ */ new Date()).toISOString();
      }
      return getTag(res.data, "localTime") || (/* @__PURE__ */ new Date()).toISOString();
    } catch {
      return (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19);
    }
  }
  // Download Attendance Event Records (ISAPI AcsEvent)
  async getAttendanceEvents(startDate, endDate) {
    const now = /* @__PURE__ */ new Date();
    const startStr = startDate ? `${startDate}T00:00:00+05:30` : `${now.toISOString().substring(0, 10)}T00:00:00+05:30`;
    const endStr = endDate ? `${endDate}T23:59:59+05:30` : `${now.toISOString().substring(0, 10)}T23:59:59+05:30`;
    const jsonPayload = JSON.stringify({
      AcsEventCond: {
        searchID: `lankahr-${Date.now()}`,
        searchResultPosition: 0,
        maxResults: 200,
        major: 0,
        minor: 0,
        startTime: startStr,
        endTime: endStr
      }
    });
    try {
      const res = await this.executeWithAuth("POST", "/ISAPI/AccessControl/AcsEvent?format=json", jsonPayload);
      if (res.data.trim().startsWith("{")) {
        const json = JSON.parse(res.data);
        const matches = json.AcsEvent?.InfoList || json.InfoList || [];
        const events2 = [];
        matches.forEach((item) => {
          const empNo = item.employeeNoString || item.employeeNo || item.cardNo;
          if (empNo) {
            let verifyMode = "FINGERPRINT";
            if (item.currentVerifyMode === "face" || item.minor === 76) verifyMode = "FACE";
            else if (item.currentVerifyMode === "card" || item.minor === 1) verifyMode = "CARD";
            let direction = "AUTO";
            if (item.attendanceStatus === "checkIn" || item.type === 0) direction = "IN";
            else if (item.attendanceStatus === "checkOut" || item.type === 1) direction = "OUT";
            events2.push({
              serialNo: item.serialNo || `${item.time}_${empNo}`,
              employeeNo: String(empNo).trim(),
              time: item.time,
              major: item.major || 5,
              minor: item.minor || 0,
              cardNo: item.cardNo,
              verifyMode,
              direction
            });
          }
        });
        return events2;
      }
    } catch {
    }
    const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
<AcsEventCond xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
  <searchID>${Date.now()}</searchID>
  <searchResultPosition>0</searchResultPosition>
  <maxResults>200</maxResults>
  <major>0</major>
  <minor>0</minor>
  <startTime>${startStr}</startTime>
  <endTime>${endStr}</endTime>
</AcsEventCond>`;
    const resXml = await this.executeWithAuth("POST", "/ISAPI/AccessControl/AcsEvent", xmlPayload);
    const xml = resXml.data;
    const events = [];
    const eventBlocks = xml.match(/<AcsEvent>[\s\S]*?<\/AcsEvent>/gi) || [];
    const getTag = (block, tag) => {
      const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return match ? match[1].trim() : "";
    };
    eventBlocks.forEach((block) => {
      const empNo = getTag(block, "employeeNoString") || getTag(block, "cardNo") || getTag(block, "employeeNo");
      const time = getTag(block, "time");
      const minor = parseInt(getTag(block, "minor") || "0", 10);
      const major = parseInt(getTag(block, "major") || "5", 10);
      const serialNo = getTag(block, "serialNo") || `${time}_${empNo}`;
      if (empNo && time) {
        let verifyMode = "FINGERPRINT";
        if (minor === 76) verifyMode = "FACE";
        if (minor === 1) verifyMode = "CARD";
        events.push({
          serialNo,
          employeeNo: empNo.trim(),
          time,
          major,
          minor,
          verifyMode,
          direction: "AUTO"
        });
      }
    });
    return events;
  }
};

// electron/main.ts
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
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:3000";
  if (isDev) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    const indexPath = import_path.default.join(import_electron.app.getAppPath(), "dist/index.html");
    if (import_fs.default.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadFile(import_path.default.join(__dirname, "../dist/index.html"));
    }
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
import_electron.ipcMain.handle("device:hikvision-test", async (event, config) => {
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
  } catch (err) {
    return {
      success: false,
      message: `CONNECTION FAILED: ${err.message}`,
      responseTimeMs: Date.now() - startTime
    };
  }
});
import_electron.ipcMain.handle("device:hikvision-download", async (event, config, startDate, endDate) => {
  try {
    const client = new HikvisionISAPIClient(config);
    const events = await client.getAttendanceEvents(startDate, endDate);
    return {
      success: true,
      events,
      count: events.length,
      message: `Downloaded ${events.length} attendance records from Hikvision ${config.ipAddress}:${config.port}`
    };
  } catch (err) {
    return {
      success: false,
      events: [],
      count: 0,
      message: `Failed to download attendance logs: ${err.message}`
    };
  }
});
//# sourceMappingURL=main.cjs.map
