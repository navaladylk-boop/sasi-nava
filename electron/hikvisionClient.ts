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

  // Download Attendance Event Records (ISAPI AcsEvent)
  public async getAttendanceEvents(startDate?: string, endDate?: string): Promise<HikvisionEventLog[]> {
    const now = new Date();
    const startStr = startDate ? `${startDate}T00:00:00+05:30` : `${now.toISOString().substring(0, 10)}T00:00:00+05:30`;
    const endStr = endDate ? `${endDate}T23:59:59+05:30` : `${now.toISOString().substring(0, 10)}T23:59:59+05:30`;

    // Try JSON query first
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
      const res = await this.executeWithAuth('POST', '/ISAPI/AccessControl/AcsEvent?format=json', jsonPayload);
      if (res.data.trim().startsWith('{')) {
        const json = JSON.parse(res.data);
        const matches = json.AcsEvent?.InfoList || json.InfoList || [];
        const events: HikvisionEventLog[] = [];

        matches.forEach((item: any) => {
          const empNo = item.employeeNoString || item.employeeNo || item.cardNo;
          if (empNo) {
            let verifyMode: 'FINGERPRINT' | 'FACE' | 'CARD' | 'PASSWORD' = 'FINGERPRINT';
            if (item.currentVerifyMode === 'face' || item.minor === 76) verifyMode = 'FACE';
            else if (item.currentVerifyMode === 'card' || item.minor === 1) verifyMode = 'CARD';

            // Determine IN / OUT from event or default
            let direction: 'IN' | 'OUT' | 'AUTO' = 'AUTO';
            if (item.attendanceStatus === 'checkIn' || item.type === 0) direction = 'IN';
            else if (item.attendanceStatus === 'checkOut' || item.type === 1) direction = 'OUT';

            events.push({
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
        return events;
      }
    } catch {
      // Fallback to XML AcsEvent query
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

    const resXml = await this.executeWithAuth('POST', '/ISAPI/AccessControl/AcsEvent', xmlPayload);
    const xml = resXml.data;
    const events: HikvisionEventLog[] = [];

    const eventBlocks = xml.match(/<AcsEvent>[\s\S]*?<\/AcsEvent>/gi) || [];
    const getTag = (block: string, tag: string): string => {
      const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return match ? match[1].trim() : '';
    };

    eventBlocks.forEach(block => {
      const empNo = getTag(block, 'employeeNoString') || getTag(block, 'cardNo') || getTag(block, 'employeeNo');
      const time = getTag(block, 'time');
      const minor = parseInt(getTag(block, 'minor') || '0', 10);
      const major = parseInt(getTag(block, 'major') || '5', 10);
      const serialNo = getTag(block, 'serialNo') || `${time}_${empNo}`;

      if (empNo && time) {
        let verifyMode = 'FINGERPRINT';
        if (minor === 76) verifyMode = 'FACE';
        if (minor === 1) verifyMode = 'CARD';

        events.push({
          serialNo,
          employeeNo: empNo.trim(),
          time,
          major,
          minor,
          verifyMode,
          direction: 'AUTO'
        });
      }
    });

    return events;
  }
}
