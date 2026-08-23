var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// electron/main.ts
var main_exports = {};
__export(main_exports, {
  SqliteDatabaseManager: () => SqliteDatabaseManager
});
module.exports = __toCommonJS(main_exports);
var import_electron2 = require("electron");
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);

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
  // Download Attendance Event Records (ISAPI AcsEvent with pagination)
  async getAttendanceEvents(startDate, endDate, onProgress) {
    const queryStartTime = (/* @__PURE__ */ new Date()).toISOString();
    const formatTimeForHikvision = (dateStr, isEnd = false) => {
      if (!dateStr || dateStr.trim() === "") {
        if (isEnd) {
          const now = /* @__PURE__ */ new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, "0");
          const dd = String(now.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}T23:59:59+05:30`;
        } else {
          return `2000-01-01T00:00:00+05:30`;
        }
      }
      if (dateStr.includes("T")) {
        return dateStr;
      }
      return isEnd ? `${dateStr}T23:59:59+05:30` : `${dateStr}T00:00:00+05:30`;
    };
    const startStr = formatTimeForHikvision(startDate, false);
    const endStr = formatTimeForHikvision(endDate, true);
    const maxResults = 200;
    const searchID = `lankahr-${Date.now()}`;
    const allEvents = [];
    const eventSerialSet = /* @__PURE__ */ new Set();
    console.log(`
=================== HIKVISION DIAGNOSTIC QUERY START ===================`);
    console.log(`[Hikvision Diagnostic] Query Start Time: ${queryStartTime}`);
    console.log(`[Hikvision Diagnostic] Date Filter Range: ${startStr} ---> ${endStr}`);
    console.log(`[Hikvision Diagnostic] Search ID: ${searchID}, Max Batch Size: ${maxResults}`);
    let position = 0;
    let hasMore = true;
    let jsonSuccess = false;
    let batchIndex = 0;
    while (hasMore) {
      batchIndex++;
      console.log(`[Hikvision Diagnostic] Batch #${batchIndex}: Requesting searchResultPosition=${position}, maxResults=${maxResults}`);
      const jsonPayload = JSON.stringify({
        AcsEventCond: {
          searchID,
          searchResultPosition: position,
          maxResults,
          major: 0,
          minor: 0,
          startTime: startStr,
          endTime: endStr
        }
      });
      try {
        const res = await this.executeWithAuth("POST", "/ISAPI/AccessControl/AcsEvent?format=json", jsonPayload);
        if (res.data.trim().startsWith("{")) {
          jsonSuccess = true;
          const json = JSON.parse(res.data);
          const acsEvent = json.AcsEvent || json;
          const matches = acsEvent.InfoList || json.InfoList || [];
          const totalMatches = acsEvent.totalMatches || acsEvent.responseStatusNumOfMatches || matches.length;
          console.log(`[Hikvision Diagnostic] Batch #${batchIndex} Response: ${matches.length} items returned (totalMatches indicated by device: ${totalMatches})`);
          if (!Array.isArray(matches) || matches.length === 0) {
            console.log(`[Hikvision Diagnostic] Batch #${batchIndex}: Empty response block received. Ending pagination.`);
            hasMore = false;
            break;
          }
          let batchFilteredOut = 0;
          matches.forEach((item) => {
            const empNo = item.employeeNoString || (item.employeeNo !== void 0 && item.employeeNo !== null ? String(item.employeeNo) : void 0) || item.cardNo;
            if (empNo) {
              let verifyMode = "FINGERPRINT";
              if (item.currentVerifyMode === "face" || item.minor === 76) verifyMode = "FACE";
              else if (item.currentVerifyMode === "card" || item.minor === 1) verifyMode = "CARD";
              else if (item.currentVerifyMode === "pwd" || item.minor === 77) verifyMode = "PASSWORD";
              let direction = "AUTO";
              if (item.attendanceStatus === "checkIn" || item.type === 0) direction = "IN";
              else if (item.attendanceStatus === "checkOut" || item.type === 1) direction = "OUT";
              const serialNo = String(item.serialNo || `${item.time}_${empNo}`);
              const dedupKey = `${serialNo}_${empNo}_${item.time}`;
              if (!eventSerialSet.has(dedupKey)) {
                eventSerialSet.add(dedupKey);
                allEvents.push({
                  serialNo,
                  employeeNo: String(empNo).trim(),
                  time: item.time,
                  major: item.major || 5,
                  minor: item.minor || 0,
                  cardNo: item.cardNo,
                  verifyMode,
                  direction
                });
              } else {
                batchFilteredOut++;
              }
            } else {
              batchFilteredOut++;
              console.log(`[Hikvision Diagnostic] Filtered out event record without employeeNo or cardNo. Timestamp: ${item.time}`);
            }
          });
          if (batchFilteredOut > 0) {
            console.log(`[Hikvision Diagnostic] Batch #${batchIndex}: ${batchFilteredOut} records filtered out as internal ISAPI batch duplicates or missing user ID.`);
          }
          if (onProgress) {
            onProgress({ totalFetched: allEvents.length, currentBatchSize: matches.length });
          }
          if (matches.length < maxResults || totalMatches && position + matches.length >= totalMatches) {
            hasMore = false;
          } else {
            position += matches.length;
          }
        } else {
          hasMore = false;
        }
      } catch (err) {
        console.error(`[Hikvision Diagnostic] JSON Query Error at position ${position}: ${err?.message}`);
        if (!jsonSuccess) {
          break;
        }
        hasMore = false;
      }
    }
    if (jsonSuccess && allEvents.length > 0) {
      const queryEndTime2 = (/* @__PURE__ */ new Date()).toISOString();
      const uniqueUserIds2 = Array.from(new Set(allEvents.map((e) => e.employeeNo)));
      const sampleTimes = allEvents.slice(0, 5).map((e) => `${e.employeeNo}@${e.time}`);
      console.log(`[Hikvision Diagnostic] Query End Time: ${queryEndTime2}`);
      console.log(`[Hikvision Diagnostic] Total Unique Events Fetched: ${allEvents.length}`);
      console.log(`[Hikvision Diagnostic] Unique Employee/User IDs Found (${uniqueUserIds2.length}): ${uniqueUserIds2.join(", ")}`);
      console.log(`[Hikvision Diagnostic] Sample Event Timestamps: ${sampleTimes.join(" | ")}`);
      console.log(`=================== HIKVISION DIAGNOSTIC QUERY END ===================
`);
      return allEvents;
    }
    console.log(`[Hikvision Diagnostic] Attempting XML ISAPI AcsEvent Fallback Query...`);
    position = 0;
    hasMore = true;
    batchIndex = 0;
    while (hasMore) {
      batchIndex++;
      console.log(`[Hikvision Diagnostic] XML Batch #${batchIndex}: searchResultPosition=${position}, maxResults=${maxResults}`);
      const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
<AcsEventCond xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
  <searchID>${searchID}</searchID>
  <searchResultPosition>${position}</searchResultPosition>
  <maxResults>${maxResults}</maxResults>
  <major>0</major>
  <minor>0</minor>
  <startTime>${startStr}</startTime>
  <endTime>${endStr}</endTime>
</AcsEventCond>`;
      try {
        const resXml = await this.executeWithAuth("POST", "/ISAPI/AccessControl/AcsEvent", xmlPayload);
        const xml = resXml.data;
        const eventBlocks = xml.match(/<AcsEvent>[\s\S]*?<\/AcsEvent>/gi) || [];
        console.log(`[Hikvision Diagnostic] XML Batch #${batchIndex}: ${eventBlocks.length} AcsEvent blocks parsed.`);
        if (eventBlocks.length === 0) {
          hasMore = false;
          break;
        }
        const getTag = (block, tag) => {
          const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
          return match ? match[1].trim() : "";
        };
        let batchFilteredOut = 0;
        eventBlocks.forEach((block) => {
          const empNo = getTag(block, "employeeNoString") || getTag(block, "cardNo") || getTag(block, "employeeNo");
          const time = getTag(block, "time");
          const minor = parseInt(getTag(block, "minor") || "0", 10);
          const major = parseInt(getTag(block, "major") || "5", 10);
          const serialNo = getTag(block, "serialNo") || `${time}_${empNo}`;
          if (empNo && time) {
            let verifyMode = "FINGERPRINT";
            if (minor === 76) verifyMode = "FACE";
            else if (minor === 1) verifyMode = "CARD";
            else if (minor === 77) verifyMode = "PASSWORD";
            const dedupKey = `${serialNo}_${empNo}_${time}`;
            if (!eventSerialSet.has(dedupKey)) {
              eventSerialSet.add(dedupKey);
              allEvents.push({
                serialNo,
                employeeNo: empNo.trim(),
                time,
                major,
                minor,
                verifyMode,
                direction: "AUTO"
              });
            } else {
              batchFilteredOut++;
            }
          } else {
            batchFilteredOut++;
          }
        });
        if (onProgress) {
          onProgress({ totalFetched: allEvents.length, currentBatchSize: eventBlocks.length });
        }
        if (eventBlocks.length < maxResults) {
          hasMore = false;
        } else {
          position += eventBlocks.length;
        }
      } catch (err) {
        console.error(`[Hikvision Diagnostic] XML Query Error at position ${position}: ${err?.message}`);
        hasMore = false;
      }
    }
    const queryEndTime = (/* @__PURE__ */ new Date()).toISOString();
    const uniqueUserIds = Array.from(new Set(allEvents.map((e) => e.employeeNo)));
    console.log(`[Hikvision Diagnostic] XML Query End Time: ${queryEndTime}`);
    console.log(`[Hikvision Diagnostic] Total Unique Events Fetched via XML: ${allEvents.length}`);
    console.log(`[Hikvision Diagnostic] Employee/User IDs Found (${uniqueUserIds.length}): ${uniqueUserIds.join(", ")}`);
    console.log(`=================== HIKVISION DIAGNOSTIC QUERY END ===================
`);
    return allEvents;
  }
};

// electron/sqliteDb.ts
var import_sql = __toESM(require("sql.js"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_electron = require("electron");
var SqliteDatabaseManager = class {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    const userDataPath = import_electron.app.getPath("userData");
    if (!import_fs.default.existsSync(userDataPath)) {
      import_fs.default.mkdirSync(userDataPath, { recursive: true });
    }
    this.dbFilePath = import_path.default.join(userDataPath, "lankahr.sqlite");
    console.log(`[SqliteDB] SQLite Database file path: ${this.dbFilePath}`);
  }
  async init() {
    if (this.isInitialized && this.db) return;
    try {
      const SQL = await (0, import_sql.default)();
      if (import_fs.default.existsSync(this.dbFilePath)) {
        const fileBuffer = import_fs.default.readFileSync(this.dbFilePath);
        this.db = new SQL.Database(fileBuffer);
        console.log("[SqliteDB] Loaded existing SQLite database from disk.");
      } else {
        this.db = new SQL.Database();
        console.log("[SqliteDB] Created new in-memory SQLite database.");
      }
      this.createTables();
      this.saveToDisk();
      this.isInitialized = true;
    } catch (err) {
      console.error("[SqliteDB] Failed to initialize SQLite database:", err);
      throw err;
    }
  }
  createTables() {
    if (!this.db) return;
    const schema = `
      CREATE TABLE IF NOT EXISTS system_metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS company_settings (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        code TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS designations (
        id TEXT PRIMARY KEY,
        code TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS payroll_categories (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS allowance_rules (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS leave_types (
        id TEXT PRIMARY KEY,
        code TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        employee_code TEXT UNIQUE,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        ip_address TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS raw_punches (
        id TEXT PRIMARY KEY,
        device_id TEXT,
        user_id TEXT,
        punch_timestamp TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS processed_attendance (
        id TEXT PRIMARY KEY,
        employee_id TEXT,
        date TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS employee_leaves (
        id TEXT PRIMARY KEY,
        employee_id TEXT,
        start_date TEXT,
        end_date TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS incentives (
        id TEXT PRIMARY KEY,
        employee_id TEXT,
        month_year TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS payroll_periods (
        id TEXT PRIMARY KEY,
        month_year TEXT UNIQUE,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        action TEXT,
        data TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS holidays (
        id TEXT PRIMARY KEY,
        holiday_date TEXT,
        holiday_name TEXT,
        holiday_type TEXT,
        year INTEGER,
        created_at TEXT,
        updated_at TEXT,
        data TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS monthly_working_days (
        id TEXT PRIMARY KEY,
        year INTEGER,
        month TEXT,
        auto_working_days INTEGER,
        manual_override INTEGER,
        manual_working_days INTEGER,
        final_working_days INTEGER,
        updated_by TEXT,
        updated_at TEXT,
        data TEXT NOT NULL
      );
    `;
    this.db.exec(schema);
  }
  saveToDisk() {
    if (!this.db) return { success: false, error: "Database not initialized" };
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      import_fs.default.writeFileSync(this.dbFilePath, buffer);
      const userDataPath = import_electron.app.getPath("userData");
      const backupJsonPath = import_path.default.join(userDataPath, "lankahr_data_snapshot.json");
      const state = this.getFullState();
      import_fs.default.writeFileSync(backupJsonPath, JSON.stringify(state, null, 2), "utf-8");
      return { success: true };
    } catch (err) {
      console.error("[SqliteDB] Error saving SQLite database to disk:", err);
      return { success: false, error: err.message };
    }
  }
  getFullState() {
    if (!this.db) return null;
    const readTable = (tableName) => {
      try {
        const stmt = this.db.prepare(`SELECT data FROM ${tableName}`);
        const rows = [];
        while (stmt.step()) {
          const row = stmt.getAsObject();
          if (row.data) {
            try {
              rows.push(JSON.parse(row.data));
            } catch {
            }
          }
        }
        stmt.free();
        return rows;
      } catch (err) {
        console.error(`[SqliteDB] Error reading table ${tableName}:`, err);
        return [];
      }
    };
    const readSingle = (tableName) => {
      const rows = readTable(tableName);
      return rows.length > 0 ? rows[0] : null;
    };
    const settings = readSingle("company_settings");
    const departments = readTable("departments");
    const designations = readTable("designations");
    const payrollCategories = readTable("payroll_categories");
    const allowanceRules = readTable("allowance_rules");
    const leaveTypes = readTable("leave_types");
    const employees = readTable("employees");
    const devices = readTable("devices");
    const rawPunches = readTable("raw_punches");
    const processedAttendance = readTable("processed_attendance");
    const employeeLeaves = readTable("employee_leaves");
    const incentives = readTable("incentives");
    const payrollPeriods = readTable("payroll_periods");
    const auditLogs = readTable("audit_logs");
    const holidays = readTable("holidays");
    const monthlyWorkingDays = readTable("monthly_working_days");
    let version = 3;
    let lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    try {
      const stmt = this.db.prepare(`SELECT key, value FROM system_metadata`);
      while (stmt.step()) {
        const row = stmt.getAsObject();
        if (row.key === "version") version = parseInt(row.value, 10) || 3;
        if (row.key === "lastUpdated") lastUpdated = row.value || lastUpdated;
      }
      stmt.free();
    } catch {
    }
    return {
      version,
      lastUpdated,
      companySettings: settings,
      departments,
      designations,
      payrollCategories,
      allowanceRules,
      leaveTypes,
      employees,
      devices,
      rawPunches,
      processedAttendance,
      employeeLeaves,
      incentives,
      payrollPeriods,
      auditLogs,
      holidays,
      monthlyWorkingDays
    };
  }
  saveFullState(state) {
    if (!this.db) return { success: false, error: "Database not initialized" };
    try {
      this.db.exec("BEGIN TRANSACTION");
      this.db.run("INSERT OR REPLACE INTO system_metadata (key, value, updated_at) VALUES (?, ?, ?)", [
        "version",
        String(state.version || 3),
        (/* @__PURE__ */ new Date()).toISOString()
      ]);
      this.db.run("INSERT OR REPLACE INTO system_metadata (key, value, updated_at) VALUES (?, ?, ?)", [
        "lastUpdated",
        state.lastUpdated || (/* @__PURE__ */ new Date()).toISOString(),
        (/* @__PURE__ */ new Date()).toISOString()
      ]);
      if (state.companySettings) {
        this.db.run("INSERT OR REPLACE INTO company_settings (id, data, updated_at) VALUES (?, ?, ?)", [
          state.companySettings.id || "company-01",
          JSON.stringify(state.companySettings),
          (/* @__PURE__ */ new Date()).toISOString()
        ]);
      }
      const upsertRecord = (tableName, item, id) => {
        if (tableName === "holidays") {
          this.db.run(
            `INSERT OR REPLACE INTO holidays (id, holiday_date, holiday_name, holiday_type, year, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              item.date || "",
              item.name || "",
              item.type || "Poya",
              item.year || 0,
              item.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
              (/* @__PURE__ */ new Date()).toISOString(),
              JSON.stringify(item)
            ]
          );
        } else if (tableName === "monthly_working_days") {
          this.db.run(
            `INSERT OR REPLACE INTO monthly_working_days (id, year, month, auto_working_days, manual_override, manual_working_days, final_working_days, updated_by, updated_at, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              item.year || 0,
              item.month || "",
              item.autoWorkingDays || 0,
              item.manualOverride ? 1 : 0,
              item.manualWorkingDays || 0,
              item.finalWorkingDays || 0,
              item.updatedBy || "",
              item.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
              JSON.stringify(item)
            ]
          );
        } else if (tableName === "departments") {
          this.db.run(
            `INSERT OR REPLACE INTO departments (id, code, data, updated_at) VALUES (?, ?, ?, ?)`,
            [
              id,
              item.code || "",
              JSON.stringify(item),
              (/* @__PURE__ */ new Date()).toISOString()
            ]
          );
        } else if (tableName === "designations") {
          this.db.run(
            `INSERT OR REPLACE INTO designations (id, code, data, updated_at) VALUES (?, ?, ?, ?)`,
            [
              id,
              item.code || "",
              JSON.stringify(item),
              (/* @__PURE__ */ new Date()).toISOString()
            ]
          );
        } else if (tableName === "leave_types") {
          this.db.run(
            `INSERT OR REPLACE INTO leave_types (id, code, data, updated_at) VALUES (?, ?, ?, ?)`,
            [
              id,
              item.code || "",
              JSON.stringify(item),
              (/* @__PURE__ */ new Date()).toISOString()
            ]
          );
        } else if (tableName === "employees") {
          this.db.run(
            `INSERT OR REPLACE INTO employees (id, employee_code, data, updated_at) VALUES (?, ?, ?, ?)`,
            [
              id,
              item.employeeCode || "",
              JSON.stringify(item),
              (/* @__PURE__ */ new Date()).toISOString()
            ]
          );
        } else if (tableName === "devices") {
          this.db.run(
            `INSERT OR REPLACE INTO devices (id, ip_address, data, updated_at) VALUES (?, ?, ?, ?)`,
            [
              id,
              item.ipAddress || "",
              JSON.stringify(item),
              (/* @__PURE__ */ new Date()).toISOString()
            ]
          );
        } else if (tableName === "raw_punches") {
          this.db.run(
            `INSERT OR REPLACE INTO raw_punches (id, device_id, user_id, punch_timestamp, data, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              id,
              item.deviceId || "",
              item.userId || "",
              item.timestamp || "",
              JSON.stringify(item),
              (/* @__PURE__ */ new Date()).toISOString()
            ]
          );
        } else if (tableName === "processed_attendance") {
          this.db.run(
            `INSERT OR REPLACE INTO processed_attendance (id, employee_id, date, data, updated_at) VALUES (?, ?, ?, ?, ?)`,
            [
              id,
              item.employeeId || "",
              item.date || "",
              JSON.stringify(item),
              (/* @__PURE__ */ new Date()).toISOString()
            ]
          );
        } else if (tableName === "employee_leaves") {
          this.db.run(
            `INSERT OR REPLACE INTO employee_leaves (id, employee_id, start_date, end_date, data, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              id,
              item.employeeId || "",
              item.startDate || "",
              item.endDate || "",
              JSON.stringify(item),
              (/* @__PURE__ */ new Date()).toISOString()
            ]
          );
        } else if (tableName === "incentives") {
          this.db.run(
            `INSERT OR REPLACE INTO incentives (id, employee_id, month_year, data, updated_at) VALUES (?, ?, ?, ?, ?)`,
            [
              id,
              item.employeeId || "",
              item.payrollMonth || "",
              JSON.stringify(item),
              (/* @__PURE__ */ new Date()).toISOString()
            ]
          );
        } else if (tableName === "payroll_periods") {
          this.db.run(
            `INSERT OR REPLACE INTO payroll_periods (id, month_year, data, updated_at) VALUES (?, ?, ?, ?)`,
            [
              id,
              item.monthYear || item.month || "",
              JSON.stringify(item),
              (/* @__PURE__ */ new Date()).toISOString()
            ]
          );
        } else {
          this.db.run(
            `INSERT OR REPLACE INTO ${tableName} (id, data, updated_at) VALUES (?, ?, ?)`,
            [
              id,
              JSON.stringify(item),
              (/* @__PURE__ */ new Date()).toISOString()
            ]
          );
        }
      };
      const upsertTable = (tableName, items, getId) => {
        if (Array.isArray(items) && items.length > 0) {
          items.forEach((item) => {
            const id = getId(item) || `${tableName}-${Date.now()}-${Math.random()}`;
            upsertRecord(tableName, item, id);
          });
        }
      };
      upsertTable("departments", state.departments, (i) => i.id);
      upsertTable("designations", state.designations, (i) => i.id);
      upsertTable("payroll_categories", state.payrollCategories, (i) => i.id);
      upsertTable("allowance_rules", state.allowanceRules, (i) => i.id);
      upsertTable("leave_types", state.leaveTypes, (i) => i.id);
      upsertTable("employees", state.employees, (i) => i.id);
      upsertTable("devices", state.devices, (i) => i.id);
      upsertTable("raw_punches", state.rawPunches, (i) => i.id);
      upsertTable("processed_attendance", state.processedAttendance, (i) => i.id);
      upsertTable("employee_leaves", state.employeeLeaves, (i) => i.id);
      upsertTable("incentives", state.incentives, (i) => i.id);
      upsertTable("payroll_periods", state.payrollPeriods, (i) => i.id);
      upsertTable("holidays", state.holidays || [], (i) => i.id);
      upsertTable("monthly_working_days", state.monthlyWorkingDays || [], (i) => i.id);
      if (state.deletedIds) {
        const deletedMap = state.deletedIds;
        const tablesToClean = [
          { key: "employees", table: "employees" },
          { key: "employeeLeaves", table: "employee_leaves" },
          { key: "holidays", table: "holidays" },
          { key: "departments", table: "departments" },
          { key: "designations", table: "designations" },
          { key: "devices", table: "devices" },
          { key: "rawPunches", table: "raw_punches" },
          { key: "processedAttendance", table: "processed_attendance" },
          { key: "incentives", table: "incentives" },
          { key: "payrollCategories", table: "payroll_categories" },
          { key: "payrollPeriods", table: "payroll_periods" },
          { key: "allowanceRules", table: "allowance_rules" },
          { key: "leaveTypes", table: "leave_types" },
          { key: "monthlyWorkingDays", table: "monthly_working_days" }
        ];
        tablesToClean.forEach(({ key, table }) => {
          const ids = deletedMap[key];
          if (Array.isArray(ids) && ids.length > 0) {
            ids.forEach((id) => {
              if (id) {
                this.db.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
                console.log(`[SqliteDB] Explicitly deleted record with ID ${id} from table ${table}.`);
              }
            });
          }
        });
      }
      if (Array.isArray(state.auditLogs)) {
        this.db.run("DELETE FROM audit_logs");
        state.auditLogs.slice(0, 500).forEach((log) => {
          this.db.run("INSERT INTO audit_logs (id, timestamp, action, data) VALUES (?, ?, ?, ?)", [
            log.id || `audit-${Date.now()}`,
            log.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
            log.action || "LOG",
            JSON.stringify(log)
          ]);
        });
      }
      this.db.exec("COMMIT");
      const diskRes = this.saveToDisk();
      if (!diskRes.success) {
        return { success: false, error: diskRes.error };
      }
      return { success: true };
    } catch (err) {
      if (this.db) {
        try {
          this.db.exec("ROLLBACK");
        } catch {
        }
      }
      console.error("[SqliteDB] Error saving full state to SQLite:", err);
      return { success: false, error: err.message };
    }
  }
  clearDatabase() {
    if (!this.db) return { success: false, error: "Database not initialized" };
    try {
      this.db.exec(`
        DELETE FROM company_settings;
        DELETE FROM departments;
        DELETE FROM designations;
        DELETE FROM payroll_categories;
        DELETE FROM allowance_rules;
        DELETE FROM leave_types;
        DELETE FROM employees;
        DELETE FROM devices;
        DELETE FROM raw_punches;
        DELETE FROM processed_attendance;
        DELETE FROM employee_leaves;
        DELETE FROM incentives;
        DELETE FROM payroll_periods;
        DELETE FROM audit_logs;
      `);
      this.saveToDisk();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  getDbPath() {
    return this.dbFilePath;
  }
};

// electron/main.ts
try {
  import_electron2.app.disableHardwareAcceleration();
  import_electron2.app.commandLine.appendSwitch("disable-gpu");
  import_electron2.app.commandLine.appendSwitch("disable-gpu-compositing");
} catch (gpuErr) {
  console.warn("[Electron] Could not disable hardware acceleration:", gpuErr);
}
console.log(`[Electron] Starting LankaHR Desktop Main Process (Electron v${process.versions.electron}, Node v${process.versions.node}, Platform: ${process.platform})`);
var isDev = process.env.NODE_ENV === "development" || !import_electron2.app.isPackaged;
var mainWindow = null;
var sqliteDb = null;
var gotTheLock = import_electron2.app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log("[Electron] Another instance of LankaHR is already running. Exiting secondary instance.");
  import_electron2.app.quit();
} else {
  import_electron2.app.on("second-instance", () => {
    console.log("[Electron] Second instance launch detected. Focusing existing main window.");
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
function getPreloadPath() {
  const possiblePaths = [
    import_path2.default.join(__dirname, "preload.cjs"),
    import_path2.default.join(__dirname, "../dist-electron/preload.cjs"),
    import_path2.default.join(import_electron2.app.getAppPath(), "dist-electron/preload.cjs"),
    import_path2.default.join(import_electron2.app.getAppPath(), "electron/preload.cjs")
  ];
  for (const p of possiblePaths) {
    if (import_fs2.default.existsSync(p)) {
      return p;
    }
  }
  return import_path2.default.join(__dirname, "preload.cjs");
}
function getProductionIndexPath() {
  const candidatePaths = [
    import_path2.default.join(import_electron2.app.getAppPath(), "dist", "index.html"),
    import_path2.default.join(__dirname, "..", "dist", "index.html"),
    import_path2.default.join(__dirname, "..", "..", "dist", "index.html"),
    import_path2.default.join(process.resourcesPath, "app", "dist", "index.html"),
    import_path2.default.join(process.resourcesPath, "dist", "index.html")
  ];
  for (const candidate of candidatePaths) {
    if (import_fs2.default.existsSync(candidate)) {
      return candidate;
    }
  }
  return import_path2.default.join(import_electron2.app.getAppPath(), "dist", "index.html");
}
function createWindow() {
  console.log("[Electron] Creating BrowserWindow...");
  const preloadPath = getPreloadPath();
  console.log(`[Electron] Preload script path: ${preloadPath} (exists: ${import_fs2.default.existsSync(preloadPath)})`);
  mainWindow = new import_electron2.BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: "LankaHR - Sri Lankan HRM, Attendance & Payroll System",
    frame: true,
    show: false,
    // Show gracefully when ready
    autoHideMenuBar: false,
    backgroundColor: "#0a0f1d",
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
      // Recommended when using contextBridge with CommonJS preload
    }
  });
  console.log("[Electron] BrowserWindow created successfully. ID:", mainWindow.id);
  mainWindow.once("ready-to-show", () => {
    console.log("[Electron] Window ready-to-show event fired. Displaying window.");
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log("[Electron] Fallback: Forcing window visibility.");
      mainWindow.show();
      mainWindow.focus();
    }
  }, 2500);
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:3000";
  if (isDev) {
    console.log(`[Electron] Development mode active. Loading URL: ${devServerUrl}`);
    mainWindow.loadURL(devServerUrl).catch((err) => {
      console.error(`[Electron] Failed to load dev URL (${devServerUrl}):`, err.message);
    });
  } else {
    const prodIndexPath = getProductionIndexPath();
    console.log(`[Electron] Production mode active. Loading file: ${prodIndexPath}`);
    mainWindow.loadFile(prodIndexPath).catch((err) => {
      console.error(`[Electron] Failed to load production index.html:`, err.message);
    });
  }
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[Electron WebContents] Renderer process finished loading successfully.");
  });
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron WebContents] Failed to load URL: ${validatedURL}`);
    console.error(`[Electron WebContents] Error Code: ${errorCode}, Description: ${errorDescription}`);
    if (isDev && errorCode !== -3) {
      console.log("[Electron WebContents] Retrying dev server connection in 1.5s...");
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(devServerUrl).catch(() => {
          });
        }
      }, 1500);
    }
  });
  mainWindow.webContents.on("render-process-gone", (event, details) => {
    console.error(`[Electron WebContents] Renderer process gone! Reason: ${details.reason}, Exit Code: ${details.exitCode}`);
  });
  mainWindow.webContents.on("unresponsive", () => {
    console.warn("[Electron WebContents] Renderer process became unresponsive.");
  });
  mainWindow.webContents.on("responsive", () => {
    console.log("[Electron WebContents] Renderer process became responsive again.");
  });
  mainWindow.on("closed", () => {
    console.log("[Electron] BrowserWindow closed event fired.");
    mainWindow = null;
  });
}
import_electron2.app.whenReady().then(() => {
  console.log("[Electron] app.whenReady() resolved successfully.");
  createWindow();
  import_electron2.app.on("activate", () => {
    console.log("[Electron] app.activate event fired.");
    if (import_electron2.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch((err) => {
  console.error("[Electron] Error during app.whenReady():", err);
});
import_electron2.app.on("window-all-closed", () => {
  console.log("[Electron] app.window-all-closed event fired.");
  if (process.platform !== "darwin") {
    console.log("[Electron] Quitting application (platform != darwin)...");
    import_electron2.app.quit();
  }
});
import_electron2.app.on("before-quit", () => {
  console.log("[Electron] app.before-quit event fired.");
});
import_electron2.app.on("will-quit", () => {
  console.log("[Electron] app.will-quit event fired.");
});
process.on("uncaughtException", (err) => {
  console.error("[Electron] Uncaught Exception occurred in main process:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Electron] Unhandled Rejection occurred in main process:", reason);
});
import_electron2.ipcMain.handle("app:get-version", () => {
  return import_electron2.app.getVersion();
});
import_electron2.ipcMain.handle("app:get-app-data-path", () => {
  return import_electron2.app.getPath("userData");
});
import_electron2.ipcMain.handle("dialog:save-backup", async (event, defaultName) => {
  if (!mainWindow) return null;
  const { filePath } = await import_electron2.dialog.showSaveDialog(mainWindow, {
    title: "Save LankaHR Database Backup",
    defaultPath: defaultName || `LankaHR_Backup_${(/* @__PURE__ */ new Date()).toISOString().substring(0, 10)}.json`,
    filters: [
      { name: "LankaHR Database File (*.json, *.db)", extensions: ["json", "db"] },
      { name: "All Files", extensions: ["*"] }
    ]
  });
  return filePath;
});
import_electron2.ipcMain.handle("dialog:open-backup", async () => {
  if (!mainWindow) return null;
  const { filePaths } = await import_electron2.dialog.showOpenDialog(mainWindow, {
    title: "Select LankaHR Backup File to Restore",
    filters: [
      { name: "LankaHR Database File (*.json, *.db)", extensions: ["json", "db"] },
      { name: "All Files", extensions: ["*"] }
    ],
    properties: ["openFile"]
  });
  return filePaths && filePaths.length > 0 ? filePaths[0] : null;
});
import_electron2.ipcMain.handle("fs:write-file", async (event, filePath, content) => {
  try {
    import_fs2.default.writeFileSync(filePath, content, "utf-8");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
import_electron2.ipcMain.handle("fs:read-file", async (event, filePath) => {
  try {
    const data = import_fs2.default.readFileSync(filePath, "utf-8");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
import_electron2.ipcMain.handle("db:init", async () => {
  try {
    if (!sqliteDb) {
      sqliteDb = new SqliteDatabaseManager();
    }
    await sqliteDb.init();
    const state = sqliteDb.getFullState();
    return { success: true, state };
  } catch (err) {
    console.error("[Electron IPC db:init] Error:", err);
    return { success: false, error: err.message };
  }
});
import_electron2.ipcMain.handle("db:save-all", async (event, state) => {
  try {
    if (!sqliteDb) {
      sqliteDb = new SqliteDatabaseManager();
      await sqliteDb.init();
    }
    const res = sqliteDb.saveFullState(state);
    return res;
  } catch (err) {
    console.error("[Electron IPC db:save-all] Error:", err);
    return { success: false, error: err.message };
  }
});
import_electron2.ipcMain.handle("db:clear", async () => {
  try {
    if (!sqliteDb) {
      sqliteDb = new SqliteDatabaseManager();
      await sqliteDb.init();
    }
    return sqliteDb.clearDatabase();
  } catch (err) {
    return { success: false, error: err.message };
  }
});
import_electron2.ipcMain.handle("db:get-path", () => {
  return sqliteDb ? sqliteDb.getDbPath() : import_path2.default.join(import_electron2.app.getPath("userData"), "lankahr.sqlite");
});
import_electron2.ipcMain.handle("window:minimize", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});
import_electron2.ipcMain.handle("window:maximize", () => {
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
import_electron2.ipcMain.handle("window:is-maximized", () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});
import_electron2.ipcMain.handle("window:close", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});
import_electron2.ipcMain.handle("device:hikvision-test", async (event, config) => {
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
  } catch (err) {
    console.error(`[Electron Hikvision] Connection test failed: ${err.message}`);
    return {
      success: false,
      message: `CONNECTION FAILED: ${err.message}`,
      responseTimeMs: Date.now() - startTime
    };
  }
});
import_electron2.ipcMain.handle("device:hikvision-download", async (event, config, startDate, endDate) => {
  try {
    console.log(`[Electron Hikvision] Downloading attendance from IP: ${config.ipAddress}:${config.port} (Range: ${startDate || "ALL"} to ${endDate || "ALL"})`);
    const client = new HikvisionISAPIClient(config);
    const events = await client.getAttendanceEvents(startDate, endDate, (progress) => {
      event.sender.send("hikvision:download-progress", progress);
    });
    return {
      success: true,
      events,
      count: events.length,
      message: `Downloaded ${events.length} attendance records from Hikvision ${config.ipAddress}:${config.port}`
    };
  } catch (err) {
    console.error(`[Electron Hikvision] Download logs failed: ${err.message}`);
    return {
      success: false,
      events: [],
      count: 0,
      message: `Failed to download attendance logs: ${err.message}`
    };
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SqliteDatabaseManager
});
//# sourceMappingURL=main.cjs.map
