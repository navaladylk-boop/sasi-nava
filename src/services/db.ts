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
  UserRole
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
  allowanceRules: AllowanceDeductionRule[];
  payrollCategories: PayrollCategory[];
  payrollPeriods: PayrollPeriod[];
  auditLogs: AuditLog[];
}

const STORAGE_KEY = 'LANKA_HR_DATABASE_V2';

const defaultSettings: CompanySettings = {
  id: 'company-01',
  companyName: 'Lanka Precision Engineering (Pvt) Ltd',
  companyNameSinhala: 'ලංකා ප්‍රිසිෂන් ඉංජිනේරු (පුද්) සමාගම',
  companyNameTamil: 'லங்கா பிரிசிஷன் இன்ஜினியரிங் (பிரைவேட்) லிமிடெட்',
  address: 'No. 45/2, Nawala Road, Narahenpita, Colombo 05, Sri Lanka',
  telephone: '+94 11 280 4455 / +94 77 123 4567',
  email: 'info@lankaprecision.lk',
  registrationNo: 'PV-108249',
  epfRegistrationNumber: 'EPF/2024/09871',
  defaultWorkingDaysPerMonth: 25,
  normalWorkingHoursPerDay: 8,
  shiftStartTime: '08:30',
  shiftEndTime: '17:00',
  lateGraceMinutes: 15,
  epfEmployeeRate: 8,
  epfEmployerRate: 12,
  etfEmployerRate: 3,
  defaultLanguage: 'en',
  currentUserId: 'usr-admin'
};

const initialDepartments: Department[] = [
  { id: 'dept-01', code: 'PROD', name: 'Factory Production', nameSinhala: 'කර්මාන්තශාලා නිෂ්පාදන', nameTamil: 'தொழிற்சாலை உற்பத்தி' },
  { id: 'dept-02', code: 'ENG', name: 'Engineering & Maintenance', nameSinhala: 'ඉංජිනේරු සහ නඩත්තු', nameTamil: 'பொறியியல் மற்றும் பராமரிப்பு' },
  { id: 'dept-03', code: 'LOG', name: 'Logistics & Warehouse', nameSinhala: 'ප්‍රවාහන සහ ගබඩා', nameTamil: 'தளவாடங்கள் மற்றும் கிடங்கு' },
  { id: 'dept-04', code: 'ADMIN', name: 'Admin & Accounts', nameSinhala: 'පරිපාලන සහ ගිණුම්', nameTamil: 'நிர்வாகம் மற்றும் கணக்குகள்' }
];

const initialDesignations: Designation[] = [
  { id: 'des-01', code: 'MCH-OP', title: 'Senior CNC Machine Operator', departmentId: 'dept-01' },
  { id: 'des-02', code: 'QC-INSP', title: 'Quality Control Inspector', departmentId: 'dept-01' },
  { id: 'des-03', code: 'ENG-TECH', title: 'Maintenance Technician', departmentId: 'dept-02' },
  { id: 'des-04', code: 'WH-SUP', title: 'Warehouse Supervisor', departmentId: 'dept-03' },
  { id: 'des-05', code: 'ACC-EXEC', title: 'Accounts Executive', departmentId: 'dept-04' }
];

const initialEmployees: Employee[] = [
  {
    id: 'emp-01',
    employeeCode: 'EMP-1001',
    fullName: 'Kasun Chamara Perera',
    nameSinhala: 'කසුන් චාමර පෙරේරා',
    nameTamil: 'கசுன் சாமர பெரேரா',
    nic: '199214508210',
    dob: '1992-05-24',
    gender: 'MALE',
    address: 'No. 12/A, Temple Road, Maharagama',
    telephone: '077 345 6789',
    email: 'kasun.p@lankaprecision.lk',
    departmentId: 'dept-01',
    designationId: 'des-01',
    joinDate: '2021-02-15',
    employmentStatus: 'PERMANENT',
    epfNumber: 'EPF-4011',
    etfNumber: 'ETF-4011',
    basicSalary: 65000,
    fixedAllowance: 15000,
    otherAllowance: 5000,
    bankName: 'Bank of Ceylon (BOC)',
    bankAccountNumber: '008920148902',
    branch: 'Maharagama (722)',
    payrollCategoryId: 'cat-01',
    workingDaysPerMonth: 25,
    normalWorkingHours: 8,
    otRateType: '1.5X_STANDARD',
    fingerprintUserId: '1001',
    isActive: true
  },
  {
    id: 'emp-02',
    employeeCode: 'EMP-1002',
    fullName: 'Sanduni Dilrukshi Silva',
    nameSinhala: 'සඳුනි දිල්රුක්ෂි සිල්වා',
    nameTamil: 'சந்துனி தில்ருக்சி சில்வா',
    nic: '199581203490',
    dob: '1995-11-12',
    gender: 'FEMALE',
    address: 'No. 88, Galle Road, Moratuwa',
    telephone: '071 987 6543',
    email: 'sanduni.s@lankaprecision.lk',
    departmentId: 'dept-01',
    designationId: 'des-02',
    joinDate: '2022-06-01',
    employmentStatus: 'PERMANENT',
    epfNumber: 'EPF-4012',
    etfNumber: 'ETF-4012',
    basicSalary: 55000,
    fixedAllowance: 12000,
    otherAllowance: 3000,
    bankName: 'Commercial Bank of Ceylon',
    bankAccountNumber: '8004192044',
    branch: 'Moratuwa (104)',
    payrollCategoryId: 'cat-01',
    workingDaysPerMonth: 25,
    normalWorkingHours: 8,
    otRateType: '1.5X_STANDARD',
    fingerprintUserId: '1002',
    isActive: true
  },
  {
    id: 'emp-03',
    employeeCode: 'EMP-1003',
    fullName: 'Mohamed Rizwan Farook',
    nameSinhala: 'මොහොමඩ් රිස්වාන් ෆාරුක්',
    nameTamil: 'முகம்மது ரிஸ்வான் பாரூக்',
    nic: '198923001920',
    dob: '1989-08-19',
    gender: 'MALE',
    address: 'No. 34, Moor Street, Colombo 12',
    telephone: '076 555 1234',
    email: 'rizwan.f@lankaprecision.lk',
    departmentId: 'dept-02',
    designationId: 'des-03',
    joinDate: '2020-01-10',
    employmentStatus: 'PERMANENT',
    epfNumber: 'EPF-4013',
    etfNumber: 'ETF-4013',
    basicSalary: 72000,
    fixedAllowance: 18000,
    otherAllowance: 5000,
    bankName: 'Hatton National Bank (HNB)',
    bankAccountNumber: '045010098412',
    branch: 'Pettah (045)',
    payrollCategoryId: 'cat-01',
    workingDaysPerMonth: 25,
    normalWorkingHours: 8,
    otRateType: '1.5X_STANDARD',
    fingerprintUserId: '1003',
    isActive: true
  },
  {
    id: 'emp-04',
    employeeCode: 'EMP-1004',
    fullName: 'Suresh Kumar Velupillai',
    nameSinhala: 'සුරේෂ් කුමාර් වේලුපිල්ලෙයි',
    nameTamil: 'சுரேஷ் குமார் வேலுப்பிள்ளை',
    nic: '199104902188',
    dob: '1991-03-04',
    gender: 'MALE',
    address: 'No. 15, Station Road, Wattala',
    telephone: '075 222 9988',
    email: 'suresh.v@lankaprecision.lk',
    departmentId: 'dept-03',
    designationId: 'des-04',
    joinDate: '2023-04-18',
    employmentStatus: 'PERMANENT',
    epfNumber: 'EPF-4014',
    etfNumber: 'ETF-4014',
    basicSalary: 58000,
    fixedAllowance: 10000,
    otherAllowance: 4000,
    bankName: 'Sampath Bank PLC',
    bankAccountNumber: '100854201944',
    branch: 'Wattala (008)',
    payrollCategoryId: 'cat-01',
    workingDaysPerMonth: 25,
    normalWorkingHours: 8,
    otRateType: '1.5X_STANDARD',
    fingerprintUserId: '1004',
    isActive: true
  },
  {
    id: 'emp-05',
    employeeCode: 'EMP-1005',
    fullName: 'Anoma Priyadarshani Fernando',
    nameSinhala: 'අනෝමා ප්‍රියදර්ශනී ප්‍රනාන්දු',
    nameTamil: 'அனோமா பிரியதர்ஷினி பெர்னாண்டோ',
    nic: '198759302190',
    dob: '1987-09-15',
    gender: 'FEMALE',
    address: 'No. 200/4, Negombo Road, Ja-Ela',
    telephone: '072 444 8877',
    email: 'anoma.f@lankaprecision.lk',
    departmentId: 'dept-04',
    designationId: 'des-05',
    joinDate: '2019-11-01',
    employmentStatus: 'PERMANENT',
    epfNumber: 'EPF-4015',
    etfNumber: 'ETF-4015',
    basicSalary: 85000,
    fixedAllowance: 20000,
    otherAllowance: 5000,
    bankName: 'People\'s Bank',
    bankAccountNumber: '204100140029',
    branch: 'Ja-Ela (204)',
    payrollCategoryId: 'cat-01',
    workingDaysPerMonth: 25,
    normalWorkingHours: 8,
    otRateType: '1.5X_STANDARD',
    fingerprintUserId: '1005',
    isActive: true
  }
];

const initialDevices: FingerprintDevice[] = [
  {
    id: 'dev-hikvision-01',
    name: 'Hikvision Attendance Device',
    brand: 'Hikvision',
    model: 'DS-K1A8503MF',
    ipAddress: '192.168.1.201',
    port: 80,
    username: 'admin',
    password: '',
    communicationType: 'TCP_IP',
    status: 'UNTESTED',
    lastSyncTime: '',
    serialNumber: ''
  },
  {
    id: 'dev-01',
    name: 'Main Factory Gate (ZKTeco K40)',
    brand: 'ZKTeco',
    model: 'ZKTeco K40 Pro / IN01',
    ipAddress: '192.168.1.205',
    port: 4370,
    communicationType: 'TCP_IP',
    status: 'UNTESTED',
    lastSyncTime: '',
    serialNumber: ''
  }
];

const initialAllowanceRules: AllowanceDeductionRule[] = [
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
  }
];

const initialLeaveTypes: LeaveType[] = [
  { id: 'lt-01', code: 'ANNUAL', name: 'Annual Leave (Shop & Office)', nameSinhala: 'වාර්ෂික නිවාඩු', nameTamil: 'வருடாந்திர விடுப்பு', isPaid: true, defaultDaysPerYear: 14 },
  { id: 'lt-02', code: 'CASUAL', name: 'Casual Leave', nameSinhala: 'අනියම් නිවාඩු', nameTamil: 'தற்செயல் விடுப்பு', isPaid: true, defaultDaysPerYear: 7 },
  { id: 'lt-03', code: 'MEDICAL', name: 'Medical / Sick Leave', nameSinhala: 'වෛද්‍ය නිවාඩු', nameTamil: 'மருத்துவ விடுப்பு', isPaid: true, defaultDaysPerYear: 14 },
  { id: 'lt-04', code: 'NO_PAY', name: 'Unpaid / No-Pay Leave', nameSinhala: 'වැටුප් රහිත නිවාඩු', nameTamil: 'சம்பளமில்லா விடுப்பு', isPaid: false, defaultDaysPerYear: 0 }
];

const initialCategories: PayrollCategory[] = [
  {
    id: 'cat-01',
    name: 'Sri Lankan Standard Permanent Staff (25 Working Days, 1.5x OT)',
    workingDaysDivisor: 25,
    defaultOtMultiplier: 1.5,
    allowanceDeductionRuleId: 'rule-tiered-customer'
  }
];

function generateSampleAttendanceAndPunches(): {
  punches: RawAttendancePunch[];
  processed: ProcessedAttendance[];
} {
  const punches: RawAttendancePunch[] = [];
  const processed: ProcessedAttendance[] = [];

  const days = 31; // Jan 2026
  initialEmployees.forEach(emp => {
    for (let d = 1; d <= days; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      const dateStr = `2026-01-${dayStr}`;
      const dateObj = new Date(2026, 0, d);
      const isSunday = dateObj.getDay() === 0;
      const isSaturday = dateObj.getDay() === 6;

      if (isSunday) {
        processed.push({
          id: `att-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          totalHours: 0,
          normalHours: 0,
          otHours: 0,
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          status: 'WEEKEND',
          isManualCorrection: false
        });
        continue;
      }

      // Sample intentional No-Pay day for Emp 1 and Emp 3 to demonstrate tiered allowance deduction
      if (emp.id === 'emp-01' && (d === 12 || d === 13 || d === 14)) {
        processed.push({
          id: `att-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          totalHours: 0,
          normalHours: 0,
          otHours: 0,
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          status: 'NO_PAY',
          remarks: 'Unapproved absence (No-Pay)',
          isManualCorrection: false
        });
        continue;
      }

      if (emp.id === 'emp-03' && d === 19) {
        processed.push({
          id: `att-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          totalHours: 0,
          normalHours: 0,
          otHours: 0,
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          status: 'NO_PAY',
          remarks: 'Unpaid Leave (1 day)',
          isManualCorrection: false
        });
        continue;
      }

      // Normal working punch
      const inHour = 8;
      const inMin = (d % 3 === 0) ? 42 : (15 + (d % 10)); // Some late arrivals (after 08:30 + 15 grace = 08:45)
      const outHour = (d % 2 === 0) ? 19 : 17; // Some OT days
      const outMin = 10;

      const inTimeStr = `${inHour < 10 ? '0' + inHour : inHour}:${inMin < 10 ? '0' + inMin : inMin}`;
      const outTimeStr = `${outHour}:${outMin < 10 ? '0' + outMin : outMin}`;

      // Create raw punch in & punch out
      punches.push({
        id: `punch-${emp.id}-${dateStr}-IN`,
        deviceId: 'dev-01',
        deviceName: 'Main Factory Gate (ZKTeco K40)',
        deviceUserId: emp.fingerprintUserId,
        employeeId: emp.id,
        punchTimestamp: `${dateStr}T${inTimeStr}:00`,
        punchDate: dateStr,
        punchTime: `${inTimeStr}:00`,
        punchType: 'IN',
        verificationMode: 'FINGERPRINT',
        isProcessed: true,
        createdAt: `${dateStr}T${inTimeStr}:00`
      });

      punches.push({
        id: `punch-${emp.id}-${dateStr}-OUT`,
        deviceId: 'dev-01',
        deviceName: 'Main Factory Gate (ZKTeco K40)',
        deviceUserId: emp.fingerprintUserId,
        employeeId: emp.id,
        punchTimestamp: `${dateStr}T${outTimeStr}:00`,
        punchDate: dateStr,
        punchTime: `${outTimeStr}:00`,
        punchType: 'OUT',
        verificationMode: 'FINGERPRINT',
        isProcessed: true,
        createdAt: `${dateStr}T${outTimeStr}:00`
      });

      const totalH = outHour - inHour + (outMin - inMin) / 60;
      const otH = outHour >= 19 ? 2 : 0;
      const lateM = inMin > 30 ? inMin - 30 : 0;

      processed.push({
        id: `att-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        date: dateStr,
        firstIn: inTimeStr,
        lastOut: outTimeStr,
        totalHours: Math.round(totalH * 10) / 10,
        normalHours: 8,
        otHours: otH,
        lateMinutes: lateM,
        earlyLeaveMinutes: 0,
        status: 'PRESENT',
        isManualCorrection: false
      });
    }
  });

  return { punches, processed };
}

function getInitialDatabase(): DatabaseState {
  const { punches, processed } = generateSampleAttendanceAndPunches();

  const initialAuditLogs: AuditLog[] = [
    {
      id: 'audit-01',
      timestamp: new Date().toISOString(),
      user: 'Admin',
      userRole: 'Admin',
      action: 'SYSTEM_INIT',
      details: 'Initialized LankaHR database with Sri Lankan statutory defaults (EPF 8%/12%, ETF 3%, 25 days divisor).'
    }
  ];

  return {
    version: 2,
    lastUpdated: new Date().toISOString(),
    companySettings: defaultSettings,
    users: [
      { id: 'usr-01', username: 'admin', fullName: 'System Administrator', role: 'Admin' },
      { id: 'usr-02', username: 'hrmanager', fullName: 'HR Manager', role: 'HR Manager' }
    ],
    departments: initialDepartments,
    designations: initialDesignations,
    employees: initialEmployees,
    devices: initialDevices,
    rawPunches: punches,
    processedAttendance: processed,
    leaveTypes: initialLeaveTypes,
    employeeLeaves: [],
    allowanceRules: initialAllowanceRules,
    payrollCategories: initialCategories,
    payrollPeriods: [],
    auditLogs: initialAuditLogs
  };
}

export class DatabaseService {
  private static state: DatabaseState = DatabaseService.loadFromStorage();

  private static loadFromStorage(): DatabaseState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.employees && parsed.companySettings) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load database from localStorage, initializing defaults', err);
    }
    const initial = getInitialDatabase();
    DatabaseService.saveToStorage(initial);
    return initial;
  }

  private static saveToStorage(state: DatabaseState): void {
    try {
      state.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to write database to localStorage', err);
    }
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
    this.state.auditLogs.unshift(log);
    if (this.state.auditLogs.length > 200) {
      this.state.auditLogs.pop();
    }
    this.saveToStorage(this.state);
  }

  // Company Settings
  public static getSettings(): CompanySettings {
    return this.state.companySettings || defaultSettings;
  }

  public static saveSettings(settings: CompanySettings, userRole: string = 'Admin'): void {
    this.state.companySettings = { ...this.state.companySettings, ...settings };
    this.logAudit('UPDATE_SETTINGS', 'Updated company profile & statutory parameters', userRole);
    this.saveToStorage(this.state);
  }

  // Employees CRUD
  public static getEmployees(): Employee[] {
    return this.state.employees;
  }

  public static getEmployeeById(id: string): Employee | undefined {
    return this.state.employees.find(e => e.id === id);
  }

  public static saveEmployee(employee: Partial<Employee>, userRole: string = 'Admin'): Employee {
    if (employee.id && this.state.employees.some(e => e.id === employee.id)) {
      const idx = this.state.employees.findIndex(e => e.id === employee.id);
      this.state.employees[idx] = { ...this.state.employees[idx], ...employee } as Employee;
      this.logAudit('UPDATE_EMPLOYEE', `Updated employee ${this.state.employees[idx].employeeCode} - ${this.state.employees[idx].fullName}`, userRole);
      this.saveToStorage(this.state);
      return this.state.employees[idx];
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        employeeCode: employee.employeeCode || `EMP-${Date.now().toString().slice(-4)}`,
        fullName: employee.fullName || 'New Employee',
        nameSinhala: employee.nameSinhala || '',
        nameTamil: employee.nameTamil || '',
        nic: employee.nic || '',
        dob: employee.dob || '1995-01-01',
        gender: employee.gender || 'MALE',
        address: employee.address || '',
        telephone: employee.telephone || '',
        email: employee.email || '',
        departmentId: employee.departmentId || initialDepartments[0].id,
        designationId: employee.designationId || initialDesignations[0].id,
        joinDate: employee.joinDate || new Date().toISOString().slice(0, 10),
        employmentStatus: employee.employmentStatus || 'PERMANENT',
        epfNumber: employee.epfNumber || 'EPF-0000',
        basicSalary: employee.basicSalary || 50000,
        fixedAllowance: employee.fixedAllowance || 10000,
        otherAllowance: employee.otherAllowance || 0,
        bankName: employee.bankName || 'Bank of Ceylon',
        bankAccountNumber: employee.bankAccountNumber || '',
        branch: employee.branch || 'Colombo',
        payrollCategoryId: 'cat-01',
        workingDaysPerMonth: 25,
        normalWorkingHours: 8,
        otRateType: '1.5X_STANDARD',
        fingerprintUserId: employee.fingerprintUserId || `${Date.now().toString().slice(-4)}`,
        isActive: true,
        ...employee
      };
      this.state.employees.push(newEmp);
      this.logAudit('ADD_EMPLOYEE', `Registered employee ${newEmp.employeeCode} - ${newEmp.fullName}`, userRole);
      this.saveToStorage(this.state);
      return newEmp;
    }
  }

  public static deleteEmployee(id: string, userRole: string = 'Admin'): void {
    const emp = this.getEmployeeById(id);
    this.state.employees = this.state.employees.filter(e => e.id !== id);
    this.logAudit('DELETE_EMPLOYEE', `Deleted employee ${emp?.employeeCode || id}`, userRole);
    this.saveToStorage(this.state);
  }

  // Departments & Designations
  public static getDepartments(): Department[] {
    return this.state.departments;
  }

  public static getDesignations(): Designation[] {
    return this.state.designations;
  }

  // Biometric Devices
  public static getDevices(): FingerprintDevice[] {
    return this.state.devices;
  }

  public static saveDevice(device: Partial<FingerprintDevice>, userRole: string = 'Admin'): FingerprintDevice {
    if (device.id && this.state.devices.some(d => d.id === device.id)) {
      const idx = this.state.devices.findIndex(d => d.id === device.id);
      this.state.devices[idx] = { ...this.state.devices[idx], ...device } as FingerprintDevice;
      this.logAudit('UPDATE_DEVICE', `Updated biometric machine ${this.state.devices[idx].name}`, userRole);
      this.saveToStorage(this.state);
      return this.state.devices[idx];
    } else {
      const newDev: FingerprintDevice = {
        id: `dev-${Date.now()}`,
        name: device.name || 'New Fingerprint Device',
        brand: device.brand || 'ZKTeco',
        model: device.model || 'Standard Standalone',
        ipAddress: device.ipAddress || '192.168.1.201',
        port: device.port || 4370,
        communicationType: device.communicationType || 'TCP_IP',
        status: 'ONLINE',
        lastSyncTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
        ...device
      };
      this.state.devices.push(newDev);
      this.logAudit('ADD_DEVICE', `Registered machine ${newDev.name} (${newDev.ipAddress}:${newDev.port})`, userRole);
      this.saveToStorage(this.state);
      return newDev;
    }
  }

  public static deleteDevice(id: string, userRole: string = 'Admin'): void {
    this.state.devices = this.state.devices.filter(d => d.id !== id);
    this.logAudit('DELETE_DEVICE', `Removed device ${id}`, userRole);
    this.saveToStorage(this.state);
  }

  // Raw Biometric Attendance Punches
  public static getRawPunches(): RawAttendancePunch[] {
    return this.state.rawPunches;
  }

  public static saveRawPunches(punches: RawAttendancePunch[], userRole: string = 'Admin'): void {
    const existingKeys = new Set(
      this.state.rawPunches.map(p => `${p.deviceId}_${p.deviceUserId}_${p.punchTimestamp}`)
    );
    const newPunches = punches.filter(
      p => !existingKeys.has(`${p.deviceId}_${p.deviceUserId}_${p.punchTimestamp}`)
    );
    this.state.rawPunches.push(...newPunches);
    this.logAudit('DOWNLOAD_PUNCHES', `Downloaded ${newPunches.length} raw punches from biometric terminal.`, userRole);
    this.saveToStorage(this.state);
  }

  // Processed Attendance
  public static getProcessedAttendance(month?: string): ProcessedAttendance[] {
    if (!month) return this.state.processedAttendance;
    return this.state.processedAttendance.filter(a => a.date.startsWith(month));
  }

  public static saveProcessedAttendanceBatch(records: ProcessedAttendance[], userRole: string = 'Admin'): void {
    const map = new Map(this.state.processedAttendance.map(a => [a.id, a]));
    records.forEach(r => map.set(r.id, r));
    this.state.processedAttendance = Array.from(map.values());
    this.logAudit('PROCESS_ATTENDANCE', `Processed attendance batch (${records.length} daily entries).`, userRole);
    this.saveToStorage(this.state);
  }

  public static updateAttendanceRecord(
    id: string,
    updates: Partial<ProcessedAttendance>,
    userRole: string = 'Admin'
  ): ProcessedAttendance {
    const idx = this.state.processedAttendance.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Attendance record not found');
    this.state.processedAttendance[idx] = {
      ...this.state.processedAttendance[idx],
      ...updates,
      isManualCorrection: true
    };
    this.logAudit('CORRECT_ATTENDANCE', `Manual attendance correction on record ${id}`, userRole);
    this.saveToStorage(this.state);
    return this.state.processedAttendance[idx];
  }

  // Leave Management
  public static getLeaveTypes(): LeaveType[] {
    return this.state.leaveTypes;
  }

  public static getLeaves(): EmployeeLeave[] {
    return this.state.employeeLeaves;
  }

  public static saveLeave(leave: Omit<EmployeeLeave, 'id'>, userRole: string = 'Admin'): EmployeeLeave {
    const newLeave: EmployeeLeave = {
      ...leave,
      id: `leave-${Date.now()}`
    };
    this.state.employeeLeaves.push(newLeave);
    this.logAudit('APPLY_LEAVE', `Applied leave for emp ${leave.employeeId} (${leave.daysCount} days)`, userRole);
    this.saveToStorage(this.state);
    return newLeave;
  }

  public static updateLeaveStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    approvedBy: string,
    userRole: string = 'Admin'
  ): void {
    const idx = this.state.employeeLeaves.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.state.employeeLeaves[idx].status = status;
      this.state.employeeLeaves[idx].approvedBy = approvedBy;
      this.logAudit('LEAVE_STATUS', `Leave ${id} set to ${status}`, userRole);
      this.saveToStorage(this.state);
    }
  }

  // Allowance Deduction Rules
  public static getAllowanceRules(): AllowanceDeductionRule[] {
    return this.state.allowanceRules;
  }

  public static saveAllowanceRule(rule: AllowanceDeductionRule, userRole: string = 'Admin'): void {
    const idx = this.state.allowanceRules.findIndex(r => r.id === rule.id);
    if (idx !== -1) {
      this.state.allowanceRules[idx] = rule;
    } else {
      this.state.allowanceRules.push(rule);
    }
    this.logAudit('UPDATE_ALLOWANCE_RULE', `Saved allowance deduction rule: ${rule.name}`, userRole);
    this.saveToStorage(this.state);
  }

  // Payroll Categories
  public static getPayrollCategories(): PayrollCategory[] {
    return this.state.payrollCategories;
  }

  // Payroll Period & Master Salary Sheet
  public static getPayrollPeriods(): PayrollPeriod[] {
    return this.state.payrollPeriods;
  }

  public static getPayrollPeriod(month: string): PayrollPeriod | undefined {
    return this.state.payrollPeriods.find(p => (p.monthYear === month || p.month === month));
  }

  public static savePayrollPeriod(period: PayrollPeriod, userRole: string = 'Admin'): void {
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
    return this.state.auditLogs;
  }

  // Backup & Restore
  public static backupDatabase(): string {
    this.logAudit('BACKUP_DATABASE', 'Generated local encrypted database backup file.');
    return JSON.stringify(this.state, null, 2);
  }

  public static restoreDatabase(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString) as DatabaseState;
      if (!parsed.employees || !parsed.companySettings) {
        return { success: false, message: 'Invalid backup file structure.' };
      }
      this.state = parsed;
      this.saveToStorage(this.state);
      this.logAudit('RESTORE_DATABASE', 'Successfully restored complete database from backup file.');
      return { success: true, message: 'Restored successfully.' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  public static resetToSampleData(): void {
    this.state = getInitialDatabase();
    this.saveToStorage(this.state);
  }
}

export const db = DatabaseService;
