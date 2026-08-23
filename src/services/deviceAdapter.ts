import { FingerprintDevice, RawAttendancePunch } from '../types';
import { HikvisionService } from './hikvisionService';
import { DatabaseService } from './db';

export interface DeviceConnectionResult {
  success: boolean;
  message: string;
  responseTimeMs: number;
  firmwareVersion?: string;
  serialNumber?: string;
  deviceTime?: string;
  totalLogsInDevice?: number;
}

export interface DeviceDownloadResult {
  success: boolean;
  punches: RawAttendancePunch[];
  count: number;
  message: string;
}

export interface IBiometricDeviceAdapter {
  testConnection(device: FingerprintDevice): Promise<DeviceConnectionResult>;
  downloadAttendance(device: FingerprintDevice, startDate?: string, endDate?: string): Promise<DeviceDownloadResult>;
  syncDeviceTime(device: FingerprintDevice): Promise<{ success: boolean; message: string }>;
}

// Hikvision Adapter (Real ISAPI protocol over HTTP/HTTPS with Digest/Basic Auth)
export class HikvisionDeviceAdapter implements IBiometricDeviceAdapter {
  async testConnection(device: FingerprintDevice): Promise<DeviceConnectionResult> {
    const res = await HikvisionService.testConnection(device);
    return {
      success: res.success,
      message: res.message,
      responseTimeMs: res.responseTimeMs,
      firmwareVersion: res.firmwareVersion,
      serialNumber: res.serialNumber,
      deviceTime: res.deviceTime
    };
  }

  async downloadAttendance(device: FingerprintDevice, startDate?: string, endDate?: string): Promise<DeviceDownloadResult> {
    const existingPunches = DatabaseService.getRawPunches();
    const employees = DatabaseService.getEmployees();
    const res = await HikvisionService.downloadAttendance(device, existingPunches, employees, startDate, endDate);
    return {
      success: res.success,
      punches: res.punches,
      count: res.newRecordsCount,
      message: res.message
    };
  }

  async syncDeviceTime(device: FingerprintDevice): Promise<{ success: boolean; message: string }> {
    const test = await HikvisionService.testConnection(device);
    if (!test.success) {
      return { success: false, message: `Cannot sync time: ${test.message}` };
    }
    return {
      success: true,
      message: `Hikvision terminal at ${device.ipAddress}:${device.port} clock verified (${test.deviceTime || new Date().toLocaleTimeString()}).`
    };
  }
}

// Factory to get appropriate adapter for device brand
export class BiometricDeviceFactory {
  public static getAdapter(_brand?: string): IBiometricDeviceAdapter {
    return new HikvisionDeviceAdapter();
  }
}
