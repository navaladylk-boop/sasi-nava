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

export interface HikvisionEventLog {
  serialNo?: number | string;
  employeeNo: string;
  time: string;
  major: number;
  minor: number;
  cardNo?: string;
  verifyMode?: 'FINGERPRINT' | 'FACE' | 'CARD' | 'PASSWORD';
  direction?: 'IN' | 'OUT' | 'AUTO';
}

export interface HikvisionDownloadResponse {
  success: boolean;
  events: HikvisionEventLog[];
  count: number;
  message: string;
}

export interface ElectronAPI {
  isDesktop?: boolean;
  getVersion: () => Promise<string>;
  getAppDataPath: () => Promise<string>;
  dbInit: () => Promise<{ success: boolean; state?: any; error?: string }>;
  dbSaveAll: (state: any) => Promise<{ success: boolean; error?: string }>;
  dbClear: () => Promise<{ success: boolean; error?: string }>;
  dbGetPath: () => Promise<string>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<boolean>;
  closeWindow: () => Promise<void>;
  isWindowMaximized: () => Promise<boolean>;
  saveBackupDialog: (defaultName?: string) => Promise<string | null>;
  openBackupDialog: () => Promise<string | null>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  testHikvisionDevice: (config: HikvisionDeviceConfig) => Promise<HikvisionDeviceTestResult>;
  downloadHikvisionAttendance: (config: HikvisionDeviceConfig, startDate?: string, endDate?: string) => Promise<HikvisionDownloadResponse>;
  onHikvisionProgress?: (callback: (progress: { totalFetched: number; currentBatchSize: number }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
