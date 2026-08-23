import { Language } from '../types';

export interface TranslationDictionary {
  // Navigation & Common
  appTitle: string;
  appSubtitle: string;
  dashboard: string;
  employees: string;
  attendance: string;
  fingerprintMachine: string;
  leave: string;
  payroll: string;
  salarySheet: string;
  payslips: string;
  epfEtf: string;
  reports: string;
  settings: string;
  backupRestore: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  add: string;
  search: string;
  filter: string;
  refresh: string;
  status: string;
  actions: string;
  view: string;
  print: string;
  exportExcel: string;
  exportPdf: string;
  close: string;
  confirm: string;
  yes: string;
  no: string;
  active: string;
  inactive: string;
  success: string;
  warning: string;
  error: string;
  loading: string;
  all: string;
  date: string;
  month: string;
  year: string;
  total: string;
  remarks: string;

  // Dashboard
  totalEmployees: string;
  presentToday: string;
  absentToday: string;
  onLeaveToday: string;
  currentPayrollMonth: string;
  payrollStatus: string;
  quickActions: string;
  downloadAttendanceNow: string;
  generateSalaryNow: string;
  printPayslipsNow: string;
  deviceConnectionStatus: string;
  systemReady: string;

  // Employee Master
  employeeMaster: string;
  addNewEmployee: string;
  employeeCode: string;
  fullName: string;
  nameSinhala: string;
  nameTamil: string;
  nicNumber: string;
  dateOfBirth: string;
  gender: string;
  male: string;
  female: string;
  address: string;
  telephone: string;
  email: string;
  department: string;
  designation: string;
  joinDate: string;
  employmentStatus: string;
  epfNumber: string;
  etfNumber: string;
  basicSalary: string;
  fixedAllowance: string;
  otherAllowance: string;
  bankName: string;
  bankAccountNumber: string;
  branch: string;
  payrollCategory: string;
  workingDaysPerMonth: string;
  normalWorkingHours: string;
  otRateConfig: string;
  fingerprintUserId: string;
  employeeList: string;
  printEmployeeList: string;

  // Fingerprint Machine
  deviceConfig: string;
  addNewDevice: string;
  deviceName: string;
  deviceBrand: string;
  deviceModel: string;
  ipAddress: string;
  port: string;
  communicationType: string;
  testConnection: string;
  downloadAttendance: string;
  syncTime: string;
  online: string;
  offline: string;
  untested: string;
  rawAttendanceLogs: string;
  punchTime: string;
  punchType: string;
  verificationMode: string;
  connectionSuccess: string;
  connectionFailed: string;
  downloadingPunches: string;
  downloadComplete: string;

  // Attendance Processing
  attendanceProcessing: string;
  processAttendance: string;
  recalculateAttendance: string;
  manualAttendanceEntry: string;
  firstIn: string;
  lastOut: string;
  totalHours: string;
  normalHours: string;
  otHours: string;
  lateArrival: string;
  earlyLeave: string;
  manualCorrection: string;
  attendanceReport: string;
  monthlySummary: string;
  present: string;
  absent: string;
  noPay: string;
  holiday: string;
  weekend: string;

  // Leave Management
  leaveManagement: string;
  applyLeave: string;
  leaveType: string;
  annualLeave: string;
  casualLeave: string;
  medicalLeave: string;
  noPayLeave: string;
  startDate: string;
  endDate: string;
  daysCount: string;
  leaveReason: string;
  approved: string;
  pending: string;
  rejected: string;
  leaveBalance: string;

  // Special Allowance Rules
  allowanceRules: string;
  allowanceDeductionRuleTitle: string;
  allowanceRuleDescription: string;
  day1Deduction: string;
  day2Deduction: string;
  day3Deduction: string;
  day4Deduction: string;
  subsequentDays: string;
  maxDeductionNote: string;

  // Payroll Engine & Salary Generation
  payrollManagement: string;
  selectPayrollMonth: string;
  generatePayroll: string;
  payrollGeneratedSuccess: string;
  earnings: string;
  deductions: string;
  grossSalary: string;
  netSalary: string;
  noPayBasicDeduction: string;
  noPayAllowanceDeduction: string;
  epfEmployeeContribution: string;
  epfEmployerContribution: string;
  etfEmployerContribution: string;
  incentives: string;
  overtimePay: string;
  loans: string;
  advances: string;
  otherDeductions: string;
  finalizePayroll: string;
  payrollLocked: string;

  // EPF / ETF Management
  epfEtfModule: string;
  epfEmployeeRateLabel: string;
  epfEmployerRateLabel: string;
  etfEmployerRateLabel: string;
  totalEpfPayable: string;
  totalEtfPayable: string;
  paymentStatus: string;
  epfPaid: string;
  etfPaid: string;
  paymentDate: string;
  referenceNumber: string;
  savePaymentStatus: string;
  paymentHistory: string;

  // Payslips (4-per-A4)
  payslipTitle: string;
  payslipQuadNotice: string;
  fourPayslipsPerA4: string;
  employeeSignature: string;
  authorizedSignature: string;
  confidential: string;

  // Backup & Restore
  backupTitle: string;
  backupDatabase: string;
  restoreDatabase: string;
  backupDescription: string;
  restoreWarning: string;
  resetSampleData: string;
  auditTrail: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appTitle: 'LankaHR Desktop',
    appSubtitle: 'HRM, Attendance & Payroll for Sri Lanka',
    dashboard: 'Dashboard',
    employees: 'Employees',
    attendance: 'Attendance',
    fingerprintMachine: 'Biometric Machine',
    leave: 'Leave',
    payroll: 'Payroll',
    salarySheet: 'Salary Sheet',
    payslips: 'Payslips (4/A4)',
    epfEtf: 'EPF / ETF',
    reports: 'Reports',
    settings: 'Settings',
    backupRestore: 'Backup / Restore',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add New',
    search: 'Search...',
    filter: 'Filter',
    refresh: 'Refresh',
    status: 'Status',
    actions: 'Actions',
    view: 'View',
    print: 'Print',
    exportExcel: 'Export CSV / Excel',
    exportPdf: 'Save PDF',
    close: 'Close',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    active: 'Active',
    inactive: 'Inactive',
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
    loading: 'Loading...',
    all: 'All',
    date: 'Date',
    month: 'Month',
    year: 'Year',
    total: 'Total',
    remarks: 'Remarks',

    totalEmployees: 'Total Employees',
    presentToday: 'Present Today',
    absentToday: 'Absent Today',
    onLeaveToday: 'On Leave Today',
    currentPayrollMonth: 'Current Payroll Month',
    payrollStatus: 'Payroll Status',
    quickActions: 'Main Quick Workflow',
    downloadAttendanceNow: '1. Download Attendance',
    generateSalaryNow: '2. Generate Payroll (1-Click)',
    printPayslipsNow: '3. Print 4-in-1 Payslips',
    deviceConnectionStatus: 'Biometric Device Status',
    systemReady: 'System Ready for Sri Lankan Payroll Compliance',

    employeeMaster: 'Employee Master Details',
    addNewEmployee: 'Add New Employee',
    employeeCode: 'Employee Code',
    fullName: 'Full Name',
    nameSinhala: 'Name in Sinhala (නම)',
    nameTamil: 'Name in Tamil (பெயர்)',
    nicNumber: 'NIC Number',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    address: 'Address',
    telephone: 'Telephone / Mobile',
    email: 'Email',
    department: 'Department',
    designation: 'Designation',
    joinDate: 'Join Date',
    employmentStatus: 'Employment Status',
    epfNumber: 'EPF Number',
    etfNumber: 'ETF Number',
    basicSalary: 'Basic Salary (Rs.)',
    fixedAllowance: 'Fixed Allowance (Rs.)',
    otherAllowance: 'Other Allowance (Rs.)',
    bankName: 'Bank Name',
    bankAccountNumber: 'Account Number',
    branch: 'Branch',
    payrollCategory: 'Payroll Category',
    workingDaysPerMonth: 'Working Days / Month',
    normalWorkingHours: 'Working Hours / Day',
    otRateConfig: 'OT Rate Configuration',
    fingerprintUserId: 'Fingerprint Machine User ID',
    employeeList: 'Employee Directory',
    printEmployeeList: 'Print Employee List',

    deviceConfig: 'Biometric Machine Setup (IP/Network)',
    addNewDevice: 'Add Device',
    deviceName: 'Device Name',
    deviceBrand: 'Brand / Protocol',
    deviceModel: 'Model',
    ipAddress: 'IP Address',
    port: 'Port',
    communicationType: 'Communication Type',
    testConnection: 'Test Connection',
    downloadAttendance: 'Download Attendance Logs',
    syncTime: 'Sync Device Time',
    online: 'Connected (Online)',
    offline: 'Offline',
    untested: 'Untested',
    rawAttendanceLogs: 'Raw Punch Records (Permanent Audit Store)',
    punchTime: 'Punch Time',
    punchType: 'Punch Type',
    verificationMode: 'Method',
    connectionSuccess: 'Connected successfully to attendance device.',
    connectionFailed: 'Unable to connect to attendance device. Please check IP address, port and network cable.',
    downloadingPunches: 'Downloading punches from biometric hardware...',
    downloadComplete: 'Attendance logs downloaded and archived successfully.',

    attendanceProcessing: 'Daily & Monthly Attendance Review',
    processAttendance: 'Process Attendance (Punch to Shift)',
    recalculateAttendance: 'Recalculate Attendance',
    manualAttendanceEntry: 'Manual Attendance Correction',
    firstIn: 'First IN',
    lastOut: 'Last OUT',
    totalHours: 'Total Hours',
    normalHours: 'Normal Hours',
    otHours: 'OT Hours',
    lateArrival: 'Late (Mins)',
    earlyLeave: 'Early (Mins)',
    manualCorrection: 'Manual Edit',
    attendanceReport: 'Attendance Summary',
    monthlySummary: 'Monthly Summary',
    present: 'Present',
    absent: 'Absent',
    noPay: 'No Pay',
    holiday: 'Holiday',
    weekend: 'Weekend',

    leaveManagement: 'Leave Management',
    applyLeave: 'Apply Leave',
    leaveType: 'Leave Type',
    annualLeave: 'Annual Leave',
    casualLeave: 'Casual Leave',
    medicalLeave: 'Medical Leave',
    noPayLeave: 'No-Pay Leave (Deducts from Basic & Allowance)',
    startDate: 'Start Date',
    endDate: 'End Date',
    daysCount: 'Days Count',
    leaveReason: 'Reason',
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
    leaveBalance: 'Leave Balances',

    allowanceRules: 'Special Allowance Deduction Rules',
    allowanceDeductionRuleTitle: 'Configurable Allowance Deduction Engine',
    allowanceRuleDescription: 'Calculates special tiered deduction when employee takes unpaid leave days. The total deduction will never exceed eligible allowance.',
    day1Deduction: '1st Unpaid Leave Day Deduction (Rs.)',
    day2Deduction: '2nd Unpaid Leave Day Deduction (Rs.)',
    day3Deduction: '3rd Unpaid Leave Day Deduction (Rs.)',
    day4Deduction: '4th Unpaid Leave Day Deduction (Rs.)',
    subsequentDays: 'Subsequent Days Deduction (Rs.)',
    maxDeductionNote: 'Safeguard: Total allowance deduction is strictly capped at total eligible allowance.',

    payrollManagement: 'Monthly Payroll Processing',
    selectPayrollMonth: 'Payroll Month',
    generatePayroll: 'GENERATE PAYROLL (1-CLICK)',
    payrollGeneratedSuccess: 'Monthly payroll computed successfully for all active employees.',
    earnings: 'Earnings (ආදායම්)',
    deductions: 'Deductions (අඩු කිරීම්)',
    grossSalary: 'Gross Salary (දළ වැටුප)',
    netSalary: 'Net Salary (ශුද්ධ වැටුප)',
    noPayBasicDeduction: 'No-Pay Basic Deduction',
    noPayAllowanceDeduction: 'No-Pay Allowance Deduction (Special Rule)',
    epfEmployeeContribution: 'EPF Employee (8%)',
    epfEmployerContribution: 'EPF Employer (12%)',
    etfEmployerContribution: 'ETF Employer (3%)',
    incentives: 'Incentives (Sales/Target/Attendance)',
    overtimePay: 'Overtime (OT) Pay',
    loans: 'Salary Loans',
    advances: 'Salary Advance',
    otherDeductions: 'Other Deductions',
    finalizePayroll: 'Finalize & Lock Payroll',
    payrollLocked: 'Payroll is Finalized and Locked for this Month',

    epfEtfModule: 'Sri Lankan EPF & ETF Compliance & Payment Status',
    epfEmployeeRateLabel: 'Employee EPF % (Default 8%)',
    epfEmployerRateLabel: 'Employer EPF % (Default 12%)',
    etfEmployerRateLabel: 'Employer ETF % (Default 3%)',
    totalEpfPayable: 'Total EPF Payable (20%)',
    totalEtfPayable: 'Total ETF Payable (3%)',
    paymentStatus: 'Monthly Statutory Payment Status',
    epfPaid: 'EPF Paid to Central Bank / Dept of Labour',
    etfPaid: 'ETF Paid to ETF Board',
    paymentDate: 'Payment Date',
    referenceNumber: 'Cheque / Ref No.',
    savePaymentStatus: 'Update Payment Status',
    paymentHistory: 'Payment Archives',

    payslipTitle: 'Salary Payslip',
    payslipQuadNotice: 'A4 Portrait Quad Sheet (4 Per Page Printing)',
    fourPayslipsPerA4: 'Print 4 Payslips on 1 A4 Page',
    employeeSignature: 'Employee Signature',
    authorizedSignature: 'Authorized Signature',
    confidential: 'Private & Confidential',

    backupTitle: 'Database Backup & Restore',
    backupDatabase: 'Backup Database Now (.db)',
    restoreDatabase: 'Restore Database',
    backupDescription: 'Creates a complete standalone offline database backup file (HRM_Backup_YYYY_MM_DD.db).',
    restoreWarning: 'WARNING: Restoring will overwrite current data. Ensure you have backed up current records.',
    resetSampleData: 'Load Demonstration Sri Lankan Dataset',
    auditTrail: 'System Audit Logs'
  },
  si: {
    appTitle: 'LankaHR ඩෙස්ක්ටොප්',
    appSubtitle: 'ශ්‍රී ලංකාව සඳහා සරල මානව සම්පත්, පැමිණීම සහ වැටුප් කළමනාකරණය',
    dashboard: 'මුල් පිටුව',
    employees: 'සේවක මණ්ඩලය',
    attendance: 'පැමිණීම',
    fingerprintMachine: 'ඇඟිලි සලකුණු යන්ත්‍රය',
    leave: 'නිවාඩු',
    payroll: 'වැටුප් සැකසීම',
    salarySheet: 'වැටුප් පත්‍රිකාව',
    payslips: 'වැටුප් තීරු (4/A4)',
    epfEtf: 'EPF / ETF',
    reports: 'වාර්තා',
    settings: 'සැකසුම්',
    backupRestore: 'දත්ත සුරැකීම සහ ප්‍රතිස්ථාපනය',
    save: 'සුරකින්න',
    cancel: 'අවලංගු කරන්න',
    edit: 'සංස්කරණය',
    delete: 'මකන්න',
    add: 'අලුතින් එක් කරන්න',
    search: 'සොයන්න...',
    filter: 'පෙරහන',
    refresh: 'යාවත්කාලීන කරන්න',
    status: 'තත්ත්වය',
    actions: 'ක්‍රියා',
    view: 'බලන්න',
    print: 'මුද්‍රණය කරන්න',
    exportExcel: 'Excel / CSV ලබා ගන්න',
    exportPdf: 'PDF ලෙස සුරකින්න',
    close: 'වසන්න',
    confirm: 'තහවුරු කරන්න',
    yes: 'ඔව්',
    no: 'නැත',
    active: 'ක්‍රියාකාරී',
    inactive: 'අක්‍රිය',
    success: 'සාර්ථකයි',
    warning: 'අවවාදයයි',
    error: 'දෝෂයකි',
    loading: 'පූරණය වෙමින් පවතී...',
    all: 'සියල්ල',
    date: 'දිනය',
    month: 'මාසය',
    year: 'වර්ෂය',
    total: 'මුළු එකතුව',
    remarks: 'සටහන්',

    totalEmployees: 'මුළු සේවක සංඛ්‍යාව',
    presentToday: 'අද පැමිණි පිරිස',
    absentToday: 'අද නොපැමිණි පිරිස',
    onLeaveToday: 'අද නිවාඩු ගත් පිරිස',
    currentPayrollMonth: 'වත්මන් වැටුප් මාසය',
    payrollStatus: 'වැටුප් තත්ත්වය',
    quickActions: 'ප්‍රධාන කාර්ය ප්‍රවාහය',
    downloadAttendanceNow: '1. පැමිණීම් ලබාගන්න',
    generateSalaryNow: '2. වැටුප් ගණනය කරන්න (1-Click)',
    printPayslipsNow: '3. වැටුප් තීරු මුද්‍රණය (4ක් එක පිටුවක)',
    deviceConnectionStatus: 'ඇඟිලි සලකුණු යන්ත්‍ර තත්ත්වය',
    systemReady: 'ශ්‍රී ලංකා නීත්‍යානුකූල වැටුප් සැකසීමට සූදානම්',

    employeeMaster: 'සේවක තොරතුරු ලේඛනය',
    addNewEmployee: 'නව සේවකයෙකු ඇතුළත් කරන්න',
    employeeCode: 'සේවක අංකය',
    fullName: 'සම්පූර්ණ නම (ඉංග්‍රීසි)',
    nameSinhala: 'නම (සිංහලෙන්)',
    nameTamil: 'නම (දෙමළෙන්)',
    nicNumber: 'ජාතික හැඳුනුම්පත් අංකය',
    dateOfBirth: 'උපන් දිනය',
    gender: 'ස්ත්‍රී / පුරුෂ භාවය',
    male: 'පුරුෂ',
    female: 'ස්ත්‍රී',
    address: 'ලිපිනය',
    telephone: 'දුරකථන අංකය',
    email: 'විද්‍යුත් තැපෑල',
    department: 'දෙපාර්තමේන්තුව',
    designation: 'තනතුර',
    joinDate: 'සේවයට බැඳුණු දිනය',
    employmentStatus: 'සේවා තත්ත්වය',
    epfNumber: 'EPF අංකය',
    etfNumber: 'ETF අංකය',
    basicSalary: 'මූලික වැටුප (රු.)',
    fixedAllowance: 'ස්ථාවර දීමනාව (රු.)',
    otherAllowance: 'වෙනත් දීමනා (රු.)',
    bankName: 'බැංකුවේ නම',
    bankAccountNumber: 'ගිණුම් අංකය',
    branch: 'ශාඛාව',
    payrollCategory: 'වැටුප් කාණ්ඩය',
    workingDaysPerMonth: 'මසකට වැඩ කරන දින',
    normalWorkingHours: 'දිනකට සාමාන්‍ය සේවා පැය',
    otRateConfig: 'අතිකාල (OT) අනුපාතය',
    fingerprintUserId: 'මැෂින් අංකය (User ID)',
    employeeList: 'සේවක ලැයිස්තුව',
    printEmployeeList: 'සේවක ලැයිස්තුව මුද්‍රණය',

    deviceConfig: 'ඇඟිලි සලකුණු යන්ත්‍ර සැකසුම් (ජාලය හරහා)',
    addNewDevice: 'යන්ත්‍රයක් එක් කරන්න',
    deviceName: 'යන්ත්‍රයේ නම',
    deviceBrand: 'වර්ගය / Brand',
    deviceModel: 'Model අංකය',
    ipAddress: 'IP ලිපිනය',
    port: 'Port අංකය',
    communicationType: 'සම්බන්ධතා ක්‍රමය',
    testConnection: 'සම්බන්ධතාව පරීක්ෂා කරන්න',
    downloadAttendance: 'පැමිණීම් දත්ත බාගත කරන්න',
    syncTime: 'වේලාව සමමුහුර්ත කරන්න',
    online: 'සම්බන්ධ වී ඇත (Online)',
    offline: 'සම්බන්ධ වී නැත (Offline)',
    untested: 'පරීක්ෂා කර නැත',
    rawAttendanceLogs: 'මූලික පැමිණීම් වාර්තා (නොවෙනස්වන)',
    punchTime: 'වේලාව',
    punchType: 'ඇතුල්වීම/පිටවීම',
    verificationMode: 'ක්‍රමය',
    connectionSuccess: 'යන්ත්‍රය සමඟ සාර්ථකව සම්බන්ධ විය.',
    connectionFailed: 'යන්ත්‍රයට සම්බන්ධ විය නොහැක. කරුණාකර IP, Port සහ ජාල රැහැන පරීක්ෂා කරන්න.',
    downloadingPunches: 'පැමිණීම් දත්ත යන්ත්‍රයෙන් ලබාගනිමින් පවතී...',
    downloadComplete: 'පැමිණීම් දත්ත සාර්ථකව බාගත කර තැන්පත් කරන ලදී.',

    attendanceProcessing: 'දෛනික සහ මාසික පැමිණීම් සමාලෝචනය',
    processAttendance: 'පැමිණීම් ගණනය කරන්න',
    recalculateAttendance: 'නැවත ගණනය කරන්න',
    manualAttendanceEntry: 'අතින් පැමිණීම නිවැරදි කිරීම',
    firstIn: 'පළමු පැමිණීම (IN)',
    lastOut: 'අවසන් පිටවීම (OUT)',
    totalHours: 'මුළු පැය ගණන',
    normalHours: 'සාමාන්‍ය පැය',
    otHours: 'අතිකාල (OT) පැය',
    lateArrival: 'ප්‍රමාදය (විනාඩි)',
    earlyLeave: 'කලින් පිටවීම (විනාඩි)',
    manualCorrection: 'අතින් වෙනස් කිරීම',
    attendanceReport: 'පැමිණීම් සාරාංශය',
    monthlySummary: 'මාසික සාරාංශය',
    present: 'පැමිණි',
    absent: 'නොපැමිණි',
    noPay: 'නොගෙවූ නිවාඩු (No Pay)',
    holiday: 'නිවාඩු දිනයක්',
    weekend: 'සති අන්තය',

    leaveManagement: 'නිවාඩු කළමනාකරණය',
    applyLeave: 'නිවාඩු ඉල්ලුම් කිරීම',
    leaveType: 'නිවාඩු වර්ගය',
    annualLeave: 'වාර්ෂික නිවාඩු (Annual)',
    casualLeave: 'හදිසි නිවාඩු (Casual)',
    medicalLeave: 'වෛද්‍ය නිවාඩු (Medical)',
    noPayLeave: 'නොගෙවූ නිවාඩු (No-Pay - වැටුපෙන් අඩු වේ)',
    startDate: 'ආරම්භක දිනය',
    endDate: 'අවසන් දිනය',
    daysCount: 'දින ගණන',
    leaveReason: 'හේතුව',
    approved: 'අනුමතයි',
    pending: 'පොරොත්තුවේ',
    rejected: 'ප්‍රතික්ෂේපිතයි',
    leaveBalance: 'ඉතිරි නිවාඩු ප්‍රමාණය',

    allowanceRules: 'විශේෂ දීමනා අඩු කිරීමේ නීති',
    allowanceDeductionRuleTitle: 'අභිරුචි දීමනා අඩු කිරීමේ ක්‍රමය',
    allowanceRuleDescription: 'නොගෙවූ නිවාඩු (No-Pay) සඳහා දින අනුව විශේෂ දීමනාව අඩු කිරීමේ ක්‍රමය. සම්පූර්ණ අඩුවීම කිසිවිටෙක හිමි දීමනාව නොඉක්මවයි.',
    day1Deduction: '1 වන No-Pay දිනයේ දීමනා අඩුවීම (රු.)',
    day2Deduction: '2 වන No-Pay දිනයේ දීමනා අඩුවීම (රු.)',
    day3Deduction: '3 වන No-Pay දිනයේ දීමනා අඩුවීම (රු.)',
    day4Deduction: '4 වන No-Pay දිනයේ දීමනා අඩුවීම (රු.)',
    subsequentDays: 'ඉතිරි දින සඳහා අඩුවීම (රු.)',
    maxDeductionNote: 'ආරක්ෂිත නීතිය: මුළු අඩු කිරීම සේවකයාට හිමි උපරිම දීමනා සීමාව නොඉක්මවයි.',

    payrollManagement: 'මාසික වැටුප් සැකසුම් මොඩියුලය',
    selectPayrollMonth: 'වැටුප් මාසය',
    generatePayroll: 'වැටුප් ගණනය කරන්න (1-CLICK)',
    payrollGeneratedSuccess: 'සියලුම සේවකයින්ගේ වැටුප් සාර්ථකව ගණනය කරන ලදී.',
    earnings: 'ඉපැයීම් (Earnings)',
    deductions: 'අඩු කිරීම් (Deductions)',
    grossSalary: 'දළ වැටුප (Gross Salary)',
    netSalary: 'ශුද්ධ වැටුප (Net Salary)',
    noPayBasicDeduction: 'මූලික වැටුපෙන් No-Pay අඩුවීම',
    noPayAllowanceDeduction: 'දීමනා වලින් No-Pay අඩුවීම (විශේෂ නීතිය)',
    epfEmployeeContribution: 'සේවක EPF (8%)',
    epfEmployerContribution: 'සේව්‍ය EPF (12%)',
    etfEmployerContribution: 'සේව්‍ය ETF (3%)',
    incentives: 'දිරි දීමනා (Incentives)',
    overtimePay: 'අතිකාල ගෙවීම් (OT Pay)',
    loans: 'වැටුප් ණය',
    advances: 'අත්තිකාරම් මුදල්',
    otherDeductions: 'වෙනත් අඩු කිරීම්',
    finalizePayroll: 'වැටුප් තහවුරු කර අගුළු දමන්න',
    payrollLocked: 'මෙම මාසයේ වැටුප් තහවුරු කර අවසන් කර ඇත',

    epfEtfModule: 'ශ්‍රී ලංකා EPF සහ ETF ගෙවීම් තත්ත්වය',
    epfEmployeeRateLabel: 'සේවක EPF ප්‍රතිශතය (8%)',
    epfEmployerRateLabel: 'සේව්‍ය EPF ප්‍රතිශතය (12%)',
    etfEmployerRateLabel: 'සේව්‍ය ETF ප්‍රතිශතය (3%)',
    totalEpfPayable: 'ගෙවිය යුතු මුළු EPF (20%)',
    totalEtfPayable: 'ගෙවිය යුතු මුළු ETF (3%)',
    paymentStatus: 'මාසික EPF/ETF ගෙවීම් තත්ත්වය',
    epfPaid: 'EPF ගෙවා ඇත (මහ බැංකුවට)',
    etfPaid: 'ETF ගෙවා ඇත (ETF මණ්ඩලයට)',
    paymentDate: 'ගෙවූ දිනය',
    referenceNumber: 'චෙක්පත් / රිසිට් අංකය',
    savePaymentStatus: 'ගෙවීම් තත්ත්වය සුරකින්න',
    paymentHistory: 'පසුගිය ගෙවීම් වාර්තා',

    payslipTitle: 'වැටුප් පත්‍රිකාව (Payslip)',
    payslipQuadNotice: 'A4 පත්‍රිකාවක වැටුප් තීරු 4ක් (4-in-1 මුද්‍රණය)',
    fourPayslipsPerA4: 'එක් A4 පත්‍රයක වැටුප් පත් 4ක් මුද්‍රණය',
    employeeSignature: 'සේවක අත්සන',
    authorizedSignature: 'බලයලත් නිලධාරී අත්සන',
    confidential: 'රහස්‍ය ලියවිල්ලකි',

    backupTitle: 'දත්ත සුරැකීම සහ ප්‍රතිස්ථාපනය',
    backupDatabase: 'දත්ත ගොනුව සුරකින්න (.db)',
    restoreDatabase: 'පෙර දත්ත ප්‍රතිස්ථාපනය කරන්න',
    backupDescription: 'සම්පූර්ණ නොබැඳි පරිගණක දත්ත ගොනුවක් සුරකියි (HRM_Backup_YYYY_MM_DD.db).',
    restoreWarning: 'අවවාදයයි: ප්‍රතිස්ථාපනය කිරීමෙන් දැනට ඇති දත්ත වෙනස් විය හැක. කරුණාකර පළමුව Backup එකක් ලබාගන්න.',
    resetSampleData: 'නියැදි ශ්‍රී ලාංකික දත්ත පූරණය කරන්න',
    auditTrail: 'පද්ධති ක්‍රියාකාරකම් සටහන (Audit Log)'
  },
  ta: {
    appTitle: 'LankaHR டெஸ்க்டாப்',
    appSubtitle: 'இலங்கைக்கான மனிதவளம், வருகை மற்றும் சம்பள முகாமைத்துவம்',
    dashboard: 'முகப்பு',
    employees: 'ஊழியர்கள்',
    attendance: 'வருகை',
    fingerprintMachine: 'கைரேகை இயந்திரம்',
    leave: 'விடுமுறை',
    payroll: 'சம்பளம்',
    salarySheet: 'சம்பள அறிக்கை',
    payslips: 'சம்பளச் சீட்டு (4/A4)',
    epfEtf: 'EPF / ETF',
    reports: 'அறிக்கைகள்',
    settings: 'அமைப்புகள்',
    backupRestore: 'காப்பு / மீட்டமைத்தல்',
    save: 'சேமிக்க',
    cancel: 'ரத்து செய்',
    edit: 'திருத்துக',
    delete: 'நீக்குக',
    add: 'புதிய சேர்க்க',
    search: 'தேடுக...',
    filter: 'வடிகட்டி',
    refresh: 'புதுப்பிக்க',
    status: 'நிலை',
    actions: 'செயல்கள்',
    view: 'பார்க்க',
    print: 'அச்சிடுக',
    exportExcel: 'Excel / CSV ஏற்றுமதி',
    exportPdf: 'PDF ஆக சேமி',
    close: 'மூடுக',
    confirm: 'உறுதி செய்',
    yes: 'ஆம்',
    no: 'இல்லை',
    active: 'செயலில்',
    inactive: 'செயலற்ற',
    success: 'வெற்றி',
    warning: 'எச்சரிக்கை',
    error: 'பிழை',
    loading: 'ஏற்றுகிறது...',
    all: 'அனைத்தும்',
    date: 'திகதி',
    month: 'மாதம்',
    year: 'வருடம்',
    total: 'மொத்தம்',
    remarks: 'குறிப்பு',

    totalEmployees: 'மொத்த ஊழியர்கள்',
    presentToday: 'இன்று வருகை தந்தோர்',
    absentToday: 'இன்று வராதோர்',
    onLeaveToday: 'இன்று விடுமுறையில்',
    currentPayrollMonth: 'தற்போதைய சம்பள மாதம்',
    payrollStatus: 'சம்பள நிலை',
    quickActions: 'முக்கிய பணிப்பாய்வு',
    downloadAttendanceNow: '1. வருகை பதிவிறக்கம்',
    generateSalaryNow: '2. சம்பளக் கணக்கீடு (1-Click)',
    printPayslipsNow: '3. 4-இன்-1 சம்பளச் சீட்டு அச்சிடுக',
    deviceConnectionStatus: 'இயந்திர இணைப்பு நிலை',
    systemReady: 'இலங்கை சம்பள சட்ட விதிகளுக்கு தயாராக உள்ளது',

    employeeMaster: 'ஊழியர் விபரங்கள்',
    addNewEmployee: 'புதிய ஊழியரைச் சேர்க்க',
    employeeCode: 'ஊழியர் குறியீடு',
    fullName: 'முழுப் பெயர் (ஆங்கிலம்)',
    nameSinhala: 'பெயர் (சிங்களம்)',
    nameTamil: 'பெயர் (தமிழ்)',
    nicNumber: 'தேசிய அடையாள அட்டை எண்',
    dateOfBirth: 'பிறந்த திகதி',
    gender: 'பாலினம்',
    male: 'ஆண்',
    female: 'பெண்',
    address: 'முகவரி',
    telephone: 'தொலைபேசி எண்',
    email: 'மின்னஞ்சல்',
    department: 'திணைக்களம்',
    designation: 'பதவி',
    joinDate: 'சேர்ந்த திகதி',
    employmentStatus: 'வேலை நிலை',
    epfNumber: 'EPF எண்',
    etfNumber: 'ETF எண்',
    basicSalary: 'அடிப்படைச் சம்பளம் (ரூ.)',
    fixedAllowance: 'நிலையான கொடுப்பனவு (ரூ.)',
    otherAllowance: 'ஏனைய கொடுப்பனவு (ரூ.)',
    bankName: 'வங்கி பெயர்',
    bankAccountNumber: 'கணக்கு எண்',
    branch: 'கிளை',
    payrollCategory: 'சம்பள வகை',
    workingDaysPerMonth: 'மாத வேலை நாட்கள்',
    normalWorkingHours: 'தினசரி வேலை நேரம்',
    otRateConfig: 'மேலதிக நேரம் (OT) விகிதம்',
    fingerprintUserId: 'இயந்திர பயனர் எண் (User ID)',
    employeeList: 'ஊழியர் பட்டியல்',
    printEmployeeList: 'ஊழியர் பட்டியல் அச்சிடுக',

    deviceConfig: 'கைரேகை இயந்திர அமைப்பு (IP/Network)',
    addNewDevice: 'இயந்திரத்தைச் சேர்க்க',
    deviceName: 'இயந்திரத்தின் பெயர்',
    deviceBrand: 'வர்த்தக நாமம் / Brand',
    deviceModel: 'மாதிரி எண்',
    ipAddress: 'IP முகவரி',
    port: 'Port எண்',
    communicationType: 'தொடர்பு வகை',
    testConnection: 'இணைப்பை சோதிக்க',
    downloadAttendance: 'வருகை பதிவை பதிவிறக்குக',
    syncTime: 'நேரத்தை ஒத்திசைக்க',
    online: 'இணைக்கப்பட்டுள்ளது (Online)',
    offline: 'இணைக்கப்படவில்லை',
    untested: 'சோதிக்கப்படவில்லை',
    rawAttendanceLogs: 'அசல் வருகை பதிவுகள் (மாற்றமுடியாதவை)',
    punchTime: 'நேரம்',
    punchType: 'உள்/வெளி பதிவு',
    verificationMode: 'முறை',
    connectionSuccess: 'இயந்திரத்துடன் வெற்றிகரமாக இணைக்கப்பட்டது.',
    connectionFailed: 'இயந்திரத்துடன் இணைக்க முடியவில்லை. IP மற்றும் வலையமைப்பை சரிபார்க்கவும்.',
    downloadingPunches: 'வருகை பதிவுகள் பதிவிறக்கப்படுகின்றன...',
    downloadComplete: 'வருகை பதிவுகள் வெற்றிகரமாக பதிவிறக்கம் செய்யப்பட்டன.',

    attendanceProcessing: 'தினசரி மற்றும் மாதாந்த வருகை மதிப்பாய்வு',
    processAttendance: 'வருகை கணக்கீடு செய்க',
    recalculateAttendance: 'மீண்டும் கணக்கிடுக',
    manualAttendanceEntry: 'கைமுறை வருகை திருத்தம்',
    firstIn: 'முதல் வருகை (IN)',
    lastOut: 'கடைசி வெளியேற்றம் (OUT)',
    totalHours: 'மொத்த மணித்தியாலங்கள்',
    normalHours: 'சாதாரண மணித்தியாலங்கள்',
    otHours: 'மேலதிக நேரம் (OT)',
    lateArrival: 'தாமதம் (நிமிடங்கள்)',
    earlyLeave: 'முன் வெளியேற்றம்',
    manualCorrection: 'கைமுறை திருத்தம்',
    attendanceReport: 'வருகை சுருக்கம்',
    monthlySummary: 'மாதாந்த சுருக்கம்',
    present: 'வந்தோர்',
    absent: 'வராதோர்',
    noPay: 'சம்பளமற்ற விடுமுறை (No Pay)',
    holiday: 'விடுமுறை நாள்',
    weekend: 'வார இறுதி',

    leaveManagement: 'விடுமுறை முகாமைத்துவம்',
    applyLeave: 'விடுமுறை விண்ணப்பிக்க',
    leaveType: 'விடுமுறை வகை',
    annualLeave: 'வருடாந்த விடுமுறை',
    casualLeave: 'சாதாரண விடுமுறை',
    medicalLeave: 'மருத்துவ விடுமுறை',
    noPayLeave: 'சம்பளமற்ற விடுமுறை (No-Pay)',
    startDate: 'ஆரம்ப திகதி',
    endDate: 'முடிவு திகதி',
    daysCount: 'நாட்கள்',
    leaveReason: 'காரணம்',
    approved: 'அங்கீகரிக்கப்பட்டது',
    pending: 'நிலுவையில்',
    rejected: 'நிராகரிக்கப்பட்டது',
    leaveBalance: 'மீதமுள்ள விடுமுறை',

    allowanceRules: 'சிறப்பு கொடுப்பனவு கழித்தல் விதிகள்',
    allowanceDeductionRuleTitle: 'கொடுப்பனவு கழிப்பு விதி என்ஜின்',
    allowanceRuleDescription: 'சம்பளமற்ற விடுமுறைக்கான (No-Pay) சிறப்பு படிநிலை கொடுப்பனவு கழிப்பு. மொத்தக் கழிவு தகுதியான கொடுப்பனவை தாண்டாது.',
    day1Deduction: '1ம் நாள் No-Pay கழிவு (ரூ.)',
    day2Deduction: '2ம் நாள் No-Pay கழிவு (ரூ.)',
    day3Deduction: '3ம் நாள் No-Pay கழிவு (ரூ.)',
    day4Deduction: '4ம் நாள் No-Pay கழிவு (ரூ.)',
    subsequentDays: 'அடுத்த நாட்களுக்கான கழிவு (ரூ.)',
    maxDeductionNote: 'பாதுகாப்பு: மொத்த கொடுப்பனவு கழிப்பு உரித்தான கொடுப்பனவை விட அதிகரிக்காது.',

    payrollManagement: 'மாதாந்த சம்பளக் கணக்கீடு',
    selectPayrollMonth: 'சம்பள மாதம்',
    generatePayroll: 'சம்பளம் கணக்கிடுக (1-CLICK)',
    payrollGeneratedSuccess: 'அனைத்து ஊழியர்களுக்கும் சம்பளம் வெற்றிகரமாக கணக்கிடப்பட்டது.',
    earnings: 'வருமானங்கள் (Earnings)',
    deductions: 'கழிவுகள் (Deductions)',
    grossSalary: 'மொத்த சம்பளம் (Gross Salary)',
    netSalary: 'நிகர சம்பளம் (Net Salary)',
    noPayBasicDeduction: 'அடிப்படை No-Pay கழிவு',
    noPayAllowanceDeduction: 'கொடுப்பனவு No-Pay கழிவு (சிறப்பு விதி)',
    epfEmployeeContribution: 'ஊழியர் EPF (8%)',
    epfEmployerContribution: 'முதலாளி EPF (12%)',
    etfEmployerContribution: 'முதலாளி ETF (3%)',
    incentives: 'ஊக்கத்தொகை (Incentives)',
    overtimePay: 'மேலதிக நேர கொடுப்பனவு (OT)',
    loans: 'சம்பள கடன்',
    advances: 'முன்பணம்',
    otherDeductions: 'ஏனைய கழிவுகள்',
    finalizePayroll: 'சம்பளத்தை உறுதிப்படுத்தி பூட்டுக',
    payrollLocked: 'இம்மாத சம்பளம் பூட்டப்பட்டுள்ளது',

    epfEtfModule: 'இலங்கை EPF மற்றும் ETF கொடுப்பனவு நிலை',
    epfEmployeeRateLabel: 'ஊழியர் EPF % (8%)',
    epfEmployerRateLabel: 'முதலாளி EPF % (12%)',
    etfEmployerRateLabel: 'முதலாளி ETF % (3%)',
    totalEpfPayable: 'செலுத்த வேண்டிய மொத்த EPF (20%)',
    totalEtfPayable: 'செலுத்த வேண்டிய மொத்த ETF (3%)',
    paymentStatus: 'மாதாந்த EPF/ETF செலுத்தும் நிலை',
    epfPaid: 'EPF செலுத்தப்பட்டது (மத்திய வங்கிக்கு)',
    etfPaid: 'ETF செலுத்தப்பட்டது (ETF சபைக்கு)',
    paymentDate: 'செலுத்திய திகதி',
    referenceNumber: 'காசோலை / ரசீது எண்',
    savePaymentStatus: 'நிலை சேமிக்க',
    paymentHistory: 'முந்தைய கொடுப்பனவு வரலாறு',

    payslipTitle: 'சம்பளச் சீட்டு (Payslip)',
    payslipQuadNotice: 'A4 பக்கத்தில் 4 சம்பளச் சீட்டுகள் (4-in-1)',
    fourPayslipsPerA4: 'ஒரு A4 தாளில் 4 சம்பளச் சீட்டு அச்சிடுக',
    employeeSignature: 'ஊழியர் கையொப்பம்',
    authorizedSignature: 'அங்கீகரிக்கப்பட்ட கையொப்பம்',
    confidential: 'அந்தரங்கமானது',

    backupTitle: 'தரவு காப்பு மற்றும் மீட்டல்',
    backupDatabase: 'தரவுத்தளத்தை காப்பிடுக (.db)',
    restoreDatabase: 'தரவுத்தளத்தை மீட்டமைக்க',
    backupDescription: 'முழுமையான ஆஃப்லைன் காப்பு கோப்பை உருவாக்குகிறது (HRM_Backup_YYYY_MM_DD.db).',
    restoreWarning: 'எச்சரிக்கை: மீட்டமைத்தால் தற்போதைய தகவல்கள் மேலெழுதப்படும்.',
    resetSampleData: 'மாதிரி இலங்கை தரவை ஏற்றுக',
    auditTrail: 'கணினி கணக்காய்வு பதிவுகள்'
  }
};
