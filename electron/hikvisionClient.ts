import http from 'http';
import https from 'https';
import crypto from 'crypto';

export interface HikvisionConfig {
  ipAddress: string;
  port: number;
  username?: string;
  password?: string;
  timeoutMs?: number;
  useHttps?: boolean;
}

export interface HikvisionDeviceInfo {
  deviceName: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  macAddress?: string;
  deviceType?: string;
  deviceTime?: string;
}

export interface HikvisionEventLog {
  serialNo?: number | string;
  employeeNo: string;
  time: string; // ISO or YYYY-MM-DDTHH:mm:ss
  major: number;
  minor: number;
  cardNo?: string;
  verifyMode?: string;
  direction?: 'IN' | 'OUT' | 'AUTO';
  attendanceStatus?: string;
}

const MAX_PAGES = 500;

export interface HikvisionUserRecord {
  employeeNo: string;
  name?: string;
  userType?: string;
  gender?: string;
  cardNo?: string;
  cards?: string[];
  numOfCard?: number;
  numOfFP?: number;
  numOfFace?: number;
  userVerifyMode?: string;
  doorRight?: string;
  validBegin?: string;
  validEnd?: string;
}

export class HikvisionISAPIClient {
  private config: HikvisionConfig;

  constructor(config: HikvisionConfig) {
    this.config = {
      ...config,
      port: config.port || 80,
      timeoutMs: config.timeoutMs || 5000,
      useHttps: config.useHttps || false
    };
  }

  private parseDigestAuthHeader(authHeader: string): Record<string, string> {
    const params: Record<string, string> = {};
    const matches = authHeader.replace(/^Digest\s+/, '').match(/(\w+)="?([^",]+)"?/g);
    if (matches) {
      matches.forEach(m => {
        const eqIdx = m.indexOf('=');
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

  private generateDigestHeader(
    method: string,
    uri: string,
    realm: string,
    nonce: string,
    qop?: string,
    opaque?: string
  ): string {
    const username = this.config.username || 'admin';
    const password = this.config.password || '';

    const ha1 = crypto
      .createHash('md5')
      .update(`${username}:${realm}:${password}`)
      .digest('hex');

    const ha2 = crypto
      .createHash('md5')
      .update(`${method}:${uri}`)
      .digest('hex');

    let response: string;
    let header = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}"`;

    if (qop) {
      const nc = '00000001';
      const cnonce = crypto.randomBytes(8).toString('hex');
      response = crypto
        .createHash('md5')
        .update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
        .digest('hex');
      header += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}", response="${response}"`;
    } else {
      response = crypto
        .createHash('md5')
        .update(`${ha1}:${nonce}:${ha2}`)
        .digest('hex');
      header += `, response="${response}"`;
    }

    if (opaque) {
      header += `, opaque="${opaque}"`;
    }

    return header;
  }

  private request(
    method: string,
    uri: string,
    body?: string,
    authHeader?: string
  ): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; data: string }> {
    return new Promise((resolve, reject) => {
      const client = this.config.useHttps ? https : http;
      const headers: Record<string, string> = {
        'Accept': 'application/json, text/xml, */*',
        'User-Agent': 'LankaHR-Desktop/1.0'
      };

      if (body) {
        if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
          headers['Content-Type'] = 'application/json';
        } else {
          headers['Content-Type'] = 'application/xml';
        }
        headers['Content-Length'] = Buffer.byteLength(body).toString();
      }

      if (authHeader) {
        headers['Authorization'] = authHeader;
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
        res => {
          let responseData = '';
          res.setEncoding('utf8');
          res.on('data', chunk => {
            responseData += chunk;
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode || 0,
              headers: res.headers,
              data: responseData
            });
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Connection timeout (${this.config.timeoutMs}ms) to ${this.config.ipAddress}:${this.config.port}`));
      });

      req.on('error', err => {
        let msg = err.message;
        if (err.message.includes('ECONNREFUSED')) {
          msg = `Connection refused by ${this.config.ipAddress}:${this.config.port}. Ensure the device is powered on and port ${this.config.port} is open.`;
        } else if (err.message.includes('EHOSTUNREACH')) {
          msg = `Host unreachable (${this.config.ipAddress}). Check local network subnet and Ethernet/Wi-Fi connection.`;
        } else if (err.message.includes('ETIMEDOUT')) {
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

  private async executeWithAuth(method: string, uri: string, body?: string): Promise<{ statusCode: number; data: string }> {
    // 1. Initial request to trigger 401 or get direct response
    const firstRes = await this.request(method, uri, body);

    if (firstRes.statusCode === 200 || firstRes.statusCode === 201) {
      return { statusCode: firstRes.statusCode, data: firstRes.data };
    }

    if (firstRes.statusCode === 401) {
      const wwwAuth = firstRes.headers['www-authenticate'] || firstRes.headers['WWW-Authenticate'];
      if (!wwwAuth) {
        throw new Error('Authentication failed (401 Unauthorized). Device did not supply authentication realm.');
      }

      const authHeaderStr = Array.isArray(wwwAuth) ? wwwAuth[0] : wwwAuth;
      if (authHeaderStr.toLowerCase().startsWith('digest')) {
        const digestParams = this.parseDigestAuthHeader(authHeaderStr);
        const authHeader = this.generateDigestHeader(
          method,
          uri,
          digestParams.realm || 'IP Camera',
          digestParams.nonce || '',
          digestParams.qop,
          digestParams.opaque
        );

        // Resend request with generated Digest header
        const secondRes = await this.request(method, uri, body, authHeader);
        if (secondRes.statusCode === 200 || secondRes.statusCode === 201) {
          return { statusCode: secondRes.statusCode, data: secondRes.data };
        } else if (secondRes.statusCode === 401) {
          throw new Error('Authentication failed (401 Unauthorized). Incorrect device username or password.');
        } else {
          throw new Error(`Device responded with HTTP status ${secondRes.statusCode}: ${secondRes.data.substring(0, 150)}`);
        }
      } else if (authHeaderStr.toLowerCase().startsWith('basic')) {
        const basicCreds = Buffer.from(`${this.config.username || 'admin'}:${this.config.password || ''}`).toString('base64');
        const secondRes = await this.request(method, uri, body, `Basic ${basicCreds}`);
        if (secondRes.statusCode === 200 || secondRes.statusCode === 201) {
          return { statusCode: secondRes.statusCode, data: secondRes.data };
        } else {
          throw new Error('Authentication failed (401 Unauthorized) with Basic credentials.');
        }
      }
    }

    throw new Error(`Device returned unexpected HTTP status ${firstRes.statusCode}`);
  }

  // Get Device Information
  public async getDeviceInfo(): Promise<HikvisionDeviceInfo> {
    const res = await this.executeWithAuth('GET', '/ISAPI/System/deviceInfo');
    const data = res.data;

    // Helper to extract XML tag values
    const getTag = (xml: string, tag: string): string => {
      const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return match ? match[1].trim() : '';
    };

    let model = 'DS-K1A8503MF';
    let serialNumber = '';
    let firmwareVersion = '';
    let deviceName = 'Hikvision Attendance Terminal';
    let macAddress = '';
    let deviceType = '';

    if (data.trim().startsWith('{')) {
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
        // Fallback to XML parser
      }
    } else {
      model = getTag(data, 'model') || model;
      serialNumber = getTag(data, 'serialNumber') || getTag(data, 'deviceSerialNumber');
      firmwareVersion = getTag(data, 'firmwareVersion') || getTag(data, 'softwareVersion');
      deviceName = getTag(data, 'deviceName') || deviceName;
      macAddress = getTag(data, 'macAddress');
      deviceType = getTag(data, 'deviceType');
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
  public async getDeviceTime(): Promise<string> {
    try {
      const res = await this.executeWithAuth('GET', '/ISAPI/System/time');
      const getTag = (xml: string, tag: string): string => {
        const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
        return match ? match[1].trim() : '';
      };
      if (res.data.trim().startsWith('{')) {
        const json = JSON.parse(res.data);
        return json.Time?.localTime || new Date().toISOString();
      }
      return getTag(res.data, 'localTime') || new Date().toISOString();
    } catch {
      return new Date().toISOString().replace('T', ' ').substring(0, 19);
    }
  }

  // Download Attendance Event Records (ISAPI AcsEvent with pagination)
  public async getAttendanceEvents(
    startDate?: string,
    endDate?: string,
    onProgress?: (progressInfo: { totalFetched: number; currentBatchSize: number }) => void
  ): Promise<HikvisionEventLog[]> {
    const queryStartTime = new Date().toISOString();

    // Format start/end date in Sri Lanka (+05:30) timezone
    const formatTimeForHikvision = (dateStr?: string, isEnd = false): string => {
      if (!dateStr || dateStr.trim() === '') {
        if (isEnd) {
          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dd = String(now.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}T23:59:59+05:30`;
        } else {
          // Wide historical default starting from 2000 to catch all prior device events
          return `2000-01-01T00:00:00+05:30`;
        }
      }
      if (dateStr.includes('T')) {
        return dateStr;
      }
      return isEnd ? `${dateStr}T23:59:59+05:30` : `${dateStr}T00:00:00+05:30`;
    };

    const startStr = formatTimeForHikvision(startDate, false);
    const endStr = formatTimeForHikvision(endDate, true);

    const maxResults = 200;
    const searchID = `lankahr-${Date.now()}`;
    const allEvents: HikvisionEventLog[] = [];
    const eventSerialSet = new Set<string>();

    console.log(`\n=================== HIKVISION DIAGNOSTIC QUERY START ===================`);
    console.log(`[Hikvision Diagnostic] Query Start Time: ${queryStartTime}`);
    console.log(`[Hikvision Diagnostic] Date Filter Range: ${startStr} ---> ${endStr}`);
    console.log(`[Hikvision Diagnostic] Search ID: ${searchID}, Max Batch Size: ${maxResults}`);

    // 1. Try JSON Paginated Query
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
        const res = await this.executeWithAuth('POST', '/ISAPI/AccessControl/AcsEvent?format=json', jsonPayload);
        if (res.data.trim().startsWith('{')) {
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
          matches.forEach((item: any) => {
            const empNo = item.employeeNoString || 
                          (item.employeeNo !== undefined && item.employeeNo !== null ? String(item.employeeNo) : undefined) || 
                          item.userNo ||
                          item.id ||
                          item.cardNo;
            if (empNo) {
              let verifyMode: 'FINGERPRINT' | 'FACE' | 'CARD' | 'PASSWORD' = 'FINGERPRINT';
              if (item.currentVerifyMode === 'face' || item.minor === 76) verifyMode = 'FACE';
              else if (item.currentVerifyMode === 'card' || item.minor === 1) verifyMode = 'CARD';
              else if (item.currentVerifyMode === 'pwd' || item.minor === 77) verifyMode = 'PASSWORD';

              let direction: 'IN' | 'OUT' | 'AUTO' = 'AUTO';
              const rawStatus = String(item.attendanceStatus || '').toLowerCase().trim();
              if (rawStatus === 'checkin' || item.type === 0 || rawStatus === 'in') direction = 'IN';
              else if (rawStatus === 'checkout' || item.type === 1 || rawStatus === 'out') direction = 'OUT';

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
                  direction,
                  attendanceStatus: item.attendanceStatus
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

          // Advance position by returned count
          const returnedRecords = matches.length;
          const prevPosition = position;
          position += returnedRecords;

          // Stop pagination ONLY when totalMatches is met, position does not advance, or max pages reached
          // Do NOT stop simply because returnedRecords < maxResults
          if (totalMatches > 0 && position >= totalMatches) {
            console.log(`[Hikvision Diagnostic] Reached totalMatches (${position}/${totalMatches}). Ending attendance pagination.`);
            hasMore = false;
          } else if (position <= prevPosition) {
            console.warn(`[Hikvision Diagnostic] Position did not advance (${position} <= ${prevPosition}). Ending pagination.`);
            hasMore = false;
          } else if (batchIndex >= MAX_PAGES) {
            console.warn(`[Hikvision Diagnostic] Reached MAX_PAGES (${MAX_PAGES}) limit. Ending pagination.`);
            hasMore = false;
          }
        } else {
          // returnedRecords === 0
          console.log(`[Hikvision Diagnostic] Batch #${batchIndex}: 0 records returned. Ending attendance pagination.`);
          hasMore = false;
        }
      } catch (err: any) {
        console.error(`[Hikvision Diagnostic] JSON Query Error at position ${position}: ${err?.message}`);
        if (!jsonSuccess) {
          break;
        }
        hasMore = false;
      }
    }

    if (jsonSuccess && allEvents.length > 0) {
      const queryEndTime = new Date().toISOString();
      const uniqueUserIds = Array.from(new Set(allEvents.map(e => e.employeeNo)));
      const sampleTimes = allEvents.slice(0, 5).map(e => `${e.employeeNo}@${e.time}`);

      console.log(`[Hikvision Diagnostic] Query End Time: ${queryEndTime}`);
      console.log(`[Hikvision Diagnostic] Total Unique Events Fetched: ${allEvents.length}`);
      console.log(`[Hikvision Diagnostic] Unique Employee/User IDs Found (${uniqueUserIds.length}): ${uniqueUserIds.join(', ')}`);
      console.log(`[Hikvision Diagnostic] Sample Event Timestamps: ${sampleTimes.join(' | ')}`);
      console.log(`=================== HIKVISION DIAGNOSTIC QUERY END ===================\n`);

      return allEvents;
    }

    // 2. XML Fallback Paginated Query
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
        const resXml = await this.executeWithAuth('POST', '/ISAPI/AccessControl/AcsEvent', xmlPayload);
        const xml = resXml.data;

        const eventBlocks = xml.match(/<AcsEvent>[\s\S]*?<\/AcsEvent>/gi) || [];
        console.log(`[Hikvision Diagnostic] XML Batch #${batchIndex}: ${eventBlocks.length} AcsEvent blocks parsed.`);

        if (eventBlocks.length === 0) {
          hasMore = false;
          break;
        }

        const getTag = (block: string, tag: string): string => {
          const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
          return match ? match[1].trim() : '';
        };

        let batchFilteredOut = 0;
        eventBlocks.forEach(block => {
          const empNo = getTag(block, 'employeeNoString') || getTag(block, 'employeeNo') || getTag(block, 'userNo') || getTag(block, 'cardNo');
          const time = getTag(block, 'time');
          const minor = parseInt(getTag(block, 'minor') || '0', 10);
          const major = parseInt(getTag(block, 'major') || '5', 10);
          const serialNo = getTag(block, 'serialNo') || `${time}_${empNo}`;
          const attStatus = getTag(block, 'attendanceStatus');
          const typeVal = getTag(block, 'type');

          if (empNo && time) {
            let verifyMode: 'FINGERPRINT' | 'FACE' | 'CARD' | 'PASSWORD' = 'FINGERPRINT';
            if (minor === 76) verifyMode = 'FACE';
            else if (minor === 1) verifyMode = 'CARD';
            else if (minor === 77) verifyMode = 'PASSWORD';

            let direction: 'IN' | 'OUT' | 'AUTO' = 'AUTO';
            const rawStatus = (attStatus || '').toLowerCase().trim();
            if (rawStatus === 'checkin' || typeVal === '0' || rawStatus === 'in') direction = 'IN';
            else if (rawStatus === 'checkout' || typeVal === '1' || rawStatus === 'out') direction = 'OUT';

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
                direction,
                attendanceStatus: attStatus || undefined
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

        const totalMatches = parseInt(getTag(xml, 'totalMatches') || getTag(xml, 'numOfMatches') || '0', 10);
        const returnedRecords = eventBlocks.length;
        const prevPosition = position;
        position += returnedRecords;

        if (totalMatches > 0 && position >= totalMatches) {
          console.log(`[Hikvision Diagnostic] XML reached totalMatches (${position}/${totalMatches}). Ending attendance pagination.`);
          hasMore = false;
        } else if (position <= prevPosition) {
          console.warn(`[Hikvision Diagnostic] XML position did not advance (${position} <= ${prevPosition}). Ending pagination.`);
          hasMore = false;
        } else if (batchIndex >= MAX_PAGES) {
          console.warn(`[Hikvision Diagnostic] XML reached MAX_PAGES (${MAX_PAGES}) limit. Ending pagination.`);
          hasMore = false;
        }
      } catch (err: any) {
        console.error(`[Hikvision Diagnostic] XML Query Error at position ${position}: ${err?.message}`);
        hasMore = false;
      }
    }

    const queryEndTime = new Date().toISOString();
    const uniqueUserIds = Array.from(new Set(allEvents.map(e => e.employeeNo)));
    console.log(`[Hikvision Diagnostic] XML Query End Time: ${queryEndTime}`);
    console.log(`[Hikvision Diagnostic] Total Unique Events Fetched via XML: ${allEvents.length}`);
    console.log(`[Hikvision Diagnostic] Employee/User IDs Found (${uniqueUserIds.length}): ${uniqueUserIds.join(', ')}`);
    console.log(`=================== HIKVISION DIAGNOSTIC QUERY END ===================\n`);

    return allEvents;
  }

  /**
   * Retrieves registered user / person records from Hikvision terminal using ISAPI.
   * This retrieves user metadata (employeeNo, name, userType, cardNo) without downloading biometric templates.
   */
  public async getUserRecords(): Promise<HikvisionUserRecord[]> {
    console.log(`\n=================== HIKVISION USER SEARCH QUERY START ===================`);
    console.log(`[Hikvision User Import] Target Device: ${this.config.ipAddress}:${this.config.port}`);
    console.log(`[Hikvision User Import] Initiating ISAPI Person / User Retrieval...`);

    const usersMap = new Map<string, HikvisionUserRecord>();
    const searchID = `lankahr-usr-${Date.now()}`;
    const maxResults = 30;
    let position = 0;
    let hasMore = true;
    let jsonSuccess = false;
    let batchIndex = 0;
    let isUnsupported = false;

    // 1. JSON Search endpoint: POST /ISAPI/AccessControl/UserInfo/Search?format=json
    while (hasMore) {
      batchIndex++;
      const jsonPayload = JSON.stringify({
        UserInfoSearchCond: {
          searchID,
          searchResultPosition: position,
          maxResults
        }
      });

      console.log(`[Hikvision User Import] JSON Batch #${batchIndex}: searchResultPosition=${position}, maxResults=${maxResults}`);

      try {
        const res = await this.executeWithAuth('POST', '/ISAPI/AccessControl/UserInfo/Search?format=json', jsonPayload);
        const dataStr = res.data.trim();

        if (res.statusCode === 404 || dataStr.includes('notSupport') || dataStr.includes('badParameters')) {
          console.warn(`[Hikvision User Import] JSON endpoint returned status ${res.statusCode} or unsupported response.`);
          break;
        }

        let parsed: any;
        try {
          parsed = JSON.parse(dataStr);
        } catch {
          console.warn(`[Hikvision User Import] Failed to parse JSON response on batch #${batchIndex}.`);
          break;
        }

        const searchObj = parsed.UserInfoSearch || parsed;
        const matches = searchObj.UserInfo || searchObj.userInfo || [];
        const userList: any[] = Array.isArray(matches) ? matches : [matches];
        const totalMatches = searchObj.totalMatches || searchObj.numOfMatches;

        console.log(`[Hikvision User Import] JSON Batch #${batchIndex}: Received ${userList.length} user records (Total reported: ${totalMatches || 'unknown'}).`);

        if (userList.length > 0) {
          jsonSuccess = true;
          userList.forEach(u => {
            if (!u) return;
            const empNo = String(u.employeeNoString || u.employeeNo || u.userNo || u.id || '').trim();
            if (empNo) {
              const name = String(u.name || '').trim();
              const userType = String(u.userType || 'normal');
              const gender = String(u.gender || '');
              const cardNo = u.cardNo ? String(u.cardNo).trim() : (Array.isArray(u.cards) && u.cards[0] ? String(u.cards[0]).trim() : undefined);
              const numOfCard = Number(u.numOfCard || 0);
              const numOfFP = Number(u.numOfFP || 0);
              const numOfFace = Number(u.numOfFace || 0);
              const userVerifyMode = u.userVerifyMode ? String(u.userVerifyMode) : undefined;
              const doorRight = u.doorRight ? String(u.doorRight) : undefined;
              const validBegin = u.Valid?.beginTime;
              const validEnd = u.Valid?.endTime;

              if (!usersMap.has(empNo)) {
                usersMap.set(empNo, {
                  employeeNo: empNo,
                  name: name || undefined,
                  userType,
                  gender: gender || undefined,
                  cardNo,
                  numOfCard,
                  numOfFP,
                  numOfFace,
                  userVerifyMode,
                  doorRight,
                  validBegin,
                  validEnd
                });
              }
            }
          });

          // Paging advancement: advance position by returned count
          const returnedRecords = userList.length;
          const prevPosition = position;
          position += returnedRecords;

          // Stop pagination ONLY when totalMatches is met, position does not advance, or max pages reached
          // Do NOT stop simply because returnedRecords < maxResults
          if (totalMatches > 0 && position >= totalMatches) {
            console.log(`[Hikvision User Import] Reached totalMatches (${position}/${totalMatches}). Ending pagination.`);
            hasMore = false;
          } else if (position <= prevPosition) {
            console.warn(`[Hikvision User Import] Position did not advance (${position} <= ${prevPosition}). Ending pagination.`);
            hasMore = false;
          } else if (batchIndex >= MAX_PAGES) {
            console.warn(`[Hikvision User Import] Reached MAX_PAGES (${MAX_PAGES}) limit. Ending pagination.`);
            hasMore = false;
          }
        } else {
          // returnedRecords === 0
          console.log(`[Hikvision User Import] 0 records returned. Ending pagination.`);
          hasMore = false;
        }
      } catch (err: any) {
        console.error(`[Hikvision User Import] JSON Query Error: ${err?.message}`);
        if (err?.message?.includes('404') || err?.message?.includes('notSupport')) {
          isUnsupported = true;
        }
        break;
      }
    }

    if (jsonSuccess && usersMap.size > 0) {
      const result = Array.from(usersMap.values());
      console.log(`[Hikvision User Import] Successfully retrieved ${result.length} users via ISAPI JSON.`);
      console.log(`=================== HIKVISION USER SEARCH QUERY END ===================\n`);
      return result;
    }

    // 2. XML Fallback Search endpoint: POST /ISAPI/AccessControl/UserInfo/Search
    console.log(`[Hikvision User Import] Attempting XML ISAPI UserInfo Fallback Query...`);
    position = 0;
    hasMore = true;
    batchIndex = 0;

    while (hasMore) {
      batchIndex++;
      const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
<UserInfoSearchCond xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
  <searchID>${searchID}</searchID>
  <searchResultPosition>${position}</searchResultPosition>
  <maxResults>${maxResults}</maxResults>
</UserInfoSearchCond>`;

      console.log(`[Hikvision User Import] XML Batch #${batchIndex}: searchResultPosition=${position}, maxResults=${maxResults}`);

      try {
        const resXml = await this.executeWithAuth('POST', '/ISAPI/AccessControl/UserInfo/Search', xmlPayload);
        const xml = resXml.data;

        if (resXml.statusCode === 404 || xml.includes('notSupport')) {
          console.warn(`[Hikvision User Import] XML endpoint returned 404 or notSupport.`);
          isUnsupported = true;
          break;
        }

        const userBlocks = xml.match(/<UserInfo>[\s\S]*?<\/UserInfo>/gi) || [];
        console.log(`[Hikvision User Import] XML Batch #${batchIndex}: ${userBlocks.length} UserInfo blocks parsed.`);

        if (userBlocks.length === 0) {
          hasMore = false;
          break;
        }

        const getTag = (block: string, tag: string): string => {
          const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
          return match ? match[1].trim() : '';
        };

        userBlocks.forEach(block => {
          const empNo = getTag(block, 'employeeNoString') || getTag(block, 'employeeNo') || getTag(block, 'userNo');
          if (empNo) {
            const name = getTag(block, 'name');
            const userType = getTag(block, 'userType') || 'normal';
            const gender = getTag(block, 'gender');
            const cardNo = getTag(block, 'cardNo');
            const numOfCard = parseInt(getTag(block, 'numOfCard') || '0', 10);
            const numOfFP = parseInt(getTag(block, 'numOfFP') || '0', 10);
            const numOfFace = parseInt(getTag(block, 'numOfFace') || '0', 10);

            if (!usersMap.has(empNo)) {
              usersMap.set(empNo, {
                employeeNo: empNo.trim(),
                name: name ? name.trim() : undefined,
                userType,
                gender: gender ? gender.trim() : undefined,
                cardNo: cardNo ? cardNo.trim() : undefined,
                numOfCard,
                numOfFP,
                numOfFace
              });
            }
          }
        });

        const totalMatches = parseInt(getTag(xml, 'totalMatches') || getTag(xml, 'numOfMatches') || '0', 10);
        const returnedRecords = userBlocks.length;
        const prevPosition = position;
        position += returnedRecords;

        if (totalMatches > 0 && position >= totalMatches) {
          console.log(`[Hikvision User Import] XML reached totalMatches (${position}/${totalMatches}). Ending pagination.`);
          hasMore = false;
        } else if (position <= prevPosition) {
          console.warn(`[Hikvision User Import] XML position did not advance (${position} <= ${prevPosition}). Ending pagination.`);
          hasMore = false;
        } else if (batchIndex >= MAX_PAGES) {
          console.warn(`[Hikvision User Import] XML reached MAX_PAGES (${MAX_PAGES}) limit. Ending pagination.`);
          hasMore = false;
        }
      } catch (err: any) {
        console.error(`[Hikvision User Import] XML Query Error: ${err?.message}`);
        if (err?.message?.includes('404') || err?.message?.includes('notSupport')) {
          isUnsupported = true;
        }
        hasMore = false;
      }
    }

    if (usersMap.size > 0) {
      const result = Array.from(usersMap.values());
      console.log(`[Hikvision User Import] Successfully retrieved ${result.length} users via ISAPI XML.`);
      console.log(`=================== HIKVISION USER SEARCH QUERY END ===================\n`);
      return result;
    }

    // 3. Check if device returned not support on all endpoints
    if (isUnsupported || usersMap.size === 0) {
      console.warn(`[Hikvision User Import] Device does not support UserInfo ISAPI Search or returned no users.`);
      if (isUnsupported) {
        throw new Error('Hikvision user synchronization is not supported by this device/API.');
      }
    }

    console.log(`[Hikvision User Import] No registered user records found on terminal.`);
    console.log(`=================== HIKVISION USER SEARCH QUERY END ===================\n`);
    return [];
  }
}
