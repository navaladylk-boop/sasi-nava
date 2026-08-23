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
    endDate?: string
  ): Promise<HikvisionSyncReport> {
    const config: HikvisionDeviceConfig = {
      ipAddress: device.ipAddress.trim(),
      port: Number(device.port) || 80,
      username: device.username || 'admin',
      password: device.password || '',
      timeoutMs: 8000,
      useHttps: device.port === 443
    };

    let downloadResponse: HikvisionDownloadResponse;

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

    // Process and prevent duplicates
    const existingKeys = new Set(
      existingPunches.map(p => `${p.deviceId}_${p.deviceUserId}_${p.punchTimestamp}_${p.punchType}`)
    );

    // Build employee lookup maps for mapping Hikvision Person ID -> HRM Employee
    const empByBiometricId = new Map<string, Employee>();
    const empByCode = new Map<string, Employee>();
    employees.forEach(emp => {
      if (emp.fingerprintUserId) {
        empByBiometricId.set(emp.fingerprintUserId.trim().toLowerCase(), emp);
      }
      if (emp.employeeCode) {
        empByCode.set(emp.employeeCode.trim().toLowerCase(), emp);
      }
    });

    const newPunches: RawAttendancePunch[] = [];
    let duplicateCount = 0;
    let unmappedCount = 0;

    downloadResponse.events.forEach(evt => {
      const rawEmpId = String(evt.employeeNo || '').trim();
      if (!rawEmpId) return;

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

      // Unique record key for duplicate prevention
      const recordKey = `${device.id}_${rawEmpId}_${punchDate}T${punchTime}Z_${punchType}`;
      if (existingKeys.has(recordKey)) {
        duplicateCount++;
        return;
      }

      // Match employee
      const matchedEmp =
        empByBiometricId.get(rawEmpId.toLowerCase()) ||
        empByCode.get(rawEmpId.toLowerCase()) ||
        empByCode.get(`emp-${rawEmpId.toLowerCase()}`);

      if (!matchedEmp) {
        unmappedCount++;
      }

      const punchRecord: RawAttendancePunch = {
        id: `hk-punch-${device.id}-${evt.serialNo || Date.now()}-${newPunches.length + 1}`,
        deviceId: device.id,
        deviceName: device.name,
        deviceUserId: rawEmpId,
        employeeId: matchedEmp ? matchedEmp.id : undefined,
        punchTimestamp: `${punchDate}T${punchTime}Z`,
        punchDate,
        punchTime,
        punchType,
        verificationMode: verifyMode,
        isProcessed: false,
        createdAt: new Date().toISOString()
      };

      existingKeys.add(recordKey);
      newPunches.push(punchRecord);
    });

    return {
      success: true,
      message: `Downloaded ${downloadResponse.events.length} records. (${newPunches.length} new, ${duplicateCount} duplicates skipped, ${unmappedCount} unmapped).`,
      totalFetched: downloadResponse.events.length,
      newRecordsCount: newPunches.length,
      duplicateRecordsCount: duplicateCount,
      unmappedCount,
      punches: newPunches
    };
  }
}
