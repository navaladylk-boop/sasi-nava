import {
  AppUser,
  Department,
  Designation,
  Employee,
  FingerprintDevice,
  RawAttendancePunch,
  ProcessedAttendance,
  LeaveType,
  EmployeeLeave,
  AllowanceDeductionRule,
  PayrollCategory,
  PayrollPeriod,
  CompanySettings,
  AuditLog,
  UserRole,
  IncentiveRecord,
  Holiday,
  HolidayType,
  MonthlyWorkingDaysConfig
} from '../types';

export interface DatabaseState {
  version: number;
  lastUpdated: string;
  companySettings: CompanySettings;
  users: AppUser[];
  departments: Department[];
  designations: Designation[];
  employees: Employee[];
  devices: FingerprintDevice[];
  rawPunches: RawAttendancePunch[];
  processedAttendance: ProcessedAttendance[];
  leaveTypes: LeaveType[];
  employeeLeaves: EmployeeLeave[];
  incentives: IncentiveRecord[];
  allowanceRules: AllowanceDeductionRule[];
  payrollCategories: PayrollCategory[];
  payrollPeriods: PayrollPeriod[];
  auditLogs: AuditLog[];
  holidays: Holiday[];
  monthlyWorkingDays: MonthlyWorkingDaysConfig[];
}

const STORAGE_KEY = 'LANKA_HR_DATABASE_V3';

export const defaultSettings: CompanySettings = {
  id: 'company-01',
  companyName: 'Lanka Industrial Manufacturing (Pvt) Ltd',
  companyNameSinhala: 'ලංකා ඉන්ඩස්ට්‍රියල් මැනුෆැක්චරින් (පුද්) සමාගම',
  companyNameTamil: 'லங்கா தொழில்துறை உற்பத்தி (பிரைவேட்) லிமிடெட்',
  address: 'No 45, Baseline Road, Colombo 09, Sri Lanka',
  telephone: '+94 11 268 9000',
  email: 'hr@lankamanufacturing.lk',
  registrationNo: 'PV 12048',
  epfRegistrationNumber: 'EPF/C/89124',
  epfEmployerNo: '89124',
  defaultWorkingDaysPerMonth: 25,
  defaultWorkingDays: 25,
  normalWorkingHoursPerDay: 9,
  defaultWorkingHours: 9,
  shiftStartTime: '08:00',
  shiftEndTime: '17:00',
  lateGraceMinutes: 15,
  breakTimeMinutes: 0,
  shortLeaveAllowanceMinutes: 300,
  shortLeaveRateType: 'AUTOMATIC',
  shortLeaveFixedMinuteRate: 2.5,
  epfEmployeeRate: 8,
  epfEmployeePercent: 8,
  epfEmployerRate: 12,
  epfEmployerPercent: 12,
  etfEmployerRate: 3,
  etfEmployerPercent: 3,
  epfCalculationBasis: 'BASIC_MINUS_NOPAY',
  defaultOtHourlyRateMultiplier: 1.5,
  currencySymbol: 'Rs.',
  defaultLanguage: 'en',
  language: 'en',
  currentUserId: 'usr-admin'
};

export const defaultAllowanceRules: AllowanceDeductionRule[] = [
  {
    id: 'rule-tiered-customer',
    name: 'Sri Lanka Factory Attendance Incentive Tier Rule',
    description: 'Tiered daily reduction for unpaid leave days: Day 1: Rs. 1500, Day 2: Rs. 1500, Day 3: Rs. 1000, Day 4: Rs. 1000...',
    ruleType: 'TIERED',
    tiers: [
      { dayNumber: 1, deductionAmount: 1500, description: 'First unpaid day reduction' },
      { dayNumber: 2, deductionAmount: 1500, description: 'Second unpaid day reduction' },
      { dayNumber: 3, deductionAmount: 1000, description: 'Third unpaid day reduction' },
      { dayNumber: 4, deductionAmount: 1000, description: 'Fourth unpaid day reduction' }
    ],
    defaultDeductionBeyondTiers: 1000,
    capAtTotalAllowance: true,
    isActive: true,
    isDefault: true
  },
  {
    id: 'rule-daily-prorata',
    name: 'Pro-Rata Daily Allowance Deduction (Allowance ÷ 25)',
    description: 'Deducts exact daily proportion of fixed allowance per unpaid day.',
    ruleType: 'DAILY_PRORATA',
    tiers: [],
    capAtTotalAllowance: true,
    isActive: true,
    isDefault: false
  }
];

export const defaultLeaveTypes: LeaveType[] = [
  { id: 'lt-01', code: 'ANNUAL', name: 'Annual Leave (Shop & Office)', nameSinhala: 'වාර්ෂික නිවාඩු', nameTamil: 'வருடாந்திர விடுப்பு', isPaid: true, defaultDaysPerYear: 14 },
  { id: 'lt-02', code: 'CASUAL', name: 'Casual Leave', nameSinhala: 'අනියම් නිවාඩු', nameTamil: 'தற்செயල් விடுப்பு', isPaid: true, defaultDaysPerYear: 7 },
  { id: 'lt-03', code: 'MEDICAL', name: 'Medical / Sick Leave', nameSinhala: 'වෛද්‍ය නිවාඩු', nameTamil: 'மருத்துவ விடுப்பு', isPaid: true, defaultDaysPerYear: 14 },
  { id: 'lt-04', code: 'NO_PAY', name: 'Unpaid / No-Pay Leave', nameSinhala: 'වැටුප් රහිත නිවාඩු', nameTamil: 'சம்பளமில்லா விடுப்பு', isPaid: false, defaultDaysPerYear: 0 }
];

export const defaultCategories: PayrollCategory[] = [
  {
    id: 'cat-01',
    name: 'Sri Lankan Factory Permanent Staff (25 Days Divisor, 1.5x OT)',
    workingDaysDivisor: 25,
    defaultOtMultiplier: 1.5,
    allowanceDeductionRuleId: 'rule-tiered-customer'
  },
  {
    id: 'cat-02',
    name: 'Executive & Office Staff (25 Days Divisor, Fixed Hourly OT)',
    workingDaysDivisor: 25,
    defaultOtMultiplier: 1.5,
    allowanceDeductionRuleId: 'rule-daily-prorata'
  }
];

export const defaultDepartments: Department[] = [
  { id: 'dept-01', code: 'DEP-PROD', name: 'Production & Manufacturing', nameSinhala: 'නිෂ්පාදන අංශය', nameTamil: 'உற்பத்தி பிரிவு' },
  { id: 'dept-02', code: 'DEP-QC', name: 'Quality Assurance & QC', nameSinhala: 'තත්ත්ව පාලන අංශය', nameTamil: 'தரக் கட்டுப்பாட்டு பிரிவு' },
  { id: 'dept-03', code: 'DEP-ENG', name: 'Maintenance & Engineering', nameSinhala: 'නඩත්තු අංශය', nameTamil: 'பராமரிப்பு பிரிவு' },
  { id: 'dept-04', code: 'DEP-HR', name: 'Human Resources & Admin', nameSinhala: 'මානව සම්පත් අංශය', nameTamil: 'மனித வள பிரிவு' },
  { id: 'dept-05', code: 'DEP-LOG', name: 'Warehouse & Logistics', nameSinhala: 'ගබඩා සහ ප්‍රවාහන අංශය', nameTamil: 'கிடங்கு பிரிவு' }
];

export const defaultDesignations: Designation[] = [
  { id: 'des-01', code: 'DES-OPR', title: 'Machine Operator', departmentId: 'dept-01' },
  { id: 'des-02', code: 'DES-SUP', title: 'Floor Supervisor', departmentId: 'dept-01' },
  { id: 'des-03', code: 'DES-QC', title: 'QC Inspector', departmentId: 'dept-02' },
  { id: 'des-04', code: 'DES-TECH', title: 'Maintenance Technician', departmentId: 'dept-03' },
  { id: 'des-05', code: 'DES-HRO', title: 'HR Officer', departmentId: 'dept-04' }
];

export const defaultDevices: FingerprintDevice[] = [
  {
    id: 'dev-01',
    name: 'Main Factory Gate Reader (Hikvision)',
    brand: 'Hikvision',
    model: 'DS-K1A8503MF',
    ipAddress: '192.168.1.201',
    port: 80,
    username: 'admin',
    password: '',
    communicationType: 'TCP_IP',
    status: 'UNTESTED',
    serialNumber: 'DS-K1A8503MF20241015'
  }
];

export const defaultHolidays: Holiday[] = [
  { id: 'hol-2026-01-03', date: '2026-01-03', name: 'Duruthu Full Moon Poya Day', nameSinhala: 'දුරුතු පුර පසොළොස්වක පෝය දිනය', nameTamil: 'துருத்து பௌர்ணமி பூசை நாள்', type: 'Poya', year: 2026 },
  { id: 'hol-2026-01-14', date: '2026-01-14', name: 'Tamil Thai Pongal Day', nameSinhala: 'තයි පොංගල් දිනය', nameTamil: 'தை பொங்கல் திருநாள்', type: 'Public', year: 2026 },
  { id: 'hol-2026-02-01', date: '2026-02-01', name: 'Navam Full Moon Poya Day', nameSinhala: 'නාවම් පුර පසොළොස්වක පෝය දිනය', nameTamil: 'நவம் பௌர்ணமி பூசை நாள்', type: 'Poya', year: 2026 },
  { id: 'hol-2026-02-04', date: '2026-02-04', name: 'National Independence Day', nameSinhala: 'ජාතික නිදහස් දිනය', nameTamil: 'சுதந்திர தினம்', type: 'Public', year: 2026 },
  { id: 'hol-2026-03-02', date: '2026-03-02', name: 'Medin Full Moon Poya Day', nameSinhala: 'මැදින් පුර පසොළොස්වක පෝය දිනය', nameTamil: 'மேதின் பௌர்ணமி பூசை நாள்', type: 'Poya', year: 2026 },
  { id: 'hol-2026-03-30', date: '2026-03-30', name: 'Mahasivarathri Day', nameSinhala: 'මහා සිව්රාත්‍රි දිනය', nameTamil: 'மகா சிவராத்திரி நாள்', type: 'Public', year: 2026 },
  { id: 'hol-2026-04-01', date: '2026-04-01', name: 'Bak Full Moon Poya Day', nameSinhala: 'බක් පුර පසොළොස්වක පෝය දිනය', nameTamil: 'பக் பௌர்ணமி பூசை நாள்', type: 'Poya', year: 2026 },
  { id: 'hol-2026-04-03', date: '2026-04-03', name: 'Good Friday', nameSinhala: 'මහ සිකුරාදා දිනය', nameTamil: 'புனித வெள்ளி', type: 'Public', year: 2026 },
  { id: 'hol-2026-04-13', date: '2026-04-13', name: 'Day Prior to Sinhala & Tamil New Year Day', nameSinhala: 'සිංහල හා දෙමළ අලුත් අවුරුදු දිනට පෙර දිනය', nameTamil: 'புத்தாண்டுக்கு முந்தைய நாள்', type: 'Public', year: 2026 },
  { id: 'hol-2026-04-14', date: '2026-04-14', name: 'Sinhala & Tamil New Year Day', nameSinhala: 'සිංහල හා දෙමළ අලුත් අවුරුදු දිනය', nameTamil: 'சித்திரைப் புத்தாண்டு நாள்', type: 'Public', year: 2026 },
  { id: 'hol-2026-05-01', date: '2026-05-01', name: 'May Day (Workers Day) & Vesak Poya', nameSinhala: 'මැයි දිනය හා වෙසක් පුර පසොළොස්වක පෝය දිනය', nameTamil: 'மே தினம் & வைகாசி விசாகம்', type: 'Public', year: 2026 },
  { id: 'hol-2026-05-02', date: '2026-05-02', name: 'Day Following Vesak Full Moon Poya Day', nameSinhala: 'වෙසක් පෝය දිනයට පසු දිනය', nameTamil: 'வைகாசி விசாக மறுநாள்', type: 'Public', year: 2026 },
  { id: 'hol-2026-05-31', date: '2026-05-31', name: 'Poson Full Moon Poya Day', nameSinhala: 'පොසොන් පුර පසොළොස්වක පෝය දිනය', nameTamil: 'போசொன் பௌர்ணமி பூசை நாள்', type: 'Poya', year: 2026 },
  { id: 'hol-2026-06-29', date: '2026-06-29', name: 'Esala Full Moon Poya Day', nameSinhala: 'ඇසළ පුර පසොළොස්වක පෝය දිනය', nameTamil: 'ஆட பௌர்ணமி பூசை நாள்', type: 'Poya', year: 2026 },
  { id: 'hol-2026-07-28', date: '2026-07-28', name: 'Nikini Full Moon Poya Day', nameSinhala: 'නිකිණි පුර පසොළොස්වක පෝය දිනය', nameTamil: 'நிகிணி பௌர்ணமி பூசை நாள்', type: 'Poya', year: 2026 },
  { id: 'hol-2026-08-27', date: '2026-08-27', name: 'Binara Full Moon Poya Day', nameSinhala: 'බිනර පුර පසොළොස්වක පෝය දිනය', nameTamil: 'பினர பௌர்ணமி பூசை நாள்', type: 'Poya', year: 2026 },
  { id: 'hol-2026-09-26', date: '2026-09-26', name: 'Vap Full Moon Poya Day', nameSinhala: 'වප් පුර පසොළොස්වක පෝය දිනය', nameTamil: 'வப் பௌர்ணமி பூசை நாள்', type: 'Poya', year: 2026 },
  { id: 'hol-2026-10-25', date: '2026-10-25', name: 'Il Full Moon Poya Day', nameSinhala: 'ඉල් පුර පසොළොස්වක පෝය දිනය', nameTamil: 'இல் பௌர்ணமி பூசை நாள்', type: 'Poya', year: 2026 },
  { id: 'hol-2026-11-08', date: '2026-11-08', name: 'Deepavali Festival Day', nameSinhala: 'දීපවාලි උත්සව දිනය', nameTamil: 'தீபாவளி திருநாள்', type: 'Public', year: 2026 },
  { id: 'hol-2026-11-24', date: '2026-11-24', name: 'Unduwap Full Moon Poya Day', nameSinhala: 'උඳුවප් පුර පසොළොස්වක පෝය දිනය', nameTamil: 'உண்டுவப் பௌர்ணமி பூசை நாள்', type: 'Poya', year: 2026 },
  { id: 'hol-2026-12-25', date: '2026-12-25', name: 'Christmas Day', nameSinhala: 'නත්තල් දිනය', nameTamil: 'கிறிஸ்துமஸ் தினம்', type: 'Mercantile', year: 2026 }
];

function getInitialDatabase(): DatabaseState {
  const initialAuditLogs: AuditLog[] = [
    {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'Admin',
      userRole: 'Admin',
      action: 'SYSTEM_INIT',
      details: 'Clean SQLite database initialized with Sri Lankan statutory framework & holiday calendar.'
    }
  ];

  return {
    version: 3,
    lastUpdated: new Date().toISOString(),
    companySettings: defaultSettings,
    users: [
      { id: 'usr-01', username: 'admin', fullName: 'System Administrator', role: 'Admin' },
      { id: 'usr-02', username: 'hrmanager', fullName: 'HR Manager', role: 'HR Manager' }
    ],
    departments: defaultDepartments,
    designations: defaultDesignations,
    employees: [],
    devices: defaultDevices,
    rawPunches: [],
    processedAttendance: [],
    leaveTypes: defaultLeaveTypes,
    employeeLeaves: [],
    incentives: [],
    allowanceRules: defaultAllowanceRules,
    payrollCategories: defaultCategories,
    payrollPeriods: [],
    auditLogs: initialAuditLogs,
    holidays: defaultHolidays,
    monthlyWorkingDays: []
  };
}

export class DatabaseService {
  private static state: DatabaseState = DatabaseService.loadFromStorage();
  private static isInitialized = false;

  private static deletedIds: {
    employees: string[];
    employeeLeaves: string[];
    holidays: string[];
    departments: string[];
    designations: string[];
    devices: string[];
    rawPunches: string[];
    processedAttendance: string[];
    incentives: string[];
    payrollCategories: string[];
    payrollPeriods: string[];
    allowanceRules: string[];
    leaveTypes: string[];
    monthlyWorkingDays: string[];
  } = {
    employees: [],
    employeeLeaves: [],
    holidays: [],
    departments: [],
    designations: [],
    devices: [],
    rawPunches: [],
    processedAttendance: [],
    incentives: [],
    payrollCategories: [],
    payrollPeriods: [],
    allowanceRules: [],
    leaveTypes: [],
    monthlyWorkingDays: []
  };

  private static clearDeletedIds(): void {
    this.deletedIds = {
      employees: [],
      employeeLeaves: [],
      holidays: [],
      departments: [],
      designations: [],
      devices: [],
      rawPunches: [],
      processedAttendance: [],
      incentives: [],
      payrollCategories: [],
      payrollPeriods: [],
      allowanceRules: [],
      leaveTypes: [],
      monthlyWorkingDays: []
    };
  }

  public static async initialize(): Promise<DatabaseState> {
    if (this.isInitialized) return this.state;

    // Check if running inside Electron desktop with SQLite bridge
    if (typeof window !== 'undefined' && window.electronAPI?.dbInit) {
      try {
        console.log('[DatabaseService] Requesting SQLite database initialization via Electron IPC...');
        const res = await window.electronAPI.dbInit();
        if (res.success && res.state && res.state.companySettings) {
          const loaded = res.state;
          // Ensure all arrays exist
          loaded.departments = loaded.departments?.length > 0 ? loaded.departments : defaultDepartments;
          loaded.designations = loaded.designations?.length > 0 ? loaded.designations : defaultDesignations;
          loaded.allowanceRules = loaded.allowanceRules?.length > 0 ? loaded.allowanceRules : defaultAllowanceRules;
          loaded.leaveTypes = loaded.leaveTypes?.length > 0 ? loaded.leaveTypes : defaultLeaveTypes;
          loaded.payrollCategories = loaded.payrollCategories?.length > 0 ? loaded.payrollCategories : defaultCategories;
          loaded.employees = loaded.employees || [];
          loaded.devices = loaded.devices?.length > 0 ? loaded.devices : defaultDevices;
          loaded.rawPunches = loaded.rawPunches || [];
          loaded.processedAttendance = loaded.processedAttendance || [];
          loaded.employeeLeaves = loaded.employeeLeaves || [];
          loaded.incentives = loaded.incentives || [];
          loaded.payrollPeriods = loaded.payrollPeriods || [];
          loaded.auditLogs = loaded.auditLogs || [];
          loaded.holidays = loaded.holidays?.length > 0 ? loaded.holidays : defaultHolidays;
          loaded.monthlyWorkingDays = loaded.monthlyWorkingDays || [];

          this.state = loaded as DatabaseState;
          console.log(`[DatabaseService] SQLite Database ready (${this.state.employees.length} employees).`);
        } else {
          console.log('[DatabaseService] SQLite was empty, saving initial defaults...');
          await window.electronAPI.dbSaveAll(this.state);
        }
      } catch (ipcErr) {
        console.warn('[DatabaseService] SQLite IPC initialization failed, using local cache:', ipcErr);
      }
    }

    this.isInitialized = true;
    return this.state;
  }

  private static loadFromStorage(): DatabaseState {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.companySettings) {
            parsed.departments = parsed.departments?.length ? parsed.departments : defaultDepartments;
            parsed.designations = parsed.designations?.length ? parsed.designations : defaultDesignations;
            parsed.allowanceRules = parsed.allowanceRules?.length ? parsed.allowanceRules : defaultAllowanceRules;
            parsed.leaveTypes = parsed.leaveTypes?.length ? parsed.leaveTypes : defaultLeaveTypes;
            parsed.payrollCategories = parsed.payrollCategories?.length ? parsed.payrollCategories : defaultCategories;
            parsed.employees = parsed.employees || [];
            parsed.devices = parsed.devices?.length ? parsed.devices : defaultDevices;
            parsed.rawPunches = parsed.rawPunches || [];
            parsed.processedAttendance = parsed.processedAttendance || [];
            parsed.employeeLeaves = parsed.employeeLeaves || [];
            parsed.incentives = parsed.incentives || [];
            parsed.payrollPeriods = parsed.payrollPeriods || [];
            parsed.auditLogs = parsed.auditLogs || [];
            parsed.holidays = parsed.holidays?.length ? parsed.holidays : defaultHolidays;
            parsed.monthlyWorkingDays = parsed.monthlyWorkingDays || [];
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load database from localStorage, initializing defaults', err);
    }
    const initial = getInitialDatabase();
    DatabaseService.saveToStorage(initial);
    return initial;
  }

  public static async saveToStorage(state: DatabaseState): Promise<{ success: boolean; error?: string }> {
    try {
      state.lastUpdated = new Date().toISOString();
      const serialized = JSON.stringify(state);

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, serialized);
      }

      // Sync directly to SQLite database via Electron IPC
      if (typeof window !== 'undefined' && window.electronAPI?.dbSaveAll) {
        const payload = {
          ...state,
          deletedIds: { ...this.deletedIds }
        };
        const res = await window.electronAPI.dbSaveAll(payload);
        if (!res.success) {
          console.error('[DatabaseService] Electron SQLite write error:', res.error);
          return { success: false, error: res.error || 'Failed to write SQLite database to disk.' };
        }
        // Successfully saved - clear the accumulated deletedIds
        this.clearDeletedIds();
        return { success: true };
      }
      // If not Electron, also clear them so they don't accumulate indefinitely in RAM
      this.clearDeletedIds();
      return { success: true };
    } catch (err: any) {
      console.error('[DatabaseService] Failed to persist database:', err);
      return { success: false, error: err.message || 'Database save failed' };
    }
  }

  public static getState(): DatabaseState {
    return this.state;
  }

  public static logAudit(action: string, details: string, userRole: string = 'Admin'): void {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      user: userRole,
      userRole,
      action,
      details
    };
    if (!this.state.auditLogs) this.state.auditLogs = [];
    this.state.auditLogs.unshift(log);
    if (this.state.auditLogs.length > 300) {
      this.state.auditLogs.pop();
    }
    this.saveToStorage(this.state);
  }

  // Company Settings
  public static getSettings(): CompanySettings {
    return this.state.companySettings || defaultSettings;
  }

  public static saveSettings(settings: Partial<CompanySettings>, userRole: string = 'Admin'): CompanySettings {
    this.state.companySettings = { ...this.state.companySettings, ...settings };
    this.logAudit('UPDATE_SETTINGS', 'Updated company profile & statutory parameters', userRole);
    this.saveToStorage(this.state);
    return this.state.companySettings;
  }

  // Employees CRUD
  public static getEmployees(): Employee[] {
    return this.state.employees || [];
  }

  public static getEmployeeById(id: string): Employee | undefined {
    return (this.state.employees || []).find(e => e.id === id);
  }

  public static async saveEmployee(employeeData: Partial<Employee>, userRole: string = 'Admin'): Promise<Employee> {
    console.log('[EMPLOYEE_SAVE] FORM_SUBMIT', {
      employeeCode: employeeData.employeeCode,
      fullName: employeeData.fullName,
      basicSalary: employeeData.basicSalary,
      fixedAllowance: employeeData.fixedAllowance,
      workingDaysPerMonth: employeeData.workingDaysPerMonth
    });

    // Validation
    const code = (employeeData.employeeCode || '').trim();
    const name = (employeeData.fullName || '').trim();

    if (!code) {
      console.error('[EMPLOYEE_SAVE] VALIDATION_RESULT: Employee ID / Code is required');
      throw new Error('Employee Code / ID is required.');
    }
    if (!name) {
      console.error('[EMPLOYEE_SAVE] VALIDATION_RESULT: Employee Name is required');
      throw new Error('Employee Full Name is required.');
    }

    console.log('[EMPLOYEE_SAVE] VALIDATION_RESULT: Passed');
    console.log('[EMPLOYEE_SAVE] DATABASE_SAVE_STARTED', { employeeCode: code });

    const existingIdx = employeeData.id
      ? this.state.employees.findIndex(e => e.id === employeeData.id)
      : this.state.employees.findIndex(e => e.employeeCode.toLowerCase() === code.toLowerCase());

    const previousEmployeeState = existingIdx !== -1 ? { ...this.state.employees[existingIdx] } : null;
    const isNew = existingIdx === -1;

    let savedEmployee: Employee;

    if (existingIdx !== -1) {
      const existing = this.state.employees[existingIdx];
      savedEmployee = {
        ...existing,
        ...employeeData,
        employeeCode: code,
        fullName: name,
        epfNumber: employeeData.epfNumber !== undefined ? employeeData.epfNumber : existing.epfNumber,
        etfNumber: employeeData.etfNumber !== undefined ? employeeData.etfNumber : existing.etfNumber,
        epfEnabled: employeeData.epfEnabled !== undefined ? employeeData.epfEnabled : (existing.epfEnabled ?? true),
        etfEnabled: employeeData.etfEnabled !== undefined ? employeeData.etfEnabled : (existing.etfEnabled ?? true),
        basicSalary: Number(employeeData.basicSalary) >= 0 ? Number(employeeData.basicSalary) : existing.basicSalary,
        fixedAllowance: Number(employeeData.fixedAllowance) >= 0 ? Number(employeeData.fixedAllowance) : existing.fixedAllowance,
        otherAllowance: Number(employeeData.otherAllowance) >= 0 ? Number(employeeData.otherAllowance) : (existing.otherAllowance || 0),
        workingDaysPerMonth: Number(employeeData.workingDaysPerMonth) > 0 ? Number(employeeData.workingDaysPerMonth) : 25,
        normalWorkingHours: Number(employeeData.normalWorkingHours) > 0 ? Number(employeeData.normalWorkingHours) : 8,
        fingerprintUserId: employeeData.fingerprintUserId || code,
        isActive: employeeData.isActive !== undefined ? employeeData.isActive : existing.isActive
      };
      this.state.employees[existingIdx] = savedEmployee;
      this.logAudit('UPDATE_EMPLOYEE', `Updated employee ${code} - ${name}`, userRole);
    } else {
      savedEmployee = {
        id: employeeData.id || `emp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        employeeCode: code,
        fullName: name,
        nameSinhala: employeeData.nameSinhala || '',
        nameTamil: employeeData.nameTamil || '',
        nic: employeeData.nic || '',
        dob: employeeData.dob || '1995-01-01',
        gender: employeeData.gender || 'MALE',
        address: employeeData.address || '',
        telephone: employeeData.telephone || '',
        email: employeeData.email || '',
        departmentId: employeeData.departmentId || (this.state.departments[0]?.id || 'dept-01'),
        designationId: employeeData.designationId || (this.state.designations[0]?.id || 'des-01'),
        joinDate: employeeData.joinDate || new Date().toISOString().slice(0, 10),
        employmentStatus: employeeData.employmentStatus || 'PERMANENT',
        epfNumber: employeeData.epfNumber || code,
        etfNumber: employeeData.etfNumber || '',
        epfEnabled: employeeData.epfEnabled !== undefined ? employeeData.epfEnabled : true,
        etfEnabled: employeeData.etfEnabled !== undefined ? employeeData.etfEnabled : true,
        basicSalary: Number(employeeData.basicSalary) >= 0 ? Number(employeeData.basicSalary) : 30000,
        fixedAllowance: Number(employeeData.fixedAllowance) >= 0 ? Number(employeeData.fixedAllowance) : 5000,
        otherAllowance: Number(employeeData.otherAllowance) >= 0 ? Number(employeeData.otherAllowance) : 0,
        bankName: employeeData.bankName || 'Bank of Ceylon',
        bankAccountNumber: employeeData.bankAccountNumber || '',
        branch: employeeData.branch || 'Head Office',
        payrollCategoryId: employeeData.payrollCategoryId || (this.state.payrollCategories[0]?.id || 'cat-01'),
        workingDaysPerMonth: Number(employeeData.workingDaysPerMonth) > 0 ? Number(employeeData.workingDaysPerMonth) : 25,
        normalWorkingHours: Number(employeeData.normalWorkingHours) > 0 ? Number(employeeData.normalWorkingHours) : 8,
        otRateType: employeeData.otRateType || '1.5X_STANDARD',
        fingerprintUserId: employeeData.fingerprintUserId || code,
        isActive: employeeData.isActive !== undefined ? employeeData.isActive : true
      };
      this.state.employees.push(savedEmployee);
      this.logAudit('ADD_EMPLOYEE', `Registered employee ${savedEmployee.employeeCode} - ${savedEmployee.fullName}`, userRole);
    }

    const saveResult = await this.saveToStorage(this.state);
    if (!saveResult.success) {
      if (isNew) {
        this.state.employees = this.state.employees.filter(e => e.id !== savedEmployee.id);
      } else if (previousEmployeeState && existingIdx !== -1) {
        this.state.employees[existingIdx] = previousEmployeeState;
      }
      console.error('[EMPLOYEE_SAVE] DATABASE_SAVE_FAILED:', saveResult.error);
      throw new Error(saveResult.error || 'Failed to save employee to SQLite database.');
    }

    console.log('[EMPLOYEE_SAVE] DATABASE_SAVE_SUCCESS', {
      id: savedEmployee.id,
      employeeCode: savedEmployee.employeeCode,
      totalEmployees: this.state.employees.length
    });

    return savedEmployee;
  }

  public static async deleteEmployee(id: string, userRole: string = 'Admin'): Promise<void> {
    const emp = this.getEmployeeById(id);
    const previousEmployees = [...this.state.employees];
    this.state.employees = this.state.employees.filter(e => e.id !== id);
    this.deletedIds.employees.push(id);
    this.logAudit('DELETE_EMPLOYEE', `Deleted employee ${emp?.employeeCode || id}`, userRole);

    const saveResult = await this.saveToStorage(this.state);
    if (!saveResult.success) {
      this.state.employees = previousEmployees;
      console.error('[EMPLOYEE_DELETE] DATABASE_DELETE_FAILED:', saveResult.error);
      throw new Error(saveResult.error || 'Failed to delete employee from SQLite database.');
    }
  }

  /**
   * Safe batch import / mapping of Hikvision users into LankaHR.
   * Preserves all financial, statutory, bank, and leave records.
   * Automatically re-links historical raw punches.
   */
  public static async importHikvisionUsers(
    importItems: {
      hikvisionPersonId: string;
      name?: string;
      action: 'CREATE_NEW' | 'UPDATE_MAPPING' | 'SKIP';
      targetEmployeeId?: string;
    }[],
    userRole: string = 'Admin'
  ): Promise<{ createdCount: number; updatedCount: number; relinkedPunchesCount: number }> {
    if (!this.state.employees) this.state.employees = [];

    const normalizeId = (idStr?: string | number): string => {
      if (idStr === undefined || idStr === null) return '';
      return String(idStr).trim().toLowerCase().replace(/^emp-/, '').replace(/^0+/, '');
    };

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of importItems) {
      if (item.action === 'SKIP') continue;

      const personId = String(item.hikvisionPersonId).trim();
      if (!personId) continue;

      const normPersonId = normalizeId(personId);

      if (item.action === 'UPDATE_MAPPING') {
        let targetEmp: Employee | undefined;
        if (item.targetEmployeeId) {
          targetEmp = this.state.employees.find(e => e.id === item.targetEmployeeId);
        }
        if (!targetEmp) {
          targetEmp = this.state.employees.find(
            e => normalizeId(e.fingerprintUserId) === normPersonId || normalizeId(e.employeeCode) === normPersonId
          );
        }

        if (targetEmp) {
          // Update mapping ONLY - Preserve all salary, allowances, EPF, ETF, bank, leave & payroll history
          targetEmp.fingerprintUserId = personId;
          if (item.name && item.name.trim() && (!targetEmp.fullName || targetEmp.fullName.startsWith('Employee '))) {
            targetEmp.fullName = item.name.trim();
          }
          updatedCount++;
        }
      } else if (item.action === 'CREATE_NEW') {
        // Prevent duplicate creation if an employee with this fingerprint ID or code already exists
        const existingEmp = this.state.employees.find(
          e => e.fingerprintUserId === personId ||
               normalizeId(e.fingerprintUserId) === normPersonId ||
               e.employeeCode.toLowerCase() === `emp${personId.padStart(3, '0')}`.toLowerCase() ||
               e.employeeCode.toLowerCase() === personId.toLowerCase()
        );

        if (existingEmp) {
          existingEmp.fingerprintUserId = personId;
          if (item.name && item.name.trim() && (!existingEmp.fullName || existingEmp.fullName.startsWith('Employee '))) {
            existingEmp.fullName = item.name.trim();
          }
          updatedCount++;
        } else {
          const formattedCode = personId.toUpperCase().startsWith('EMP')
            ? personId.toUpperCase()
            : `EMP${personId.padStart(3, '0')}`;

          const newEmployee: Employee = {
            id: `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            employeeCode: formattedCode,
            fullName: item.name && item.name.trim() ? item.name.trim() : `Employee ${personId}`,
            nameSinhala: '',
            nameTamil: '',
            nic: '',
            dob: '1995-01-01',
            gender: 'MALE',
            address: '',
            telephone: '',
            email: '',
            departmentId: this.state.departments[0]?.id || 'dept-01',
            designationId: this.state.designations[0]?.id || 'des-01',
            joinDate: new Date().toISOString().slice(0, 10),
            employmentStatus: 'PERMANENT',
            epfNumber: personId,
            etfNumber: '',
            epfEnabled: true,
            etfEnabled: true,
            basicSalary: 30000,
            fixedAllowance: 5000,
            otherAllowance: 0,
            bankName: 'Bank of Ceylon',
            bankAccountNumber: '',
            branch: 'Head Office',
            payrollCategoryId: this.state.payrollCategories[0]?.id || 'cat-01',
            workingDaysPerMonth: this.state.companySettings.defaultWorkingDaysPerMonth || 25,
            normalWorkingHours: this.state.companySettings.normalWorkingHoursPerDay || 8,
            otRateType: '1.5X_STANDARD',
            fingerprintUserId: personId,
            isActive: true
          };

          this.state.employees.push(newEmployee);
          createdCount++;
        }
      }
    }

    // Automatically re-link all unmapped historical raw attendance punches
    const relinkedPunchesCount = this.autoRelinkRawPunches();

    await this.saveToStorage(this.state);
    this.logAudit(
      'IMPORT_HIKVISION_USERS',
      `Synchronized Hikvision users (Created: ${createdCount}, Updated: ${updatedCount}, Re-linked punches: ${relinkedPunchesCount})`,
      userRole
    );

    console.log(`[Hikvision User Sync] Complete: Created ${createdCount}, Updated mappings ${updatedCount}, Re-linked punches ${relinkedPunchesCount}`);

    return { createdCount, updatedCount, relinkedPunchesCount };
  }

  // Departments & Designations CRUD
  public static getDepartments(): Department[] {
    return this.state.departments || defaultDepartments;
  }

  public static saveDepartment(dept: Partial<Department>, userRole: string = 'Admin'): Department {
    if (!this.state.departments) this.state.departments = [];
    if (dept.id && this.state.departments.some(d => d.id === dept.id)) {
      const idx = this.state.departments.findIndex(d => d.id === dept.id);
      this.state.departments[idx] = { ...this.state.departments[idx], ...dept } as Department;
      this.logAudit('UPDATE_DEPARTMENT', `Updated department ${this.state.departments[idx].name}`, userRole);
      this.saveToStorage(this.state);
      return this.state.departments[idx];
    } else {
      const newDept: Department = {
        id: dept.id || `dept-${Date.now()}`,
        code: dept.code || `DEP-${Date.now().toString().slice(-3)}`,
        name: dept.name || 'New Department',
        nameSinhala: dept.nameSinhala || '',
        nameTamil: dept.nameTamil || ''
      };
      this.state.departments.push(newDept);
      this.logAudit('ADD_DEPARTMENT', `Created department ${newDept.name}`, userRole);
      this.saveToStorage(this.state);
      return newDept;
    }
  }

  public static deleteDepartment(id: string, userRole: string = 'Admin'): { success: boolean; message?: string } {
    const hasAssigned = this.state.employees.some(e => e.departmentId === id);
    if (hasAssigned) {
      return { success: false, message: 'Cannot delete department: Employees are currently assigned to it.' };
    }
    this.state.departments = this.state.departments.filter(d => d.id !== id);
    this.deletedIds.departments.push(id);
    this.logAudit('DELETE_DEPARTMENT', `Deleted department ${id}`, userRole);
    this.saveToStorage(this.state);
    return { success: true };
  }

  public static getDesignations(): Designation[] {
    return this.state.designations || defaultDesignations;
  }

  public static saveDesignation(desig: Partial<Designation>, userRole: string = 'Admin'): Designation {
    if (!this.state.designations) this.state.designations = [];
    if (desig.id && this.state.designations.some(d => d.id === desig.id)) {
      const idx = this.state.designations.findIndex(d => d.id === desig.id);
      this.state.designations[idx] = { ...this.state.designations[idx], ...desig } as Designation;
      this.logAudit('UPDATE_DESIGNATION', `Updated designation ${this.state.designations[idx].title}`, userRole);
      this.saveToStorage(this.state);
      return this.state.designations[idx];
    } else {
      const newDesig: Designation = {
        id: desig.id || `des-${Date.now()}`,
        code: desig.code || `DES-${Date.now().toString().slice(-3)}`,
        title: desig.title || 'New Designation',
        departmentId: desig.departmentId || this.state.departments[0]?.id || 'dept-01'
      };
      this.state.designations.push(newDesig);
      this.logAudit('ADD_DESIGNATION', `Created designation ${newDesig.title}`, userRole);
      this.saveToStorage(this.state);
      return newDesig;
    }
  }

  public static deleteDesignation(id: string, userRole: string = 'Admin'): { success: boolean; message?: string } {
    const hasAssigned = this.state.employees.some(e => e.designationId === id);
    if (hasAssigned) {
      return { success: false, message: 'Cannot delete designation: Employees are currently assigned to it.' };
    }
    this.state.designations = this.state.designations.filter(d => d.id !== id);
    this.deletedIds.designations.push(id);
    this.logAudit('DELETE_DESIGNATION', `Deleted designation ${id}`, userRole);
    this.saveToStorage(this.state);
    return { success: true };
  }

  // Biometric Devices
  public static getDevices(): FingerprintDevice[] {
    return this.state.devices || [];
  }

  public static saveDevice(device: Partial<FingerprintDevice>, userRole: string = 'Admin'): FingerprintDevice {
    if (!this.state.devices) this.state.devices = [];
    if (device.id && this.state.devices.some(d => d.id === device.id)) {
      const idx = this.state.devices.findIndex(d => d.id === device.id);
      this.state.devices[idx] = { ...this.state.devices[idx], ...device } as FingerprintDevice;
      this.logAudit('UPDATE_DEVICE', `Updated biometric machine ${this.state.devices[idx].name}`, userRole);
      this.saveToStorage(this.state);
      return this.state.devices[idx];
    } else {
      const newDev: FingerprintDevice = {
        id: device.id || `dev-${Date.now()}`,
        name: device.name || 'Hikvision Attendance Terminal',
        brand: device.brand || 'Hikvision',
        model: device.model || 'DS-K1A8503MF',
        ipAddress: device.ipAddress || '192.168.1.201',
        port: device.port || 80,
        username: device.username || 'admin',
        password: device.password || '',
        communicationType: device.communicationType || 'TCP_IP',
        status: device.status || 'UNTESTED',
        lastSyncTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
        serialNumber: device.serialNumber || 'DS-K1A8503MF20241015',
        ...device
      };
      this.state.devices.push(newDev);
      this.logAudit('ADD_DEVICE', `Registered machine ${newDev.name} (${newDev.ipAddress}:${newDev.port})`, userRole);
      this.saveToStorage(this.state);
      return newDev;
    }
  }

  public static deleteDevice(id: string, userRole: string = 'Admin'): void {
    this.state.devices = (this.state.devices || []).filter(d => d.id !== id);
    this.deletedIds.devices.push(id);
    this.logAudit('DELETE_DEVICE', `Removed device ${id}`, userRole);
    this.saveToStorage(this.state);
  }

  // Raw Punches
  public static autoRelinkRawPunches(): number {
    if (!this.state.rawPunches || !this.state.employees) return 0;
    const employees = this.state.employees;

    const normalizeId = (idStr?: string | number): string => {
      if (idStr === undefined || idStr === null) return '';
      return String(idStr).trim().toLowerCase().replace(/^emp-/, '').replace(/^0+/, '');
    };

    const empLookupMap = new Map<string, string>(); // normalizedId -> emp.id
    employees.forEach(emp => {
      if (emp.fingerprintUserId) empLookupMap.set(normalizeId(emp.fingerprintUserId), emp.id);
      if (emp.employeeCode) empLookupMap.set(normalizeId(emp.employeeCode), emp.id);
      if (emp.id) empLookupMap.set(normalizeId(emp.id), emp.id);
    });

    let relinked = 0;
    this.state.rawPunches.forEach(punch => {
      if (!punch.employeeId && punch.deviceUserId) {
        const empId = empLookupMap.get(normalizeId(punch.deviceUserId));
        if (empId) {
          punch.employeeId = empId;
          relinked++;
        }
      }
    });

    if (relinked > 0) {
      console.log(`[SQLite Diagnostic] Auto-relinked ${relinked} historical raw punches to newly created/mapped employees.`);
    }
    return relinked;
  }

  public static getRawPunches(): RawAttendancePunch[] {
    if (!this.state.rawPunches) this.state.rawPunches = [];
    this.autoRelinkRawPunches();
    return this.state.rawPunches;
  }

  public static saveRawPunches(punches: RawAttendancePunch[], userRole: string = 'Admin'): void {
    if (!this.state.rawPunches) this.state.rawPunches = [];

    const normalizeId = (idStr?: string | number): string => {
      if (idStr === undefined || idStr === null) return '';
      return String(idStr).trim().toLowerCase().replace(/^emp-/, '').replace(/^0+/, '');
    };

    const existingMap = new Map<string, number>();
    this.state.rawPunches.forEach((p, idx) => {
      const key = `${p.deviceId}_${normalizeId(p.deviceUserId)}_${p.punchTimestamp}_${p.punchType}`;
      existingMap.set(key, idx);
    });

    let addedCount = 0;
    let updatedCount = 0;

    punches.forEach(p => {
      const key = `${p.deviceId}_${normalizeId(p.deviceUserId)}_${p.punchTimestamp}_${p.punchType}`;
      const existingIdx = existingMap.get(key);
      if (existingIdx !== undefined) {
        if (p.employeeId && !this.state.rawPunches[existingIdx].employeeId) {
          this.state.rawPunches[existingIdx].employeeId = p.employeeId;
          updatedCount++;
        }
      } else {
        this.state.rawPunches.push(p);
        existingMap.set(key, this.state.rawPunches.length - 1);
        addedCount++;
      }
    });

    this.autoRelinkRawPunches();
    console.log(`[SQLite Diagnostic] saveRawPunches: Added ${addedCount} new punches, updated ${updatedCount} existing punches. Total raw punches in SQLite: ${this.state.rawPunches.length}`);
    this.logAudit('DOWNLOAD_PUNCHES', `Saved raw punches from biometric terminal (Added: ${addedCount}, Updated: ${updatedCount}).`, userRole);
    this.saveToStorage(this.state);
  }

  // Processed Attendance
  public static getProcessedAttendance(month?: string): ProcessedAttendance[] {
    const list = this.state.processedAttendance || [];
    if (!month) return list;
    return list.filter(a => a.date.startsWith(month));
  }

  public static saveProcessedAttendanceBatch(records: ProcessedAttendance[], userRole: string = 'Admin'): void {
    if (!this.state.processedAttendance) this.state.processedAttendance = [];
    const map = new Map(this.state.processedAttendance.map(a => [a.id, a]));
    records.forEach(r => map.set(r.id, r));
    this.state.processedAttendance = Array.from(map.values());
    this.logAudit('PROCESS_ATTENDANCE', `Processed attendance batch (${records.length} daily entries).`, userRole);
    this.saveToStorage(this.state);
  }

  public static saveManualAttendance(record: Partial<ProcessedAttendance>, userRole: string = 'Admin'): ProcessedAttendance {
    if (!this.state.processedAttendance) this.state.processedAttendance = [];
    const existingIdx = record.id ? this.state.processedAttendance.findIndex(a => a.id === record.id) : -1;
    if (existingIdx !== -1) {
      this.state.processedAttendance[existingIdx] = {
        ...this.state.processedAttendance[existingIdx],
        ...record,
        isManualCorrection: true
      } as ProcessedAttendance;
      this.logAudit('UPDATE_ATTENDANCE', `Updated manual attendance on ${record.date} for emp ${record.employeeId}`, userRole);
      this.saveToStorage(this.state);
      return this.state.processedAttendance[existingIdx];
    } else {
      const newAtt: ProcessedAttendance = {
        id: record.id || `att-man-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        employeeId: record.employeeId || '',
        date: record.date || new Date().toISOString().substring(0, 10),
        firstIn: record.firstIn || '08:30',
        lastOut: record.lastOut || '17:00',
        totalHours: Number(record.totalHours) || 8.5,
        normalHours: Number(record.normalHours) || 8,
        otHours: Number(record.otHours) || 0,
        lateMinutes: Number(record.lateMinutes) || 0,
        earlyLeaveMinutes: Number(record.earlyLeaveMinutes) || 0,
        status: record.status || 'PRESENT',
        isManualCorrection: true,
        remarks: record.remarks || 'Manual Entry',
        ...record
      };
      this.state.processedAttendance.push(newAtt);
      this.logAudit('ADD_ATTENDANCE', `Added manual attendance for emp ${newAtt.employeeId} on ${newAtt.date}`, userRole);
      this.saveToStorage(this.state);
      return newAtt;
    }
  }

  public static deleteAttendanceRecord(id: string, userRole: string = 'Admin'): void {
    this.state.processedAttendance = (this.state.processedAttendance || []).filter(a => a.id !== id);
    this.deletedIds.processedAttendance.push(id);
    this.logAudit('DELETE_ATTENDANCE', `Deleted attendance entry ${id}`, userRole);
    this.saveToStorage(this.state);
  }

  // Leave Management
  public static getLeaveTypes(): LeaveType[] {
    return this.state.leaveTypes || defaultLeaveTypes;
  }

  public static getLeaves(): EmployeeLeave[] {
    return this.state.employeeLeaves || [];
  }

  public static async saveLeave(leave: Omit<EmployeeLeave, 'id'> | EmployeeLeave, userRole: string = 'Admin'): Promise<EmployeeLeave> {
    if (!this.state.employeeLeaves) this.state.employeeLeaves = [];
    const existingId = (leave as any).id;
    const existingIdx = existingId ? this.state.employeeLeaves.findIndex(l => l.id === existingId) : -1;
    const previousState = existingIdx !== -1 ? { ...this.state.employeeLeaves[existingIdx] } : null;

    let savedLeave: EmployeeLeave;
    if (existingIdx !== -1) {
      savedLeave = { ...this.state.employeeLeaves[existingIdx], ...leave } as EmployeeLeave;
      this.state.employeeLeaves[existingIdx] = savedLeave;
      this.logAudit('UPDATE_LEAVE', `Updated leave record for emp ${leave.employeeId} (${savedLeave.startDate} to ${savedLeave.endDate})`, userRole);
    } else {
      savedLeave = {
        ...(leave as any),
        id: (leave as any).id || `leave-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        appliedDate: leave.appliedDate || new Date().toISOString().substring(0, 10),
        status: leave.status || 'APPROVED'
      };
      this.state.employeeLeaves.push(savedLeave);
      this.logAudit('APPLY_LEAVE', `Applied leave for emp ${leave.employeeId} (${savedLeave.daysCount} days, ${savedLeave.startDate} to ${savedLeave.endDate})`, userRole);
    }

    const saveResult = await this.saveToStorage(this.state);
    if (!saveResult.success) {
      if (existingIdx === -1) {
        this.state.employeeLeaves = this.state.employeeLeaves.filter(l => l.id !== savedLeave.id);
      } else if (previousState) {
        this.state.employeeLeaves[existingIdx] = previousState;
      }
      throw new Error(saveResult.error || 'Failed to save leave to SQLite database.');
    }
    return savedLeave;
  }

  public static updateLeaveStatus(
    id: string,
    status: 'APPROVED' | 'PENDING' | 'REJECTED',
    approvedBy: string,
    userRole: string = 'Admin'
  ): void {
    if (!this.state.employeeLeaves) this.state.employeeLeaves = [];
    const idx = this.state.employeeLeaves.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.state.employeeLeaves[idx].status = status;
      this.state.employeeLeaves[idx].approvedBy = approvedBy;
      this.logAudit('LEAVE_STATUS', `Leave ${id} set to ${status}`, userRole);
      this.saveToStorage(this.state);
    }
  }

  public static async deleteLeave(id: string, userRole: string = 'Admin'): Promise<void> {
    const leaveRecord = (this.state.employeeLeaves || []).find(l => l.id === id);
    const previousLeaves = [...(this.state.employeeLeaves || [])];
    this.state.employeeLeaves = (this.state.employeeLeaves || []).filter(l => l.id !== id);
    this.deletedIds.employeeLeaves.push(id);
    this.logAudit('DELETE_LEAVE', `Deleted leave application ${id} (Emp: ${leaveRecord?.employeeId}, Dates: ${leaveRecord?.startDate} to ${leaveRecord?.endDate})`, userRole);

    const saveResult = await this.saveToStorage(this.state);
    if (!saveResult.success) {
      this.state.employeeLeaves = previousLeaves;
      throw new Error(saveResult.error || 'Failed to delete leave from SQLite database.');
    }
  }

  // Incentives Management
  public static getIncentives(month?: string): IncentiveRecord[] {
    const list = this.state.incentives || [];
    if (!month) return list;
    return list.filter(i => i.payrollMonth === month);
  }

  public static getIncentiveTotalForEmployee(employeeId: string, month: string): number {
    const records = (this.state.incentives || []).filter(
      i => i.employeeId === employeeId && i.payrollMonth === month
    );
    return records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }

  public static saveIncentive(incentive: Partial<IncentiveRecord>, userRole: string = 'Admin'): IncentiveRecord {
    if (!this.state.incentives) this.state.incentives = [];
    if (incentive.id && this.state.incentives.some(i => i.id === incentive.id)) {
      const idx = this.state.incentives.findIndex(i => i.id === incentive.id);
      this.state.incentives[idx] = { ...this.state.incentives[idx], ...incentive } as IncentiveRecord;
      this.logAudit('UPDATE_INCENTIVE', `Updated incentive for emp ${incentive.employeeId} (Rs. ${incentive.amount})`, userRole);
      this.saveToStorage(this.state);
      return this.state.incentives[idx];
    } else {
      const newInc: IncentiveRecord = {
        id: incentive.id || `inc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        employeeId: incentive.employeeId || '',
        payrollMonth: incentive.payrollMonth || new Date().toISOString().substring(0, 7),
        type: incentive.type || 'PRODUCTION',
        targetAmount: Number(incentive.targetAmount) || 0,
        achievementAmount: Number(incentive.achievementAmount) || 0,
        amount: Number(incentive.amount) || 0,
        description: incentive.description || 'Target Incentive',
        remarks: incentive.remarks || '',
        date: incentive.date || new Date().toISOString().substring(0, 10)
      };
      this.state.incentives.push(newInc);
      this.logAudit('ADD_INCENTIVE', `Recorded incentive for emp ${newInc.employeeId} of Rs. ${newInc.amount}`, userRole);
      this.saveToStorage(this.state);
      return newInc;
    }
  }

  public static deleteIncentive(id: string, userRole: string = 'Admin'): void {
    this.state.incentives = (this.state.incentives || []).filter(i => i.id !== id);
    this.deletedIds.incentives.push(id);
    this.logAudit('DELETE_INCENTIVE', `Removed incentive ${id}`, userRole);
    this.saveToStorage(this.state);
  }

  // Allowance Rules
  public static getAllowanceRules(): AllowanceDeductionRule[] {
    return this.state.allowanceRules || defaultAllowanceRules;
  }

  public static saveAllowanceRule(rule: AllowanceDeductionRule, userRole: string = 'Admin'): void {
    if (!this.state.allowanceRules) this.state.allowanceRules = [];
    const idx = this.state.allowanceRules.findIndex(r => r.id === rule.id);
    if (idx !== -1) {
      this.state.allowanceRules[idx] = rule;
    } else {
      this.state.allowanceRules.push(rule);
    }
    this.logAudit('UPDATE_ALLOWANCE_RULE', `Saved allowance deduction rule: ${rule.name}`, userRole);
    this.saveToStorage(this.state);
  }

  // Payroll Categories CRUD
  public static getPayrollCategories(): PayrollCategory[] {
    return this.state.payrollCategories || defaultCategories;
  }

  public static savePayrollCategory(categoryData: Partial<PayrollCategory>, userRole: string = 'Admin'): PayrollCategory {
    if (!this.state.payrollCategories) this.state.payrollCategories = [...defaultCategories];
    const name = (categoryData.name || '').trim();
    if (!name) {
      throw new Error('Payroll Category Name is required.');
    }

    const divisor = Number(categoryData.workingDaysDivisor) > 0 ? Number(categoryData.workingDaysDivisor) : 25;
    const otMult = Number(categoryData.defaultOtMultiplier) > 0 ? Number(categoryData.defaultOtMultiplier) : 1.5;
    const ruleId = categoryData.allowanceDeductionRuleId || (this.state.allowanceRules[0]?.id || 'rule-tiered-customer');

    let savedCat: PayrollCategory;
    if (categoryData.id && this.state.payrollCategories.some(c => c.id === categoryData.id)) {
      const idx = this.state.payrollCategories.findIndex(c => c.id === categoryData.id);
      savedCat = {
        ...this.state.payrollCategories[idx],
        ...categoryData,
        name,
        workingDaysDivisor: divisor,
        defaultOtMultiplier: otMult,
        allowanceDeductionRuleId: ruleId
      };
      this.state.payrollCategories[idx] = savedCat;
      this.logAudit('UPDATE_PAYROLL_CATEGORY', `Updated payroll category ${name}`, userRole);
    } else {
      savedCat = {
        id: categoryData.id || `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        code: categoryData.code || `CAT-0${this.state.payrollCategories.length + 1}`,
        description: categoryData.description || '',
        workingDaysDivisor: divisor,
        defaultOtMultiplier: otMult,
        allowanceDeductionRuleId: ruleId,
        epfRateEmployee: categoryData.epfRateEmployee !== undefined ? Number(categoryData.epfRateEmployee) : undefined,
        epfRateEmployer: categoryData.epfRateEmployer !== undefined ? Number(categoryData.epfRateEmployer) : undefined,
        etfRateEmployer: categoryData.etfRateEmployer !== undefined ? Number(categoryData.etfRateEmployer) : undefined
      };
      this.state.payrollCategories.push(savedCat);
      this.logAudit('ADD_PAYROLL_CATEGORY', `Created payroll category ${name} (${divisor} working days)`, userRole);
    }
    this.saveToStorage(this.state);
    return savedCat;
  }

  public static deletePayrollCategory(id: string, userRole: string = 'Admin'): { success: boolean; message?: string } {
    if (!this.state.payrollCategories) this.state.payrollCategories = [...defaultCategories];
    const hasAssigned = (this.state.employees || []).some(e => e.payrollCategoryId === id);
    if (hasAssigned) {
      return { success: false, message: 'Cannot delete category: Employees are currently assigned to this payroll category.' };
    }
    if (this.state.payrollCategories.length <= 1) {
      return { success: false, message: 'Cannot delete the only remaining payroll category.' };
    }
    this.state.payrollCategories = this.state.payrollCategories.filter(c => c.id !== id);
    this.deletedIds.payrollCategories.push(id);
    this.logAudit('DELETE_PAYROLL_CATEGORY', `Deleted payroll category ${id}`, userRole);
    this.saveToStorage(this.state);
    return { success: true };
  }

  // Payroll Periods
  public static getPayrollPeriods(): PayrollPeriod[] {
    return this.state.payrollPeriods || [];
  }

  public static getPayrollPeriod(month: string): PayrollPeriod | undefined {
    return (this.state.payrollPeriods || []).find(p => (p.monthYear === month || p.month === month));
  }

  public static savePayrollPeriod(period: PayrollPeriod, userRole: string = 'Admin'): void {
    if (!this.state.payrollPeriods) this.state.payrollPeriods = [];
    const monthKey = period.monthYear || period.month;
    const idx = this.state.payrollPeriods.findIndex(
      p => (p.monthYear === monthKey || p.month === monthKey)
    );
    if (idx !== -1) {
      this.state.payrollPeriods[idx] = period;
    } else {
      this.state.payrollPeriods.push(period);
    }
    this.logAudit('SAVE_PAYROLL', `Calculated and saved payroll for ${monthKey} (Net Rs. ${(period.totalNet ?? 0).toLocaleString()})`, userRole);
    this.saveToStorage(this.state);
  }

  // Audit Trail
  public static getAuditLogs(): AuditLog[] {
    return this.state.auditLogs || [];
  }

  // Backup & Restore
  public static backupDatabase(): string {
    this.logAudit('BACKUP_DATABASE', 'Generated local database backup snapshot.');
    return JSON.stringify(this.state, null, 2);
  }

  public static restoreDatabase(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString) as DatabaseState;
      if (!parsed.companySettings) {
        return { success: false, message: 'Invalid backup file structure. Missing companySettings.' };
      }
      this.state = {
        version: parsed.version || 3,
        lastUpdated: new Date().toISOString(),
        companySettings: parsed.companySettings,
        users: parsed.users || [],
        departments: parsed.departments || defaultDepartments,
        designations: parsed.designations || defaultDesignations,
        employees: parsed.employees || [],
        devices: parsed.devices || defaultDevices,
        rawPunches: parsed.rawPunches || [],
        processedAttendance: parsed.processedAttendance || [],
        leaveTypes: parsed.leaveTypes || defaultLeaveTypes,
        employeeLeaves: parsed.employeeLeaves || [],
        incentives: parsed.incentives || [],
        allowanceRules: parsed.allowanceRules || defaultAllowanceRules,
        payrollCategories: parsed.payrollCategories || defaultCategories,
        payrollPeriods: parsed.payrollPeriods || [],
        auditLogs: parsed.auditLogs || [],
        holidays: parsed.holidays?.length ? parsed.holidays : defaultHolidays,
        monthlyWorkingDays: parsed.monthlyWorkingDays || []
      };
      this.saveToStorage(this.state);
      this.logAudit('RESTORE_DATABASE', `Restored database (${this.state.employees.length} employees, ${this.state.payrollPeriods.length} payroll periods).`);
      return { success: true, message: `Successfully restored ${this.state.employees.length} employees and related records.` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  // Holiday Calendar & Monthly Working Days Methods
  public static getHolidays(): Holiday[] {
    return this.state.holidays || defaultHolidays;
  }

  public static async saveHoliday(holiday: Holiday | Omit<Holiday, 'id'>, userRole: string = 'Admin'): Promise<Holiday> {
    if (!this.state.holidays) this.state.holidays = [...defaultHolidays];
    const existingId = (holiday as any).id;
    const duplicate = this.state.holidays.find(h => h.date === holiday.date && h.id !== existingId);
    if (duplicate) {
      throw new Error(`Holiday already exists for this date (${holiday.date}: ${duplicate.name}).`);
    }

    let saved: Holiday;
    if (existingId && this.state.holidays.some(h => h.id === existingId)) {
      const idx = this.state.holidays.findIndex(h => h.id === existingId);
      saved = { ...this.state.holidays[idx], ...holiday } as Holiday;
      this.state.holidays[idx] = saved;
      this.logAudit('UPDATE_HOLIDAY', `Updated holiday ${saved.name} on ${saved.date}`, userRole);
    } else {
      saved = {
        ...(holiday as any),
        id: (holiday as any).id || `hol-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        year: parseInt(holiday.date.substring(0, 4), 10) || new Date().getFullYear()
      };
      this.state.holidays.push(saved);
      this.logAudit('ADD_HOLIDAY', `Added holiday ${saved.name} on ${saved.date} (${saved.type})`, userRole);
    }

    await this.saveToStorage(this.state);
    return saved;
  }

  public static async deleteHoliday(id: string, userRole: string = 'Admin'): Promise<void> {
    const h = (this.state.holidays || []).find(x => x.id === id);
    this.state.holidays = (this.state.holidays || []).filter(x => x.id !== id);
    this.deletedIds.holidays.push(id);
    this.logAudit('DELETE_HOLIDAY', `Deleted holiday ${h?.name || id} on ${h?.date}`, userRole);
    await this.saveToStorage(this.state);
  }

  public static calculateWorkingDaysForMonth(year: number, monthNum: number): {
    calendarDays: number;
    sundaysCount: number;
    poyaCount: number;
    publicHolidayCount: number;
    mercantileHolidayCount: number;
    autoWorkingDays: number;
  } {
    const calendarDays = new Date(year, monthNum, 0).getDate();
    let sundaysCount = 0;
    let poyaCount = 0;
    let publicHolidayCount = 0;
    let mercantileHolidayCount = 0;

    const holidays = this.state.holidays || defaultHolidays;
    const monthStr = String(monthNum).padStart(2, '0');
    const prefix = `${year}-${monthStr}`;
    const nonWorkingDates = new Set<string>();

    for (let day = 1; day <= calendarDays; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${prefix}-${dayStr}`;
      const d = new Date(year, monthNum - 1, day);
      const isSunday = d.getDay() === 0;

      if (isSunday) {
        sundaysCount++;
        nonWorkingDates.add(dateStr);
      }

      const dayHolidays = holidays.filter(h => h.date === dateStr);
      for (const h of dayHolidays) {
        if (h.type === 'Poya') poyaCount++;
        else if (h.type === 'Public') publicHolidayCount++;
        else if (h.type === 'Mercantile') mercantileHolidayCount++;
        nonWorkingDates.add(dateStr);
      }
    }

    const autoWorkingDays = Math.max(0, calendarDays - nonWorkingDates.size);
    return {
      calendarDays,
      sundaysCount,
      poyaCount,
      publicHolidayCount,
      mercantileHolidayCount,
      autoWorkingDays
    };
  }

  public static getMonthlyWorkingDaysConfig(monthYear: string): MonthlyWorkingDaysConfig {
    if (!this.state.monthlyWorkingDays) this.state.monthlyWorkingDays = [];
    const found = this.state.monthlyWorkingDays.find(m => m.month === monthYear);
    if (found) {
      if (found.finalWorkingDays === undefined) {
        found.finalWorkingDays = found.manualOverride ? found.manualWorkingDays : found.autoWorkingDays;
      }
      // Fail-safe if it's still 0 or falsy due to some bad state
      if (!found.finalWorkingDays) {
        const [y, m] = monthYear.split('-');
        const calc = this.calculateWorkingDaysForMonth(parseInt(y, 10), parseInt(m, 10));
        found.autoWorkingDays = calc.autoWorkingDays;
        found.finalWorkingDays = found.manualOverride ? (found.manualWorkingDays || calc.autoWorkingDays) : calc.autoWorkingDays;
      }
      return found;
    }

    const [yearStr, monthStr] = monthYear.split('-');
    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    const monthNumber = parseInt(monthStr, 10) || (new Date().getMonth() + 1);

    const calc = this.calculateWorkingDaysForMonth(year, monthNumber);
    const config: MonthlyWorkingDaysConfig = {
      id: `mwd-${year}-${monthStr}`,
      year,
      month: monthYear,
      ...calc,
      manualOverride: false,
      manualWorkingDays: calc.autoWorkingDays,
      finalWorkingDays: calc.autoWorkingDays,
      updatedBy: 'System',
      updatedAt: new Date().toISOString()
    };
    this.state.monthlyWorkingDays.push(config);
    return config;
  }

  public static async saveMonthlyWorkingDaysConfig(config: MonthlyWorkingDaysConfig, userRole: string = 'Admin'): Promise<MonthlyWorkingDaysConfig> {
    if (!this.state.monthlyWorkingDays) this.state.monthlyWorkingDays = [];
    const idx = this.state.monthlyWorkingDays.findIndex(m => m.month === config.month);

    if (config.manualWorkingDays < 0 || config.manualWorkingDays > config.calendarDays) {
      throw new Error(`Manual Working Days cannot be less than 0 or greater than total calendar days (${config.calendarDays}).`);
    }

    const finalDays = config.manualOverride ? config.manualWorkingDays : config.autoWorkingDays;
    const updated: MonthlyWorkingDaysConfig = {
      ...config,
      finalWorkingDays: finalDays,
      updatedAt: new Date().toISOString()
    };

    if (idx !== -1) {
      this.state.monthlyWorkingDays[idx] = updated;
    } else {
      this.state.monthlyWorkingDays.push(updated);
    }

    this.logAudit('UPDATE_WORKING_DAYS', `Updated working days for ${config.month}: Final = ${finalDays} (Manual Override: ${config.manualOverride})`, userRole);
    await this.saveToStorage(this.state);
    return updated;
  }

  public static resetToCleanDatabase(userRole: string = 'Admin'): void {
    this.state = getInitialDatabase();
    this.logAudit('DATABASE_RESET', 'Cleared all application records and initialized empty production database.', userRole);
    this.saveToStorage(this.state);
    if (typeof window !== 'undefined' && window.electronAPI?.dbClear) {
      window.electronAPI.dbClear().catch(() => {});
    }
  }

  public static loadSampleDataset(userRole: string = 'Admin'): void {
    const todayStr = new Date().toISOString().substring(0, 10);
    const curMonth = todayStr.substring(0, 7);

    const sampleEmployees: Employee[] = [
      {
        id: 'emp-test-01',
        employeeCode: 'TEST001',
        fullName: 'Kamal Bandara',
        nameSinhala: 'කමල් බණ්ඩාර',
        nameTamil: 'கமல் பண்டார',
        nic: '198812400921',
        dob: '1988-05-12',
        gender: 'MALE',
        address: 'No. 24, Temple Road, Kalutara, Sri Lanka',
        telephone: '+94 77 123 4567',
        email: 'kamal.b@lankamanufacturing.lk',
        departmentId: 'dept-01',
        designationId: 'des-01',
        joinDate: '2023-01-15',
        employmentStatus: 'PERMANENT',
        epfNumber: 'EPF-1001',
        basicSalary: 30000,
        fixedAllowance: 5000,
        otherAllowance: 0,
        bankName: 'Bank of Ceylon',
        bankAccountNumber: '0089124578',
        branch: 'Kalutara South',
        payrollCategoryId: 'cat-01',
        workingDaysPerMonth: 25,
        normalWorkingHours: 8,
        otRateType: '1.5X_STANDARD',
        fingerprintUserId: 'TEST001',
        isActive: true
      },
      {
        id: 'emp-test-02',
        employeeCode: 'TEST002',
        fullName: 'Nimal Perera',
        nameSinhala: 'නිමල් පෙරේරා',
        nameTamil: 'நிமல் பெரேரா',
        nic: '199245100342',
        dob: '1992-08-20',
        gender: 'MALE',
        address: 'No. 112, Kandy Road, Kiribathgoda',
        telephone: '+94 71 890 1234',
        email: 'nimal.p@lankamanufacturing.lk',
        departmentId: 'dept-01',
        designationId: 'des-02',
        joinDate: '2022-06-01',
        employmentStatus: 'PERMANENT',
        epfNumber: 'EPF-1002',
        basicSalary: 35000,
        fixedAllowance: 6000,
        otherAllowance: 0,
        bankName: 'Commercial Bank of Ceylon',
        bankAccountNumber: '1004589214',
        branch: 'Kiribathgoda',
        payrollCategoryId: 'cat-01',
        workingDaysPerMonth: 25,
        normalWorkingHours: 8,
        otRateType: '1.5X_STANDARD',
        fingerprintUserId: 'TEST002',
        isActive: true
      },
      {
        id: 'emp-test-03',
        employeeCode: 'TEST003',
        fullName: 'Sunil Jayawardena',
        nameSinhala: 'සුනිල් ජයවර්ධන',
        nameTamil: 'சுனில் ஜெயவர்தன',
        nic: '199078200119',
        dob: '1990-11-04',
        gender: 'MALE',
        address: 'No. 58, Galle Road, Moratuwa',
        telephone: '+94 76 345 6789',
        email: 'sunil.j@lankamanufacturing.lk',
        departmentId: 'dept-02',
        designationId: 'des-03',
        joinDate: '2023-04-10',
        employmentStatus: 'PERMANENT',
        epfNumber: 'EPF-1003',
        basicSalary: 32000,
        fixedAllowance: 5000,
        otherAllowance: 0,
        bankName: 'Hatton National Bank',
        bankAccountNumber: '0981245671',
        branch: 'Moratuwa',
        payrollCategoryId: 'cat-01',
        workingDaysPerMonth: 25,
        normalWorkingHours: 8,
        otRateType: '1.5X_STANDARD',
        fingerprintUserId: 'TEST003',
        isActive: true
      },
      {
        id: 'emp-test-04',
        employeeCode: 'TEST004',
        fullName: 'Anusha Fernando',
        nameSinhala: 'අනුෂා ප්‍රනාන්දු',
        nameTamil: 'அனுஷா பெர்னாண்டோ',
        nic: '199462300451',
        dob: '1994-03-18',
        gender: 'FEMALE',
        address: 'No. 15, Negombo Road, Ja-Ela',
        telephone: '+94 72 456 7890',
        email: 'anusha.f@lankamanufacturing.lk',
        departmentId: 'dept-04',
        designationId: 'des-05',
        joinDate: '2023-08-01',
        employmentStatus: 'PERMANENT',
        epfNumber: 'EPF-1004',
        basicSalary: 40000,
        fixedAllowance: 8000,
        otherAllowance: 0,
        bankName: 'People\'s Bank',
        bankAccountNumber: '2045891234',
        branch: 'Ja-Ela',
        payrollCategoryId: 'cat-02',
        workingDaysPerMonth: 25,
        normalWorkingHours: 8,
        otRateType: '1.5X_STANDARD',
        fingerprintUserId: 'TEST004',
        isActive: true
      }
    ];

    const sampleIncentives: IncentiveRecord[] = [
      {
        id: 'inc-01',
        employeeId: 'emp-test-01',
        payrollMonth: curMonth,
        type: 'PRODUCTION',
        targetAmount: 5000,
        achievementAmount: 5500,
        amount: 3500,
        description: 'Monthly Factory Unit Output Target Exceeded (+10%)',
        remarks: 'Approved by Plant Manager',
        date: todayStr
      },
      {
        id: 'inc-02',
        employeeId: 'emp-test-02',
        payrollMonth: curMonth,
        type: 'ATTENDANCE',
        targetAmount: 25,
        achievementAmount: 25,
        amount: 2000,
        description: 'Full Monthly Attendance Bonus',
        remarks: 'Zero unplanned absence in first half',
        date: todayStr
      }
    ];

    this.state = {
      ...this.state,
      employees: sampleEmployees,
      incentives: sampleIncentives
    };

    this.logAudit('LOAD_SAMPLE_DATA', 'Loaded 4 Sri Lankan test employees and incentives for workflow verification.', userRole);
    this.saveToStorage(this.state);
  }
}

export const db = DatabaseService;
