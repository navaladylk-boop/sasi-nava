export type Language = 'en' | 'si' | 'ta';

export type UserRole = 'ADMIN' | 'HR_MANAGER' | 'PAYROLL_OFFICER' | 'OPERATOR' | 'Admin' | 'HR Manager' | 'Payroll Officer' | 'Operator';

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  password?: string;
  lastLogin?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  nameSinhala?: string;
  nameTamil?: string;
}

export interface Designation {
  id: string;
  code: string;
  title: string;
  departmentId: string;
}

export type OtRateType = '1.5X_STANDARD' | '2.0X_HOLIDAY' | 'FIXED_HOURLY';

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  nameSinhala?: string;
  nameTamil?: string;
  nic: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: string;
  telephone: string;
  email: string;
  departmentId: string;
  designationId: string;
  joinDate: string;
  employmentStatus: 'PERMANENT' | 'PROBATION' | 'CONTRACT' | 'CASUAL' | 'RESIGNED';
  epfNumber: string;
  etfNumber?: string;
  epfEnabled?: boolean; // true by default (enable/disable EPF statutory deductions)
  etfEnabled?: boolean; // true by default (enable/disable ETF statutory contributions)
  basicSalary: number;
  fixedAllowance: number;
  otherAllowance: number;
  bankName: string;
  bankAccountNumber: string;
  branch: string;
  payrollCategoryId: string;
  workingDaysPerMonth: number; // e.g. 25
  normalWorkingHours: number; // e.g. 8
  otRateType: OtRateType;
  otCustomHourlyRate?: number;
  allowanceDeductionRuleId?: string;
  fingerprintUserId: string; // ID assigned inside biometric machine
  isActive: boolean;
}

export type DeviceBrand = 'Hikvision';
export type CommunicationType = 'TCP_IP' | 'UDP' | 'RS485' | 'USB';
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'UNTESTED';

export interface FingerprintDevice {
  id: string;
  name: string;
  brand: DeviceBrand;
  model: string;
  ipAddress: string;
  port: number;
  username?: string;
  password?: string;
  communicationType: CommunicationType;
  status: DeviceStatus;
  lastSyncTime?: string;
  serialNumber?: string;
}

export type PunchType = 'IN' | 'OUT' | 'BREAK_OUT' | 'BREAK_IN' | 'AUTO';
export type VerificationMode = 'FINGERPRINT' | 'FACE' | 'CARD' | 'PASSWORD';

export interface RawAttendancePunch {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceUserId: string;
  employeeId?: string;
  punchTimestamp: string; // ISO 8601 string
  punchDate: string; // YYYY-MM-DD
  punchTime: string; // HH:mm:ss
  punchType: PunchType;
  verificationMode: VerificationMode;
  isProcessed: boolean;
  createdAt: string;
}

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LEAVE'
  | 'NO_PAY'
  | 'HOLIDAY'
  | 'WEEKEND'
  | 'HALF_DAY';

export interface ProcessedAttendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  firstIn?: string; // HH:mm
  lastOut?: string; // HH:mm
  totalHours: number;
  normalHours: number;
  otHours: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: AttendanceStatus;
  leaveTypeId?: string;
  isManualCorrection: boolean;
  originalFirstIn?: string;
  originalLastOut?: string;
  remarks?: string;
}

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  nameSinhala?: string;
  nameTamil?: string;
  isPaid: boolean;
  defaultDaysPerYear: number;
}

export interface EmployeeLeave {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  approvedBy?: string;
  appliedDate: string;
}

export type AllowanceRuleType =
  | 'TIERED'
  | 'TIERED_DAYS'
  | 'PERCENTAGE'
  | 'DAILY_PRORATA'
  | 'NO_DEDUCTION'
  | 'CUSTOM_FORMULA';

export interface AllowanceDeductionTier {
  dayNumber: number;
  deductionAmount: number;
  description?: string;
}

export type TieredDeductionTier = AllowanceDeductionTier;

export interface AllowanceDeductionRule {
  id: string;
  name: string;
  ruleType: AllowanceRuleType;
  description: string;
  tiers: AllowanceDeductionTier[];
  percentageRate?: number;
  formulaString?: string;
  defaultDeductionBeyondTiers?: number;
  capAtTotalAllowance?: boolean;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface PayrollCategory {
  id: string;
  name: string;
  code?: string;
  description?: string;
  workingDaysDivisor: number; // default 25
  defaultOtMultiplier: number; // e.g. 1.5
  allowanceDeductionRuleId: string;
  epfRateEmployee?: number; // e.g. 8
  epfRateEmployer?: number; // e.g. 12
  etfRateEmployer?: number; // e.g. 3
}

export type IncentiveType =
  | 'PRODUCTION'
  | 'SALES'
  | 'SEASONAL'
  | 'ATTENDANCE'
  | 'MANUAL'
  | 'OTHER';

export interface IncentiveRecord {
  id: string;
  employeeId: string;
  payrollMonth: string; // YYYY-MM
  type: IncentiveType;
  targetAmount?: number;
  achievementAmount?: number;
  amount: number;
  description: string;
  remarks?: string;
  date: string;
}

export type PayrollStatus = 'DRAFT' | 'CALCULATED' | 'GENERATED' | 'FINALIZED' | 'LOCKED';

export interface CalculatedSalaryRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  nameSinhala?: string;
  nameTamil?: string;
  nic?: string;
  epfNumber: string;
  departmentName: string;
  designationTitle: string;
  bankName: string;
  bankAccountNumber: string;

  // Working & Attendance metrics
  workingDays: number;
  workedDays: number;
  unpaidLeaveDays: number;
  otHours: number;
  lateMinutes: number;

  // Earnings
  basicSalary: number;
  basicDailyRate: number;
  noPayBasicDeduction: number;
  netBasicSalary: number;

  fixedAllowance: number;
  otherAllowance: number;
  totalAllowances: number;
  noPayAllowanceDeduction: number;
  netAllowance: number;

  otHourlyRate: number;
  otAmount: number;
  incentives: number;

  grossSalary: number;

  // Sri Lankan Statutory Contributions
  epfEnabled?: boolean;
  etfEnabled?: boolean;
  epfLiableSalary: number;
  epfEmployeeRate: number;
  epfEmployeeAmount: number; // 8%
  epfEmployerRate: number;
  epfEmployerAmount: number; // 12%
  etfEmployerRate: number;
  etfEmployerAmount: number; // 3%

  // Deductions
  loanDeductions: number;
  loanDeduction?: number;
  salaryAdvance: number;
  advanceDeduction?: number;
  otherDeductions: number;
  totalDeductions: number;

  // Net Pay & CTC
  netSalary: number;
  costToCompany: number;
  notes?: string;
}

export type PayrollDetail = CalculatedSalaryRecord;

export interface PayrollPeriod {
  id: string;
  monthYear?: string;
  month?: string; // YYYY-MM
  status: PayrollStatus;
  calculatedAt?: string;
  generatedDate?: string;
  finalizedDate?: string;
  records: CalculatedSalaryRecord[];
  totalEmployees: number;
  totalBasic?: number;
  totalAllowances?: number;
  totalGross: number;
  totalNet: number;
  totalEpfEmployee: number;
  totalEpfEmployer: number;
  totalEtfEmployer: number;
  totalNoPayDeduction?: number;
  isEpfPaid?: boolean;
  isEtfPaid?: boolean;
  epfPaid?: boolean;
  etfPaid?: boolean;
  epfPaymentDate?: string;
  etfPaymentDate?: string;
  epfPaymentReference?: string;
  etfPaymentReference?: string;
  epfRefNo?: string;
  etfRefNo?: string;
  paymentRemarks?: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  companyNameSinhala?: string;
  companyNameTamil?: string;
  address: string;
  telephone: string;
  email: string;
  registrationNo?: string;
  epfRegistrationNumber: string;
  epfEmployerNo?: string;
  logoUrl?: string;
  defaultWorkingDaysPerMonth: number; // 25
  defaultWorkingDays?: number;
  normalWorkingHoursPerDay: number; // 8
  defaultWorkingHours?: number;
  shiftStartTime: string; // "08:30"
  shiftEndTime: string; // "17:00"
  lateGraceMinutes: number; // 15
  epfEmployeeRate: number; // 8
  epfEmployeePercent?: number;
  epfEmployerRate: number; // 12
  epfEmployerPercent?: number;
  etfEmployerRate: number; // 3
  etfEmployerPercent?: number;
  epfCalculationBasis?: 'BASIC_ONLY' | 'BASIC_MINUS_NOPAY' | 'BASIC_PLUS_FIXED_ALLOWANCE';
  defaultOtHourlyRateMultiplier?: number; // 1.5
  currencySymbol?: string;
  defaultLanguage?: Language;
  language?: Language;
  currentUserId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user?: string;
  userRole?: string;
  action: string;
  module?: string;
  details: string;
}
