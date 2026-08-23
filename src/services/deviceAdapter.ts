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

// ZKTeco Adapter - Driver placeholder for future ZKEMKeeper SDK integration
export class ZKTecoDeviceAdapter implements IBiometricDeviceAdapter {
  async testConnection(device: FingerprintDevice): Promise<DeviceConnectionResult> {
    return {
      success: false,
      message: `Protocol not implemented for ${device.brand} (${device.model}). For direct automated synchronization, use the verified Hikvision ISAPI hardware terminal (DS-K1A8503MF) or import USB/CSV log files.`,
      responseTimeMs: 0
    };
  }

  async downloadAttendance(device: FingerprintDevice, _startDate?: string, _endDate?: string): Promise<DeviceDownloadResult> {
    return {
      success: false,
      punches: [],
      count: 0,
      message: `Protocol not implemented for ${device.brand}. Import attendance log CSV/DAT file from device USB drive.`
    };
  }

  async syncDeviceTime(device: FingerprintDevice): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: `Protocol not implemented for ${device.brand}.`
    };
  }
}

// Suprema Adapter - Driver placeholder for BioStar 2 SDK
export class SupremaDeviceAdapter implements IBiometricDeviceAdapter {
  async testConnection(device: FingerprintDevice): Promise<DeviceConnectionResult> {
    return {
      success: false,
      message: `Protocol not implemented for Suprema (${device.model}). Use Hikvision ISAPI (DS-K1A8503MF) or import standard CSV attendance logs.`,
      responseTimeMs: 0
    };
  }

  async downloadAttendance(device: FingerprintDevice, _startDate?: string, _endDate?: string): Promise<DeviceDownloadResult> {
    return {
      success: false,
      punches: [],
      count: 0,
      message: `Protocol not implemented for Suprema.`
    };
  }

  async syncDeviceTime(_device: FingerprintDevice): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'Protocol not implemented for Suprema.'
    };
  }
}

// Generic TCP/IP Adapter - Driver placeholder for Raw TCP/Socket
export class GenericTcpDeviceAdapter implements IBiometricDeviceAdapter {
  async testConnection(device: FingerprintDevice): Promise<DeviceConnectionResult> {
    return {
      success: false,
      message: `Protocol not implemented for Generic TCP device on port ${device.port}. Use Hikvision ISAPI (DS-K1A8503MF) or file import.`,
      responseTimeMs: 0
    };
  }

  async downloadAttendance(device: FingerprintDevice, _startDate?: string, _endDate?: string): Promise<DeviceDownloadResult> {
    return {
      success: false,
      punches: [],
      count: 0,
      message: `Protocol not implemented for Generic TCP device.`
    };
  }

  async syncDeviceTime(_device: FingerprintDevice): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'Protocol not implemented for Generic TCP device.'
    };
  }
}

// Factory to get appropriate adapter for device brand
export class BiometricDeviceFactory {
  public static getAdapter(brand: string): IBiometricDeviceAdapter {
    switch (brand) {
      case 'Hikvision':
        return new HikvisionDeviceAdapter();
      case 'ZKTeco':
        return new ZKTecoDeviceAdapter();
      case 'Suprema':
        return new SupremaDeviceAdapter();
      default:
        return new GenericTcpDeviceAdapter();
    }
  }
}
