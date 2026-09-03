import { FingerprintDevice, RawAttendancePunch, Employee } from '../types';
import {
  HikvisionDeviceConfig,
  HikvisionDeviceTestResult,
  HikvisionDownloadResponse,
  HikvisionUserRecord,
  HikvisionUserSearchResponse
} from '../types/electron';

export interface HikvisionSyncReport {
  success: boolean;
  message: string;
  totalFetched: number;
  newRecordsCount: number;
  duplicateRecordsCount: number;
  unmappedCount: number;
  punches: RawAttendancePunch[];
  deviceInfo?: {
    model?: string;
    serialNumber?: string;
    firmwareVersion?: string;
    deviceName?: string;
    deviceTime?: string;
  };
}

export interface HikvisionUserImportPreviewItem {
  hikvisionPersonId: string;
  name?: string;
  userType?: string;
  gender?: string;
  cardNo?: string;
  numOfFP?: number;
  numOfFace?: number;
  matchedEmployee?: Employee;
  matchType: 'EXACT_FINGERPRINT' | 'CODE_MATCH' | 'NORMALIZED_MATCH' | 'NONE';
  suggestedAction: 'CREATE_NEW' | 'UPDATE_MAPPING' | 'ALREADY_MAPPED';
  selected: boolean;
  targetEmployeeId?: string;
}

export interface HikvisionUserSyncAnalysis {
  totalUsersFound: number;
  newUsersCount: number;
  existingUsersCount: number;
  alreadyMappedCount: number;
  unmappedCount: number;
  previewList: HikvisionUserImportPreviewItem[];
}

export function normalizeEmployeeId(idStr?: string | number): string {
  if (idStr === undefined || idStr === null) return '';
  const str = String(idStr).trim().toLowerCase();
  // Remove leading zeros and optional 'emp-' or 'emp_' prefix for flexible matching
  return str.replace(/^emp[-_]?/, '').replace(/^0+/, '');
}

export function parseHikvisionTimestamp(rawTime: string): {
  punchDate: string;
  punchTime: string;
  punchTimestamp: string;
} {
  const timeStr = String(rawTime || '').trim();
  let punchDate = '';
  let punchTime = '';

  // Extract local date (YYYY-MM-DD) and local time (HH:mm:ss) from the raw string directly
  // This preserves the exact local time and prevents incorrect UTC shifts
  if (timeStr.includes('T')) {
    const parts = timeStr.split('T');
    punchDate = parts[0];
    punchTime = parts[1].substring(0, 8);
  } else if (timeStr.includes(' ')) {
    const parts = timeStr.split(' ');
    punchDate = parts[0];
    punchTime = parts[1].substring(0, 8);
  } else {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      punchDate = d.toISOString().substring(0, 10);
      punchTime = d.toLocaleTimeString('en-GB', { hour12: false });
    } else {
      punchDate = timeStr.substring(0, 10);
      punchTime = '08:00:00';
    }
  }

  // Proper timezone-aware UTC conversion without ever appending "Z" manually to local time
  let punchTimestamp = timeStr;
  const parsed = new Date(timeStr);
  if (!isNaN(parsed.getTime())) {
    // If the original timestamp includes a timezone offset like +05:30, toISOString() converts accurately to UTC
    punchTimestamp = parsed.toISOString();
  } else {
    // If no timezone is present, treat as Sri Lanka local time (+05:30) and convert properly
    const slDate = new Date(`${punchDate}T${punchTime}+05:30`);
    punchTimestamp = !isNaN(slDate.getTime()) ? slDate.toISOString() : `${punchDate}T${punchTime}+05:30`;
  }

  return { punchDate, punchTime, punchTimestamp };
}

export class HikvisionService {
  /**
   * Test physical connection to Hikvision biometric terminal (e.g. DS-K1A8503MF at 192.168.1.201:80)
   */
  public static async testConnection(device: FingerprintDevice): Promise<HikvisionDeviceTestResult> {
    const config: HikvisionDeviceConfig = {
      ipAddress: device.ipAddress.trim(),
      port: Number(device.port) || 80,
      username: device.username || 'admin',
      password: device.password || '',
      timeoutMs: 5000,
      useHttps: device.port === 443
    };

    // 1. Electron Desktop Native TCP/HTTP ISAPI Client
    if (typeof window !== 'undefined' && window.electronAPI?.testHikvisionDevice) {
      try {
        const result = await window.electronAPI.testHikvisionDevice(config);
        return result;
      } catch (err: any) {
        return {
          success: false,
          message: `CONNECTION FAILED: ${err.message || 'Device unreachable'}`,
          responseTimeMs: 0
        };
      }
    }

    // 2. Web browser direct network attempt with strict honest fallback
    const startTime = Date.now();
    const isPrivateIp = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(device.ipAddress);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const url = `http://${device.ipAddress}:${device.port}/ISAPI/System/deviceInfo`;
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, text/xml, */*'
        }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return {
          success: true,
          message: `CONNECTED: Successfully verified Hikvision device at ${device.ipAddress}:${device.port}`,
          responseTimeMs: Date.now() - startTime,
          model: device.model || 'DS-K1A8503MF'
        };
      } else if (res.status === 401) {
        return {
          success: false,
          message: 'AUTHENTICATION FAILED: HTTP 401 Unauthorized. Incorrect device password or username.',
          responseTimeMs: Date.now() - startTime
        };
      } else {
        return {
          success: false,
          message: `CONNECTION FAILED: Device responded with HTTP status ${res.status}`,
          responseTimeMs: Date.now() - startTime
        };
      }
    } catch (err: any) {
      const responseTimeMs = Date.now() - startTime;
      if (isPrivateIp) {
        return {
          success: false,
          message: `CONNECTION FAILED: Host ${device.ipAddress}:${device.port} unreachable from web preview. To connect to physical LAN device, run the desktop application (npm run electron:dev or LankaHR.exe) on the Windows PC.`,
          responseTimeMs
        };
      }
      return {
        success: false,
        message: `CONNECTION FAILED: ${err.message || 'Connection timeout or device offline.'}`,
        responseTimeMs
      };
    }
  }

  /**
   * Download and parse real attendance punch events from Hikvision terminal
   */
  public static async downloadAttendance(
    device: FingerprintDevice,
    existingPunches: RawAttendancePunch[],
    employees: Employee[],
    startDate?: string,
    endDate?: string,
    onProgress?: (progressInfo: { totalFetched: number; statusText: string }) => void
  ): Promise<HikvisionSyncReport> {
    const config: HikvisionDeviceConfig = {
      ipAddress: device.ipAddress.trim(),
      port: Number(device.port) || 80,
      username: device.username || 'admin',
      password: device.password || '',
      timeoutMs: 15000,
      useHttps: device.port === 443
    };

    let downloadResponse: HikvisionDownloadResponse;

    let cleanupProgress: (() => void) | undefined;
    if (typeof window !== 'undefined' && window.electronAPI?.onHikvisionProgress) {
      cleanupProgress = window.electronAPI.onHikvisionProgress((p) => {
        if (onProgress) {
          onProgress({
            totalFetched: p.totalFetched,
            statusText: `Downloading Hikvision attendance...\nDownloaded: ${p.totalFetched.toLocaleString()} records`
          });
        }
      });
    }

    try {
      if (typeof window !== 'undefined' && window.electronAPI?.downloadHikvisionAttendance) {
        downloadResponse = await window.electronAPI.downloadHikvisionAttendance(config, startDate, endDate);
      } else {
        // In browser preview mode, attempt real fetch or return honest diagnostic
        return {
          success: false,
          message: `BLOCKED — PHYSICAL DEVICE TEST REQUIRED: Device ${device.ipAddress}:${device.port} is on the local physical network. Please run in Windows Desktop Mode (npm run electron:dev) to pull punches directly.`,
          totalFetched: 0,
          newRecordsCount: 0,
          duplicateRecordsCount: 0,
          unmappedCount: 0,
          punches: []
        };
      }
    } finally {
      if (cleanupProgress) {
        cleanupProgress();
      }
    }

    if (!downloadResponse.success) {
      return {
        success: false,
        message: downloadResponse.message || 'Failed to download attendance events from device.',
        totalFetched: 0,
        newRecordsCount: 0,
        duplicateRecordsCount: 0,
        unmappedCount: 0,
        punches: []
      };
    }

    // Build employee lookup maps for mapping Hikvision Person ID -> HRM Employee using normalized keys
    const empLookupMap = new Map<string, Employee>();
    employees.forEach(emp => {
      if (emp.fingerprintUserId) {
        empLookupMap.set(normalizeEmployeeId(emp.fingerprintUserId), emp);
      }
      if (emp.employeeCode) {
        empLookupMap.set(normalizeEmployeeId(emp.employeeCode), emp);
      }
      if (emp.id) {
        empLookupMap.set(normalizeEmployeeId(emp.id), emp);
      }
    });

    // Map existing punches for fast lookup, deduplication and re-linking
    const existingPunchesMap = new Map<string, RawAttendancePunch>();
    existingPunches.forEach(p => {
      const key1 = `${p.deviceId}_${normalizeEmployeeId(p.deviceUserId)}_${p.punchTimestamp}_${p.punchType}`;
      const key2 = `${p.deviceId}_${normalizeEmployeeId(p.deviceUserId)}_${p.punchDate}_${p.punchTime}_${p.punchType}`;
      existingPunchesMap.set(key1, p);
      existingPunchesMap.set(key2, p);
    });

    const newOrUpdatedPunches: RawAttendancePunch[] = [];
    let newRecordsCount = 0;
    let relinkedCount = 0;
    let duplicateCount = 0;
    let unmappedCount = 0;
    const userIdsFound = new Set<string>();
    const timestampsFound = new Set<string>();
    const filterReasons: string[] = [];

    downloadResponse.events.forEach(evt => {
      const rawEmpId = String(evt.employeeNo || '').trim();
      if (!rawEmpId) {
        filterReasons.push(`Event at ${evt.time} missing employeeNo`);
        return;
      }

      userIdsFound.add(rawEmpId);
      timestampsFound.add(evt.time);

      // Extract local Date & Time and proper timezone-aware timestamp
      const { punchDate, punchTime, punchTimestamp } = parseHikvisionTimestamp(evt.time);

      // Determine punch type (IN / OUT / BREAK_OUT / BREAK_IN)
      // When Hikvision provides attendanceStatus, map directly without guessing
      let punchType: 'IN' | 'OUT' | 'BREAK_OUT' | 'BREAK_IN' | 'AUTO' = 'AUTO';
      const rawStatus = String(evt.attendanceStatus || evt.direction || '').toLowerCase().trim();
      if (rawStatus === 'checkin' || rawStatus === 'in' || evt.direction === 'IN') {
        punchType = 'IN';
      } else if (rawStatus === 'checkout' || rawStatus === 'out' || evt.direction === 'OUT') {
        punchType = 'OUT';
      } else if (rawStatus === 'breakout' || rawStatus === 'break_out') {
        punchType = 'BREAK_OUT';
      } else if (rawStatus === 'breakin' || rawStatus === 'break_in') {
        punchType = 'BREAK_IN';
      } else {
        // Fallback only when device does not provide a usable attendance status
        const hour = parseInt(punchTime.substring(0, 2), 10) || 0;
        punchType = hour >= 13 ? 'OUT' : 'IN';
      }

      // Verification mode
      let verifyMode: 'FINGERPRINT' | 'FACE' | 'CARD' | 'PASSWORD' = 'FINGERPRINT';
      if (evt.verifyMode === 'FACE' || evt.minor === 76) verifyMode = 'FACE';
      else if (evt.verifyMode === 'CARD' || evt.minor === 1) verifyMode = 'CARD';
      else if (evt.verifyMode === 'PASSWORD' || evt.minor === 77) verifyMode = 'PASSWORD';

      const normUserKey = normalizeEmployeeId(rawEmpId);
      const recordKey1 = `${device.id}_${normUserKey}_${punchTimestamp}_${punchType}`;
      const recordKey2 = `${device.id}_${normUserKey}_${punchDate}_${punchTime}_${punchType}`;

      // Flexible employee matching (fingerprintUserId / employeeCode / id)
      const matchedEmp = empLookupMap.get(normUserKey);

      if (!matchedEmp) {
        unmappedCount++;
      }

      const existingPunch = existingPunchesMap.get(recordKey1) || existingPunchesMap.get(recordKey2);

      if (existingPunch) {
        // If punch exists in SQLite without employeeId and now matchedEmp exists, re-link it!
        if (!existingPunch.employeeId && matchedEmp) {
          existingPunch.employeeId = matchedEmp.id;
          relinkedCount++;
          newOrUpdatedPunches.push(existingPunch);
          console.log(`[Hikvision Diagnostic] Re-linked historical punch for deviceUserId ${rawEmpId} to Employee ${matchedEmp.employeeCode} (${matchedEmp.fullName}) on ${punchDate} ${punchTime}`);
        } else {
          duplicateCount++;
          filterReasons.push(`Duplicate punch for ${rawEmpId} at ${punchDate} ${punchTime} (${punchType})`);
        }
        return;
      }

      // Create new punch record
      const punchRecord: RawAttendancePunch = {
        id: `hk-punch-${device.id}-${evt.serialNo || Date.now()}-${newOrUpdatedPunches.length + 1}`,
        deviceId: device.id,
        deviceName: device.name,
        deviceUserId: rawEmpId,
        employeeId: matchedEmp ? matchedEmp.id : undefined,
        punchTimestamp,
        punchDate,
        punchTime,
        punchType,
        verificationMode: verifyMode,
        isProcessed: false,
        createdAt: new Date().toISOString()
      };

      existingPunchesMap.set(recordKey1, punchRecord);
      existingPunchesMap.set(recordKey2, punchRecord);
      newOrUpdatedPunches.push(punchRecord);
      newRecordsCount++;
    });

    const totalDownloaded = downloadResponse.events.length;

    console.log(`\n[Hikvision Diagnostic] Attendance Processing Complete:`);
    console.log(`- Total Hikvision events fetched: ${totalDownloaded}`);
    console.log(`- New records imported: ${newRecordsCount}`);
    console.log(`- Historical records re-linked to employee: ${relinkedCount}`);
    console.log(`- Duplicate records skipped: ${duplicateCount}`);
    console.log(`- Unmapped employee events: ${unmappedCount}`);
    console.log(`- Unique User IDs in Hikvision logs: ${Array.from(userIdsFound).join(', ')}`);
    console.log(`- Filtered count & reasons summary: ${filterReasons.length} items skipped (duplicates or invalid timestamps)`);

    const finalSummaryMessage = `Attendance synchronization completed.

Total Hikvision events found: ${totalDownloaded.toLocaleString()}
New events imported: ${newRecordsCount.toLocaleString()}${relinkedCount > 0 ? `\nHistorical events re-linked: ${relinkedCount.toLocaleString()}` : ''}
Duplicate events skipped: ${duplicateCount.toLocaleString()}
Unmapped employee events: ${unmappedCount.toLocaleString()}`;

    return {
      success: true,
      message: finalSummaryMessage,
      totalFetched: totalDownloaded,
      newRecordsCount: newRecordsCount + relinkedCount,
      duplicateRecordsCount: duplicateCount,
      unmappedCount,
      punches: newOrUpdatedPunches
    };
  }

  /**
   * Fetch registered users / person records from Hikvision terminal.
   */
  public static async fetchHikvisionUsers(device: FingerprintDevice): Promise<HikvisionUserSearchResponse> {
    const config: HikvisionDeviceConfig = {
      ipAddress: device.ipAddress.trim(),
      port: Number(device.port) || 80,
      username: device.username || 'admin',
      password: device.password || '',
      timeoutMs: 10000,
      useHttps: device.port === 443
    };

    if (typeof window !== 'undefined' && window.electronAPI?.searchHikvisionUsers) {
      try {
        const res = await window.electronAPI.searchHikvisionUsers(config);
        return res;
      } catch (err: any) {
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
    }

    return {
      success: false,
      users: [],
      count: 0,
      isUnsupported: false,
      message: `BLOCKED — PHYSICAL DEVICE TEST REQUIRED: Device ${device.ipAddress}:${device.port} is on local physical network. Please run in Windows Desktop Mode (npm run electron:dev or LankaHR.exe) to fetch registered users.`
    };
  }

  /**
   * Analyze Hikvision users against existing LankaHR employees to determine:
   * - Already mapped employees
   * - Existing employees needing mapping updates
   * - New unmapped Hikvision users for preview
   */
  public static analyzeHikvisionUsers(
    hikvisionUsers: HikvisionUserRecord[],
    employees: Employee[]
  ): HikvisionUserSyncAnalysis {
    const exactFpMap = new Map<string, Employee>();
    const normFpMap = new Map<string, Employee>();
    const codeMap = new Map<string, Employee>();
    const normCodeMap = new Map<string, Employee>();
    const idMap = new Map<string, Employee>();

    employees.forEach(emp => {
      if (emp.fingerprintUserId) {
        exactFpMap.set(emp.fingerprintUserId.trim(), emp);
        normFpMap.set(normalizeEmployeeId(emp.fingerprintUserId), emp);
      }
      if (emp.employeeCode) {
        codeMap.set(emp.employeeCode.trim().toLowerCase(), emp);
        normCodeMap.set(normalizeEmployeeId(emp.employeeCode), emp);
      }
      if (emp.id) {
        idMap.set(emp.id, emp);
      }
    });

    const previewList: HikvisionUserImportPreviewItem[] = [];
    let alreadyMappedCount = 0;
    let existingUsersCount = 0;
    let newUsersCount = 0;

    hikvisionUsers.forEach(user => {
      const pId = String(user.employeeNo || '').trim();
      if (!pId) return;

      const normPId = normalizeEmployeeId(pId);

      // Check 1: Exact fingerprint user ID match
      const exactFpMatch = exactFpMap.get(pId);
      if (exactFpMatch) {
        alreadyMappedCount++;
        previewList.push({
          hikvisionPersonId: pId,
          name: user.name,
          userType: user.userType,
          gender: user.gender,
          cardNo: user.cardNo,
          numOfFP: user.numOfFP,
          numOfFace: user.numOfFace,
          matchedEmployee: exactFpMatch,
          matchType: 'EXACT_FINGERPRINT',
          suggestedAction: 'ALREADY_MAPPED',
          selected: false,
          targetEmployeeId: exactFpMatch.id
        });
        return;
      }

      // Check 2: Normalized fingerprint user ID match
      const normFpMatch = normFpMap.get(normPId);
      if (normFpMatch) {
        existingUsersCount++;
        previewList.push({
          hikvisionPersonId: pId,
          name: user.name,
          userType: user.userType,
          gender: user.gender,
          cardNo: user.cardNo,
          numOfFP: user.numOfFP,
          numOfFace: user.numOfFace,
          matchedEmployee: normFpMatch,
          matchType: 'NORMALIZED_MATCH',
          suggestedAction: 'UPDATE_MAPPING',
          selected: true,
          targetEmployeeId: normFpMatch.id
        });
        return;
      }

      // Check 3: Employee Code match (e.g. EMP001 with '001' or '1' or 'EMP001')
      const codeMatch = codeMap.get(pId.toLowerCase()) ||
        codeMap.get(`emp${pId.toLowerCase()}`) ||
        codeMap.get(`emp-${pId.toLowerCase()}`) ||
        normCodeMap.get(normPId);

      if (codeMatch) {
        existingUsersCount++;
        previewList.push({
          hikvisionPersonId: pId,
          name: user.name,
          userType: user.userType,
          gender: user.gender,
          cardNo: user.cardNo,
          numOfFP: user.numOfFP,
          numOfFace: user.numOfFace,
          matchedEmployee: codeMatch,
          matchType: 'CODE_MATCH',
          suggestedAction: 'UPDATE_MAPPING',
          selected: true,
          targetEmployeeId: codeMatch.id
        });
        return;
      }

      // Check 4: Unmapped new user
      newUsersCount++;
      previewList.push({
        hikvisionPersonId: pId,
        name: user.name,
        userType: user.userType,
        gender: user.gender,
        cardNo: user.cardNo,
        numOfFP: user.numOfFP,
        numOfFace: user.numOfFace,
        matchType: 'NONE',
        suggestedAction: 'CREATE_NEW',
        selected: true
      });
    });

    return {
      totalUsersFound: hikvisionUsers.length,
      newUsersCount,
      existingUsersCount,
      alreadyMappedCount,
      unmappedCount: newUsersCount,
      previewList
    };
  }
}
