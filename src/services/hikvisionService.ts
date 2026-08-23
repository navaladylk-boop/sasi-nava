import { FingerprintDevice, RawAttendancePunch, Employee } from '../types';
import { HikvisionDeviceConfig, HikvisionDeviceTestResult, HikvisionDownloadResponse } from '../types/electron';

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

export function normalizeEmployeeId(idStr?: string | number): string {
  if (idStr === undefined || idStr === null) return '';
  const str = String(idStr).trim().toLowerCase();
  // Remove leading zeros and optional 'emp-' prefix for flexible matching
  return str.replace(/^emp-/, '').replace(/^0+/, '');
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

    // Map existing punches for fast lookup and re-linking
    const existingPunchesMap = new Map<string, RawAttendancePunch>();
    existingPunches.forEach(p => {
      const key = `${p.deviceId}_${normalizeEmployeeId(p.deviceUserId)}_${p.punchTimestamp}_${p.punchType}`;
      existingPunchesMap.set(key, p);
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

      // Extract ISO Date & Time
      let isoTime = evt.time;
      let punchDate = '';
      let punchTime = '';

      if (isoTime.includes('T')) {
        const parts = isoTime.split('T');
        punchDate = parts[0];
        punchTime = parts[1].substring(0, 8);
      } else {
        const d = new Date(isoTime);
        punchDate = !isNaN(d.getTime()) ? d.toISOString().substring(0, 10) : isoTime.substring(0, 10);
        punchTime = !isNaN(d.getTime()) ? d.toLocaleTimeString('en-GB') : '08:00:00';
      }

      // Determine punch type (IN / OUT / AUTO)
      let punchType: 'IN' | 'OUT' | 'BREAK_OUT' | 'BREAK_IN' | 'AUTO' = evt.direction || 'AUTO';
      if (punchType === 'AUTO') {
        const hour = parseInt(punchTime.substring(0, 2), 10) || 0;
        punchType = hour >= 13 ? 'OUT' : 'IN';
      }

      // Verification mode
      let verifyMode: 'FINGERPRINT' | 'FACE' | 'CARD' | 'PASSWORD' = 'FINGERPRINT';
      if (evt.verifyMode === 'FACE' || evt.minor === 76) verifyMode = 'FACE';
      else if (evt.verifyMode === 'CARD' || evt.minor === 1) verifyMode = 'CARD';
      else if (evt.verifyMode === 'PASSWORD' || evt.minor === 77) verifyMode = 'PASSWORD';

      const normUserKey = normalizeEmployeeId(rawEmpId);
      const punchTimestamp = `${punchDate}T${punchTime}Z`;
      const recordKey = `${device.id}_${normUserKey}_${punchTimestamp}_${punchType}`;

      // Flexible employee matching (fingerprintUserId / employeeCode / id)
      const matchedEmp = empLookupMap.get(normUserKey);

      if (!matchedEmp) {
        unmappedCount++;
      }

      const existingPunch = existingPunchesMap.get(recordKey);

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

      existingPunchesMap.set(recordKey, punchRecord);
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
}
