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
  IncentiveRecord
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
  normalWorkingHoursPerDay: 8,
  defaultWorkingHours: 8,
  shiftStartTime: '08:30',
  shiftEndTime: '17:00',
  lateGraceMinutes: 15,
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

function getInitialDatabase(): DatabaseState {
  const initialAuditLogs: AuditLog[] = [
    {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'Admin',
      userRole: 'Admin',
      action: 'SYSTEM_INIT',
      details: 'Clean SQLite database initialized with Sri Lankan statutory framework.'
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
    auditLogs: initialAuditLogs
  };
}

export class DatabaseService {
  private static state: DatabaseState = DatabaseService.loadFromStorage();
  private static isInitialized = false;

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

  public static saveToStorage(state: DatabaseState): void {
    try {
      state.lastUpdated = new Date().toISOString();
      const serialized = JSON.stringify(state);

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, serialized);
      }

      // Sync directly to SQLite database via Electron IPC
      if (typeof window !== 'undefined' && window.electronAPI?.dbSaveAll) {
        window.electronAPI.dbSaveAll(state).then(res => {
          if (!res.success) {
            console.error('[DatabaseService] Electron SQLite write error:', res.error);
          }
        }).catch(err => {
          console.error('[DatabaseService] IPC dbSaveAll error:', err);
        });
      }
    } catch (err) {
      console.error('[DatabaseService] Failed to persist database:', err);
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

  public static saveEmployee(employeeData: Partial<Employee>, userRole: string = 'Admin'): Employee {
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

    this.saveToStorage(this.state);
    console.log('[EMPLOYEE_SAVE] DATABASE_SAVE_SUCCESS', {
      id: savedEmployee.id,
      employeeCode: savedEmployee.employeeCode,
      totalEmployees: this.state.employees.length
    });

    return savedEmployee;
  }

  public static deleteEmployee(id: string, userRole: string = 'Admin'): void {
    const emp = this.getEmployeeById(id);
    this.state.employees = this.state.employees.filter(e => e.id !== id);
    this.logAudit('DELETE_EMPLOYEE', `Deleted employee ${emp?.employeeCode || id}`, userRole);
    this.saveToStorage(this.state);
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
    this.logAudit('DELETE_DEVICE', `Removed device ${id}`, userRole);
    this.saveToStorage(this.state);
  }

  // Raw Punches
  public static getRawPunches(): RawAttendancePunch[] {
    return this.state.rawPunches || [];
  }

  public static saveRawPunches(punches: RawAttendancePunch[], userRole: string = 'Admin'): void {
    if (!this.state.rawPunches) this.state.rawPunches = [];
    const existingKeys = new Set(
      this.state.rawPunches.map(p => `${p.deviceId}_${p.deviceUserId}_${p.punchTimestamp}_${p.punchType}`)
    );
    const newPunches = punches.filter(
      p => !existingKeys.has(`${p.deviceId}_${p.deviceUserId}_${p.punchTimestamp}_${p.punchType}`)
    );
    this.state.rawPunches.push(...newPunches);
    this.logAudit('DOWNLOAD_PUNCHES', `Downloaded ${newPunches.length} raw punches from biometric terminal.`, userRole);
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

  public static saveLeave(leave: Omit<EmployeeLeave, 'id'> | EmployeeLeave, userRole: string = 'Admin'): EmployeeLeave {
    if (!this.state.employeeLeaves) this.state.employeeLeaves = [];
    const existingId = (leave as EmployeeLeave).id;
    if (existingId && this.state.employeeLeaves.some(l => l.id === existingId)) {
      const idx = this.state.employeeLeaves.findIndex(l => l.id === existingId);
      this.state.employeeLeaves[idx] = { ...this.state.employeeLeaves[idx], ...leave } as EmployeeLeave;
      this.logAudit('UPDATE_LEAVE', `Updated leave record for emp ${leave.employeeId}`, userRole);
      this.saveToStorage(this.state);
      return this.state.employeeLeaves[idx];
    } else {
      const newLeave: EmployeeLeave = {
        ...leave,
        id: `leave-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
      };
      this.state.employeeLeaves.push(newLeave);
      this.logAudit('APPLY_LEAVE', `Applied leave for emp ${leave.employeeId} (${leave.daysCount} days)`, userRole);
      this.saveToStorage(this.state);
      return newLeave;
    }
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

  public static deleteLeave(id: string, userRole: string = 'Admin'): void {
    this.state.employeeLeaves = (this.state.employeeLeaves || []).filter(l => l.id !== id);
    this.logAudit('DELETE_LEAVE', `Deleted leave application ${id}`, userRole);
    this.saveToStorage(this.state);
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
        auditLogs: parsed.auditLogs || []
      };
      this.saveToStorage(this.state);
      this.logAudit('RESTORE_DATABASE', `Restored database (${this.state.employees.length} employees, ${this.state.payrollPeriods.length} payroll periods).`);
      return { success: true, message: `Successfully restored ${this.state.employees.length} employees and related records.` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
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
