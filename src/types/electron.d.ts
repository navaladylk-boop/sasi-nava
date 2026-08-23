export interface HikvisionDeviceConfig {
  ipAddress: string;
  port: number;
  username?: string;
  password?: string;
  timeoutMs?: number;
  useHttps?: boolean;
}

export interface HikvisionDeviceTestResult {
  success: boolean;
  message: string;
  responseTimeMs: number;
  firmwareVersion?: string;
  serialNumber?: string;
  deviceName?: string;
  model?: string;
  deviceTime?: string;
}

export interface HikvisionDownloadResponse {
  success: boolean;
  events: Array<{
    serialNo?: number | string;
    employeeNo: string;
    time: string;
    major: number;
    minor: number;
    cardNo?: string;
    verifyMode?: string;
    direction?: 'IN' | 'OUT' | 'AUTO';
  }>;
  count: number;
  message: string;
}

export interface ElectronAPI {
  isDesktop?: boolean;
  getVersion: () => Promise<string>;
  getAppDataPath: () => Promise<string>;
  saveBackupDialog: (defaultName: string) => Promise<string | null>;
  openBackupDialog: () => Promise<string | null>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  testHikvisionDevice: (config: HikvisionDeviceConfig) => Promise<HikvisionDeviceTestResult>;
  downloadHikvisionAttendance: (
    config: HikvisionDeviceConfig,
    startDate?: string,
    endDate?: string
  ) => Promise<HikvisionDownloadResponse>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
