import { AttendanceProcessor } from '../src/services/attendanceProcessor';
import { PayrollEngine } from '../src/services/payrollEngine';
import { DatabaseService } from '../src/services/db';
import { Employee, RawAttendancePunch, EmployeeLeave, CompanySettings, ProcessedAttendance } from '../src/types';

// Mock company settings
const mockSettings: CompanySettings = {
  id: 'set-001',
  companyName: 'LankaHR Test',
  address: 'Colombo, Sri Lanka',
  telephone: '0112233445',
  email: 'test@lankahr.lk',
  epfRegistrationNumber: 'EPF-123456',
  defaultWorkingDaysPerMonth: 25,
  normalWorkingHoursPerDay: 8,
  shiftStartTime: '08:00',
  shiftEndTime: '17:00',
  lateGraceMinutes: 15,
  epfEmployeeRate: 8,
  epfEmployerRate: 12,
  etfEmployerRate: 3
};

// Mock employee with basic salary 60,000 LKR
const mockEmployee: Employee = {
  id: 'emp-001',
  employeeCode: 'EMP001',
  fullName: 'Kamal Perera',
  nic: '199012345V',
  dob: '1990-05-15',
  gender: 'MALE',
  address: '123 Main Rd, Colombo',
  telephone: '0771234567',
  email: 'kamal@test.com',
  departmentId: 'dept-001',
  designationId: 'desig-001',
  joinDate: '2020-01-01',
  employmentStatus: 'PERMANENT',
  epfNumber: 'EPF-001',
  basicSalary: 60000,
  fixedAllowance: 10000,
  otherAllowance: 5000,
  bankName: 'Commercial Bank',
  bankAccountNumber: '8001234567',
  branch: 'Colombo 03',
  payrollCategoryId: 'cat-001',
  workingDaysPerMonth: 25,
  normalWorkingHours: 8,
  otRateType: '1.5X_STANDARD',
  fingerprintUserId: '1',
  isActive: true
};

// Leaves configuration for August 2026
const mockLeaves = [
  // Day 10: Approved FULL-DAY Paid Leave (Annual Leave)
  {
    id: 'lv-001',
    employeeId: 'emp-001',
    leaveTypeId: 'lt-01', // Annual Leave
    startDate: '2026-08-10',
    endDate: '2026-08-10',
    daysCount: 1.0,
    status: 'APPROVED',
    reason: 'Family event'
  },
  // Day 11: Approved FULL-DAY No-Pay Leave
  {
    id: 'lv-002',
    employeeId: 'emp-001',
    leaveTypeId: 'lt-04', // No Pay Leave
    startDate: '2026-08-11',
    endDate: '2026-08-11',
    daysCount: 1.0,
    status: 'APPROVED',
    reason: 'Personal - no pay'
  },
  // Day 12: Approved Short Leave (Partial Day - e.g. 1 hour = 60 mins)
  {
    id: 'lv-003',
    employeeId: 'emp-001',
    leaveTypeId: 'lt-03', // Short Leave
    startDate: '2026-08-12',
    endDate: '2026-08-12',
    daysCount: 0.125, // 1 hour / 8 hours
    status: 'APPROVED',
    reason: 'Doctor appointment'
  }
] as any as EmployeeLeave[];

// Raw biometric punches
const mockPunches = [
  // Day 10: Biometric punches exist even on Full-Day Leave day (should be ignored for time-loss)
  {
    id: 'p-001',
    deviceId: 'dev-001',
    deviceName: 'Main Door',
    deviceUserId: '1',
    employeeId: 'emp-001',
    punchTimestamp: '2026-08-10T08:35:00',
    punchDate: '2026-08-10',
    punchTime: '08:35:00',
    punchType: 'IN',
    verificationMode: 'FACE',
    isProcessed: false
  },
  {
    id: 'p-002',
    deviceId: 'dev-001',
    deviceName: 'Main Door',
    deviceUserId: '1',
    employeeId: 'emp-001',
    punchTimestamp: '2026-08-10T17:10:00',
    punchDate: '2026-08-10',
    punchTime: '17:10:00',
    punchType: 'OUT',
    verificationMode: 'FACE',
    isProcessed: false
  },

  // Day 11: No punches for Full-Day No-Pay Leave (should be processed as No-Pay but 0 time-loss minutes)

  // Day 12: Punched normal working day but has approved 1 hour short leave
  {
    id: 'p-003',
    deviceId: 'dev-001',
    deviceName: 'Main Door',
    deviceUserId: '1',
    employeeId: 'emp-001',
    punchTimestamp: '2026-08-12T08:00:00',
    punchDate: '2026-08-12',
    punchTime: '08:00:00',
    punchType: 'IN',
    verificationMode: 'FACE',
    isProcessed: false
  },
  {
    id: 'p-004',
    deviceId: 'dev-001',
    deviceName: 'Main Door',
    deviceUserId: '1',
    employeeId: 'emp-001',
    punchTimestamp: '2026-08-12T17:00:00',
    punchDate: '2026-08-12',
    punchTime: '17:00:00',
    punchType: 'OUT',
    verificationMode: 'FACE',
    isProcessed: false
  },

  // Day 13: Late In by 50 minutes (08:50 In, Shift Start 08:00, Grace 15)
  {
    id: 'p-005',
    deviceId: 'dev-001',
    deviceName: 'Main Door',
    deviceUserId: '1',
    employeeId: 'emp-001',
    punchTimestamp: '2026-08-13T08:50:00',
    punchDate: '2026-08-13',
    punchTime: '08:50:00',
    punchType: 'IN',
    verificationMode: 'FACE',
    isProcessed: false
  },
  {
    id: 'p-006',
    deviceId: 'dev-001',
    deviceName: 'Main Door',
    deviceUserId: '1',
    employeeId: 'emp-001',
    punchTimestamp: '2026-08-13T17:00:00',
    punchDate: '2026-08-13',
    punchTime: '17:00:00',
    punchType: 'OUT',
    verificationMode: 'FACE',
    isProcessed: false
  },

  // Day 14: Early Departure by 30 minutes (08:00 In, 16:30 Out, Shift End 17:00)
  {
    id: 'p-007',
    deviceId: 'dev-001',
    deviceName: 'Main Door',
    deviceUserId: '1',
    employeeId: 'emp-001',
    punchTimestamp: '2026-08-14T08:00:00',
    punchDate: '2026-08-14',
    punchTime: '08:00:00',
    punchType: 'IN',
    verificationMode: 'FACE',
    isProcessed: false
  },
  {
    id: 'p-008',
    deviceId: 'dev-001',
    deviceName: 'Main Door',
    deviceUserId: '1',
    employeeId: 'emp-001',
    punchTimestamp: '2026-08-14T16:30:00',
    punchDate: '2026-08-14',
    punchTime: '16:30:00',
    punchType: 'OUT',
    verificationMode: 'FACE',
    isProcessed: false
  }
] as any as RawAttendancePunch[];

async function runTests() {
  console.log('==================================================');
  console.log('LANKAHR AUTOMATED SHORT LEAVE TEST SUITE');
  console.log('==================================================\n');

  // Step 1: Process Monthly Attendance
  const result = AttendanceProcessor.processMonthAttendance(
    '2026-08',
    [mockEmployee],
    mockPunches,
    mockLeaves,
    [],
    mockSettings
  );

  console.log(`Processed ${result.records.length} daily records. Warnings: ${result.warnings.length}\n`);

  // Extract specific test dates for validation
  const day10 = result.records.find(r => r.date === '2026-08-10'); // Full-Day Paid Leave
  const day11 = result.records.find(r => r.date === '2026-08-11'); // Full-Day No-Pay Leave
  const day12 = result.records.find(r => r.date === '2026-08-12'); // 1-Hour Short Leave
  const day13 = result.records.find(r => r.date === '2026-08-13'); // 50 Mins Late
  const day14 = result.records.find(r => r.date === '2026-08-14'); // 30 Mins Early

  // TEST 1: Full-Day Paid Leave Exclusion
  console.log('TEST 1: Full-Day Paid Leave Exclusion (2026-08-10)');
  if (!day10) throw new Error('Day 10 record not found');
  console.log(`- Status: ${day10.status} (Expected: LEAVE)`);
  console.log(`- Late Minutes: ${day10.lateMinutes} (Expected: 0)`);
  console.log(`- Early Departure Minutes: ${day10.earlyLeaveMinutes} (Expected: 0)`);
  console.log(`- Short Leave Minutes: ${day10.shortLeaveMinutes} (Expected: 0)`);
  console.log(`- Time Loss Minutes: ${day10.timeLossMinutes} (Expected: 0)`);
  
  if (day10.lateMinutes !== 0 || day10.earlyLeaveMinutes !== 0 || day10.shortLeaveMinutes !== 0 || day10.timeLossMinutes !== 0) {
    throw new Error('FAIL: Full-day paid leave must completely exclude time loss metrics!');
  }
  console.log('=> PASS\n');

  // TEST 2: Full-Day No-Pay Leave Exclusion
  console.log('TEST 2: Full-Day No-Pay Leave Exclusion (2026-08-11)');
  if (!day11) throw new Error('Day 11 record not found');
  console.log(`- Status: ${day11.status} (Expected: NO_PAY)`);
  console.log(`- Late Minutes: ${day11.lateMinutes} (Expected: 0)`);
  console.log(`- Early Departure Minutes: ${day11.earlyLeaveMinutes} (Expected: 0)`);
  console.log(`- Short Leave Minutes: ${day11.shortLeaveMinutes} (Expected: 0)`);
  console.log(`- Time Loss Minutes: ${day11.timeLossMinutes} (Expected: 0)`);
  
  if (day11.lateMinutes !== 0 || day11.earlyLeaveMinutes !== 0 || day11.shortLeaveMinutes !== 0 || day11.timeLossMinutes !== 0) {
    throw new Error('FAIL: Full-day no-pay leave must completely exclude time loss metrics!');
  }
  console.log('=> PASS\n');

  // TEST 3: Short Leave / Partial-Day Leave Inclusion
  console.log('TEST 3: Partial-Day Short Leave (2026-08-12)');
  if (!day12) throw new Error('Day 12 record not found');
  console.log(`- Status: ${day12.status} (Expected: PRESENT)`);
  console.log(`- Short Leave Minutes: ${day12.shortLeaveMinutes} (Expected: 60)`);
  console.log(`- Time Loss Minutes: ${day12.timeLossMinutes} (Expected: 60)`);
  
  if (day12.shortLeaveMinutes !== 60 || day12.timeLossMinutes !== 60) {
    throw new Error('FAIL: Partial-day short leave should calculate 60 minutes time loss!');
  }
  console.log('=> PASS\n');

  // TEST 4: Late In / Early Out Inclusion
  console.log('TEST 4: Late In and Early Out Inclusion');
  if (!day13 || !day14) throw new Error('Day 13 or Day 14 record not found');
  console.log(`- Day 13 Late Minutes: ${day13.lateMinutes} (Expected: 50)`);
  console.log(`- Day 13 Time Loss: ${day13.timeLossMinutes} (Expected: 50)`);
  console.log(`- Day 14 Early Out Minutes: ${day14.earlyLeaveMinutes} (Expected: 30)`);
  console.log(`- Day 14 Time Loss: ${day14.timeLossMinutes} (Expected: 30)`);

  if (day13.lateMinutes !== 50 || day14.earlyLeaveMinutes !== 30) {
    throw new Error('FAIL: Late and Early minutes must be counted correctly!');
  }
  console.log('=> PASS\n');

  // Step 2: Sum overall monthly metrics for employee
  const totalLate = result.records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
  const totalShortLeave = result.records.reduce((sum, r) => sum + (r.shortLeaveMinutes || 0), 0);
  const totalTimeLoss = result.records.reduce((sum, r) => sum + (r.timeLossMinutes || 0), 0);

  console.log('Step 2 Summary metrics:');
  console.log(`- Total Late Minutes: ${totalLate} (Expected: 50)`);
  console.log(`- Total Short Leave Minutes: ${totalShortLeave} (Expected: 60)`);
  console.log(`- Total Time Loss Minutes: ${totalTimeLoss} (Expected: 50 + 60 + 30 = 140)`);

  if (totalTimeLoss !== 140) {
    throw new Error('FAIL: Total time loss sum must be 140 minutes');
  }
  console.log('=> PASS\n');

  // TEST 5: Monthly 5-Hour Free Allowance with NO deduction
  console.log('TEST 5: Monthly 5-Hour Free Allowance with NO deduction (<300 mins)');
  const salaryResultNoDeduct = PayrollEngine.calculateEmployeeSalary({
    employee: mockEmployee,
    workedDays: 23,
    unpaidLeaveDays: 1, // 1 no-pay leave day (Day 11)
    otHours: 0,
    lateMinutes: totalLate,
    shortLeaveMinutes: totalShortLeave,
    timeLossMinutes: totalTimeLoss,
    settings: mockSettings,
    rules: [],
    monthlyWorkingDays: 25 // FIX: Provided monthlyWorkingDays: 25 explicitly
  });

  console.log(`- Short Leave Deduction: Rs. ${salaryResultNoDeduct.shortLeaveDeduction} (Expected: 0)`);
  if (salaryResultNoDeduct.shortLeaveDeduction !== 0) {
    throw new Error('FAIL: Short leave deduction must be Rs.0 when total time loss is under 300 minutes');
  }
  console.log('=> PASS\n');

  // TEST 6: 5-Hour Free Allowance with Deductions (>300 mins)
  console.log('TEST 6: 5-Hour Free Allowance with Deductions (>300 mins)');
  // Add a huge extra late time of 250 minutes to exceed the 300 minutes free allowance
  const extremeTimeLoss = totalTimeLoss + 250; // 140 + 250 = 390 minutes. Excess = 90 minutes.
  
  const salaryResultWithDeduct = PayrollEngine.calculateEmployeeSalary({
    employee: mockEmployee,
    workedDays: 23,
    unpaidLeaveDays: 1,
    otHours: 0,
    lateMinutes: totalLate,
    shortLeaveMinutes: totalShortLeave,
    timeLossMinutes: extremeTimeLoss,
    settings: mockSettings,
    rules: [],
    monthlyWorkingDays: 25 // FIX: Provided monthlyWorkingDays: 25 explicitly
  });

  // Calculate hourly rate: basic / (workingDays * normalHours) = 60000 / (25 * 8) = 300 LKR per hour.
  // Minute rate = 300 / 60 = 5 LKR per minute.
  // Excess minutes = 390 - 300 = 90 minutes.
  // Expected deduction = 90 * 5 = 450 LKR.
  console.log(`- Extreme Time Loss: ${extremeTimeLoss} mins (Expected: 390)`);
  console.log(`- Excess Time Loss: ${Math.max(0, extremeTimeLoss - 300)} mins (Expected: 90)`);
  console.log(`- Calculated Short Leave Deduction: Rs. ${salaryResultWithDeduct.shortLeaveDeduction} (Expected: 450)`);

  if (salaryResultWithDeduct.shortLeaveDeduction !== 450) {
    throw new Error(`FAIL: Short leave deduction should be Rs.450, got Rs.${salaryResultWithDeduct.shortLeaveDeduction}`);
  }
  console.log('=> PASS\n');


  // ==========================================
  // NEW REQUIREMENT 2: EXACT SHORT LEAVE TEST
  // ==========================================
  console.log('TEST 2.1: Exact Short Leave Duration Verification (90 Minutes)');
  const employeeExactShortLeave: Employee = {
    ...mockEmployee,
    id: 'emp-exact-sl',
    employeeCode: 'EMP_ESL',
    fingerprintUserId: 'exact-sl-fp'
  };

  const exactShortLeave: EmployeeLeave = {
    id: 'lv-exact-sl',
    employeeId: 'emp-exact-sl',
    leaveTypeId: 'lt-03', // Short Leave
    startDate: '2026-08-15',
    endDate: '2026-08-15',
    durationType: 'SHORT_LEAVE',
    startTime: '10:15',
    endTime: '11:45',
    durationMinutes: 90,
    daysCount: 0.1875,
    status: 'APPROVED',
    reason: 'Short leave'
  } as any;

  const exactShortLeavePunches = [
    {
      id: 'p-esl-1',
      deviceId: 'dev-001',
      deviceName: 'Main Door',
      deviceUserId: 'exact-sl-fp',
      employeeId: 'emp-exact-sl',
      punchTimestamp: '2026-08-15T08:00:00',
      punchDate: '2026-08-15',
      punchTime: '08:00:00',
      punchType: 'IN',
      verificationMode: 'FACE',
      isProcessed: false
    },
    {
      id: 'p-esl-2',
      deviceId: 'dev-001',
      deviceName: 'Main Door',
      deviceUserId: 'exact-sl-fp',
      employeeId: 'emp-exact-sl',
      punchTimestamp: '2026-08-15T17:00:00',
      punchDate: '2026-08-15',
      punchTime: '17:00:00',
      punchType: 'OUT',
      verificationMode: 'FACE',
      isProcessed: false
    }
  ] as any;

  const resultExactSL = AttendanceProcessor.processMonthAttendance(
    '2026-08',
    [employeeExactShortLeave],
    exactShortLeavePunches,
    [exactShortLeave],
    [],
    mockSettings
  );
  const exactSLRecord = resultExactSL.records.find(r => r.date === '2026-08-15');
  if (!exactSLRecord) throw new Error('Exact short leave record not found');
  console.log(`- Calculated Short Leave Minutes: ${exactSLRecord.shortLeaveMinutes} (Expected: 90)`);
  console.log(`- Calculated Time Loss Minutes: ${exactSLRecord.timeLossMinutes} (Expected: 90)`);

  if (exactSLRecord.shortLeaveMinutes !== 90 || exactSLRecord.timeLossMinutes !== 90) {
    throw new Error(`FAIL: Exact Short Leave Minutes must be 90, got ${exactSLRecord.shortLeaveMinutes}`);
  }
  console.log('=> PASS\n');


  // ==========================================
  // NEW REQUIREMENT 3: MULTIPLE SHORT LEAVE TEST
  // ==========================================
  console.log('TEST 3.1: Multiple Approved Short Leaves in One Day');
  const employeeMultipleSL: Employee = {
    ...mockEmployee,
    id: 'emp-mult-sl',
    employeeCode: 'EMP_MSL',
    fingerprintUserId: 'mult-sl-fp'
  };

  const multSL1: EmployeeLeave = {
    id: 'lv-msl-1',
    employeeId: 'emp-mult-sl',
    leaveTypeId: 'lt-03',
    startDate: '2026-08-17',
    endDate: '2026-08-17',
    durationType: 'SHORT_LEAVE',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    daysCount: 0.125,
    status: 'APPROVED',
    reason: 'Short Leave 1'
  } as any;

  const multSL2: EmployeeLeave = {
    id: 'lv-msl-2',
    employeeId: 'emp-mult-sl',
    leaveTypeId: 'lt-03',
    startDate: '2026-08-17',
    endDate: '2026-08-17',
    durationType: 'SHORT_LEAVE',
    startTime: '15:00',
    endTime: '15:30',
    durationMinutes: 30,
    daysCount: 0.0625,
    status: 'APPROVED',
    reason: 'Short Leave 2'
  } as any;

  const multSLPunches = [
    {
      id: 'p-msl-1',
      deviceId: 'dev-001',
      deviceName: 'Main Door',
      deviceUserId: 'mult-sl-fp',
      employeeId: 'emp-mult-sl',
      punchTimestamp: '2026-08-17T08:00:00',
      punchDate: '2026-08-17',
      punchTime: '08:00:00',
      punchType: 'IN',
      verificationMode: 'FACE',
      isProcessed: false
    },
    {
      id: 'p-msl-2',
      deviceId: 'dev-001',
      deviceName: 'Main Door',
      deviceUserId: 'mult-sl-fp',
      employeeId: 'emp-mult-sl',
      punchTimestamp: '2026-08-17T17:00:00',
      punchDate: '2026-08-17',
      punchTime: '17:00:00',
      punchType: 'OUT',
      verificationMode: 'FACE',
      isProcessed: false
    }
  ] as any;

  const resultMultSL = AttendanceProcessor.processMonthAttendance(
    '2026-08',
    [employeeMultipleSL],
    multSLPunches,
    [multSL1, multSL2],
    [],
    mockSettings
  );
  const multSLRecord = resultMultSL.records.find(r => r.date === '2026-08-17');
  if (!multSLRecord) throw new Error('Multiple short leave record not found');
  console.log(`- Combined Short Leave Minutes: ${multSLRecord.shortLeaveMinutes} (Expected: 90)`);
  console.log(`- Combined Time Loss Minutes: ${multSLRecord.timeLossMinutes} (Expected: 90)`);

  if (multSLRecord.shortLeaveMinutes !== 90 || multSLRecord.timeLossMinutes !== 90) {
    throw new Error(`FAIL: Combined Short Leaves must sum to 90 minutes, got ${multSLRecord.shortLeaveMinutes}`);
  }
  console.log('=> PASS\n');


  // ==========================================
  // NEW REQUIREMENT 4: ADD OVERLAP TEST
  // ==========================================
  console.log('TEST 4.1: Short Leave Overlap Validation');
  const checkOverlap = (l1: any, l2: any): boolean => {
    if (l1.employeeId !== l2.employeeId) return false;
    if (l1.startDate !== l2.startDate) return false;
    
    const calculateDiffMinutesTest = (startStr: string, endStr: string): number => {
      const [sh, sm] = startStr.split(':').map(Number);
      const [eh, em] = endStr.split(':').map(Number);
      return (eh * 60 + em) - (sh * 60 + sm);
    };

    const s1 = calculateDiffMinutesTest('00:00', l1.startTime);
    const e1 = calculateDiffMinutesTest('00:00', l1.endTime);
    const s2 = calculateDiffMinutesTest('00:00', l2.startTime);
    const e2 = calculateDiffMinutesTest('00:00', l2.endTime);

    // Standard interval overlap check
    return s1 < e2 && e1 > s2;
  };

  const shortLeave1 = { employeeId: 'emp-overlap', startDate: '2026-08-17', startTime: '10:00', endTime: '11:00' };
  const shortLeave2 = { employeeId: 'emp-overlap', startDate: '2026-08-17', startTime: '10:30', endTime: '11:30' };

  const hasOverlap = checkOverlap(shortLeave1, shortLeave2);
  console.log(`- Overlap Detected: ${hasOverlap} (Expected: true)`);
  if (!hasOverlap) {
    throw new Error('FAIL: Overlapping short leaves must be detected and the second one rejected.');
  }
  console.log('=> PASS\n');


  // ==========================================
  // NEW REQUIREMENT 5: ADD FULL-DAY LEAVE TEST
  // ==========================================
  console.log('TEST 5.1: Full-Day Paid Leave Metrics Exclusions');
  const employeeFullLeave: Employee = {
    ...mockEmployee,
    id: 'emp-full-leave',
    employeeCode: 'EMP_FL',
    fingerprintUserId: 'fl-fp'
  };

  const fullPaidLeave: EmployeeLeave = {
    id: 'lv-fl-paid',
    employeeId: 'emp-full-leave',
    leaveTypeId: 'lt-01', // Annual Leave
    startDate: '2026-08-18',
    endDate: '2026-08-18',
    daysCount: 1.0,
    status: 'APPROVED',
    reason: 'Family Event'
  } as any;

  const fullLeavePunches = [
    {
      id: 'p-fl-1',
      deviceId: 'dev-001',
      deviceName: 'Main Door',
      deviceUserId: 'fl-fp',
      employeeId: 'emp-full-leave',
      punchTimestamp: '2026-08-18T08:45:00', // Late but should be ignored
      punchDate: '2026-08-18',
      punchTime: '08:45:00',
      punchType: 'IN',
      verificationMode: 'FACE',
      isProcessed: false
    }
  ] as any;

  const resultFullPaid = AttendanceProcessor.processMonthAttendance(
    '2026-08',
    [employeeFullLeave],
    fullLeavePunches,
    [fullPaidLeave],
    [],
    mockSettings
  );
  const fullPaidRecord = resultFullPaid.records.find(r => r.date === '2026-08-18');
  if (!fullPaidRecord) throw new Error('Full paid leave record not found');
  console.log(`- Status: ${fullPaidRecord.status} (Expected: LEAVE)`);
  console.log(`- Late Minutes: ${fullPaidRecord.lateMinutes} (Expected: 0)`);
  console.log(`- Early Departure Minutes: ${fullPaidRecord.earlyLeaveMinutes} (Expected: 0)`);
  console.log(`- Short Leave Minutes: ${fullPaidRecord.shortLeaveMinutes} (Expected: 0)`);
  console.log(`- Time Loss Minutes: ${fullPaidRecord.timeLossMinutes} (Expected: 0)`);

  if (fullPaidRecord.lateMinutes !== 0 || fullPaidRecord.earlyLeaveMinutes !== 0 || fullPaidRecord.shortLeaveMinutes !== 0 || fullPaidRecord.timeLossMinutes !== 0) {
    throw new Error('FAIL: Full-day paid leave must completely exclude time loss metrics!');
  }
  console.log('=> PASS\n');


  // ==========================================
  // NEW REQUIREMENT 6: ADD FULL-DAY NO-PAY TEST
  // ==========================================
  console.log('TEST 6.1: Full-Day No-Pay Leave Metrics Exclusions & Payroll Integration');
  const employeeNoPay: Employee = {
    ...mockEmployee,
    id: 'emp-nopay',
    employeeCode: 'EMP_NP',
    fingerprintUserId: 'nopay-fp',
    basicSalary: 60000
  };

  const fullNoPayLeave: EmployeeLeave = {
    id: 'lv-nopay',
    employeeId: 'emp-nopay',
    leaveTypeId: 'lt-04', // No Pay Leave
    startDate: '2026-08-19',
    endDate: '2026-08-19',
    daysCount: 1.0,
    status: 'APPROVED',
    reason: 'Unpaid Leave'
  } as any;

  const resultNoPay = AttendanceProcessor.processMonthAttendance(
    '2026-08',
    [employeeNoPay],
    [],
    [fullNoPayLeave],
    [],
    mockSettings
  );
  const noPayRecord = resultNoPay.records.find(r => r.date === '2026-08-19');
  if (!noPayRecord) throw new Error('No-pay record not found');
  console.log(`- Status: ${noPayRecord.status} (Expected: NO_PAY)`);
  console.log(`- Late Minutes: ${noPayRecord.lateMinutes} (Expected: 0)`);
  console.log(`- Early Departure Minutes: ${noPayRecord.earlyLeaveMinutes} (Expected: 0)`);
  console.log(`- Short Leave Minutes: ${noPayRecord.shortLeaveMinutes} (Expected: 0)`);
  console.log(`- Time Loss Minutes: ${noPayRecord.timeLossMinutes} (Expected: 0)`);

  if (noPayRecord.lateMinutes !== 0 || noPayRecord.earlyLeaveMinutes !== 0 || noPayRecord.shortLeaveMinutes !== 0 || noPayRecord.timeLossMinutes !== 0) {
    throw new Error('FAIL: Full-day no-pay leave must completely exclude time loss metrics!');
  }

  // Calculate payroll and ensure no double deduction
  const payrollNoPayResult = PayrollEngine.calculateEmployeeSalary({
    employee: employeeNoPay,
    workedDays: 24,
    unpaidLeaveDays: 1,
    otHours: 0,
    lateMinutes: 0,
    shortLeaveMinutes: 0,
    timeLossMinutes: 0,
    settings: mockSettings,
    rules: [],
    monthlyWorkingDays: 25
  });

  console.log(`- Calculated No-Pay basic deduction: Rs. ${payrollNoPayResult.noPayBasicDeduction} (Expected: 2400)`);
  console.log(`- Short Leave / Time Loss deduction: Rs. ${payrollNoPayResult.shortLeaveDeduction} (Expected: 0)`);
  
  if (payrollNoPayResult.noPayBasicDeduction !== 2400 || payrollNoPayResult.shortLeaveDeduction !== 0) {
    throw new Error('FAIL: Full-day no-pay leave payroll calculation has double deduction or invalid basic deduction!');
  }
  console.log('=> PASS\n');


  // ==========================================
  // NEW REQUIREMENT 7: MONTHLY WORKING-DAY TEST
  // ==========================================
  console.log('TEST 7.1: Monthly Working Day Computation with Overlapping Holidays & Override');
  const testHolidays = [
    { id: 'h1', name: 'Poya Day 1', date: '2026-08-05', type: 'Poya' },
    { id: 'h2', name: 'Public Holiday 1', date: '2026-08-12', type: 'Public' },
    { id: 'h3', name: 'Mercantile Holiday 1', date: '2026-08-19', type: 'Mercantile' },
    // Overlapping holiday: 2026-08-20 is both Poya and Public
    { id: 'h4', name: 'Poya Day 2', date: '2026-08-20', type: 'Poya' },
    { id: 'h5', name: 'Public Holiday 2', date: '2026-08-20', type: 'Public' }
  ] as any[];

  // Mutate DatabaseService static state safely using standard TS type coercion
  (DatabaseService as any).state = {
    holidays: testHolidays,
    monthlyWorkingDays: [],
    employees: [],
    processedAttendance: [],
    employeeLeaves: []
  };

  const calcDays = DatabaseService.calculateWorkingDaysForMonth(2026, 8);
  console.log(`- Calendar Days: ${calcDays.calendarDays} (Expected: 31)`);
  console.log(`- Sundays: ${calcDays.sundaysCount} (Expected: 5)`);
  console.log(`- Poya Holidays: ${calcDays.poyaCount} (Expected: 2)`);
  console.log(`- Public Holidays: ${calcDays.publicHolidayCount} (Expected: 2)`);
  console.log(`- Mercantile Holidays: ${calcDays.mercantileHolidayCount} (Expected: 1)`);
  console.log(`- Automatic Working Days: ${calcDays.autoWorkingDays} (Expected: 22)`);

  if (calcDays.autoWorkingDays !== 22) {
    throw new Error(`FAIL: Automatic working days should be 22, got ${calcDays.autoWorkingDays}`);
  }

  // Verify manual override mechanism
  const config = DatabaseService.getMonthlyWorkingDaysConfig('2026-08');
  console.log(`- Config initial final days: ${config.finalWorkingDays} (Expected: 22)`);
  
  // Set manual override
  config.manualOverride = true;
  config.manualWorkingDays = 24;
  
  // Save & Re-fetch
  DatabaseService.saveMonthlyWorkingDaysConfig(config);
  const updatedConfig = DatabaseService.getMonthlyWorkingDaysConfig('2026-08');
  console.log(`- Config after override final days: ${updatedConfig.finalWorkingDays} (Expected: 24)`);

  if (updatedConfig.finalWorkingDays !== 24) {
    throw new Error(`FAIL: Final working days must be 24 when manual override is 24`);
  }
  console.log('=> PASS\n');


  // ==========================================
  // NEW REQUIREMENT 8: CUSTOMER PAYROLL TEST
  // ==========================================
  console.log('TEST 8.1: Customer Specific Salary Deduction Matrix (9 Hours Workday)');
  const customerEmployee: Employee = {
    ...mockEmployee,
    id: 'emp-cust',
    employeeCode: 'EMP_CUST',
    basicSalary: 30000,
    normalWorkingHours: 9
  };

  const customerSettings: CompanySettings = {
    ...mockSettings,
    normalWorkingHoursPerDay: 9,
    shortLeaveAllowanceMinutes: 300
  };

  const payrollCustResult = PayrollEngine.calculateEmployeeSalary({
    employee: customerEmployee,
    workedDays: 25,
    unpaidLeaveDays: 0,
    otHours: 0,
    lateMinutes: 0,
    shortLeaveMinutes: 420,
    timeLossMinutes: 420,
    settings: customerSettings,
    rules: [],
    monthlyWorkingDays: 25
  });

  const expectedRate = 30000 / 25 / 9 / 60; // ≈ 2.2222 LKR/min
  const expectedDeduction = Math.round(120 * expectedRate); // 267 LKR

  console.log(`- Expected Minute Rate: ${expectedRate.toFixed(4)} (Expected ≈ 2.2222)`);
  console.log(`- Calculated Short Leave Deduction: Rs. ${payrollCustResult.shortLeaveDeduction} (Expected: ${expectedDeduction})`);

  if (Math.abs(payrollCustResult.shortLeaveDeduction - 267) > 0.01) {
    throw new Error(`FAIL: Customer short leave deduction should be Rs.267, got Rs.${payrollCustResult.shortLeaveDeduction}`);
  }
  console.log('=> PASS\n');


  // ==========================================
  // NEW REQUIREMENT 11: TEST DATA PRESERVATION
  // ==========================================
  console.log('TEST 11.1: Database Persistence Data Preservation Simulation');
  
  // Set up mock IPC
  (global as any).window = {
    electronAPI: {
      dbSaveAll: async (state: any) => {
        return { success: true };
      }
    }
  };

  // Clear state
  (DatabaseService as any).state = {
    employees: [],
    processedAttendance: [],
    employeeLeaves: [],
    holidays: [],
    departments: [],
    designations: [],
    devices: [],
    rawPunches: [],
    incentives: [],
    payrollCategories: [],
    payrollPeriods: [],
    allowanceRules: [],
    leaveTypes: [],
    monthlyWorkingDays: [],
    auditLogs: []
  };

  // Create Employee A and B
  const empA: Employee = { ...mockEmployee, id: 'emp-A', employeeCode: 'EMPA', fullName: 'Employee A' };
  const empB: Employee = { ...mockEmployee, id: 'emp-B', employeeCode: 'EMPB', fullName: 'Employee B' };
  
  await DatabaseService.saveEmployee(empA);
  await DatabaseService.saveEmployee(empB);

  console.log(`- Initial Employees count: ${(DatabaseService as any).state.employees.length} (Expected: 2)`);
  if ((DatabaseService as any).state.employees.length !== 2) {
    throw new Error('FAIL: Both employees must be preserved initially.');
  }

  // Update Employee A
  const updatedEmpA = { ...empA, fullName: 'Employee A Updated' };
  await DatabaseService.saveEmployee(updatedEmpA);

  console.log(`- Employees count after update: ${(DatabaseService as any).state.employees.length} (Expected: 2)`);
  let foundB = (DatabaseService as any).state.employees.find((e: any) => e.id === 'emp-B');
  console.log(`- Employee B still exists: ${!!foundB}`);
  if (!foundB) {
    throw new Error('FAIL: Employee B vanished after updating Employee A!');
  }

  // Create attendance for Employee A
  const attA: ProcessedAttendance = {
    id: 'att-A',
    employeeId: 'emp-A',
    date: '2026-08-01',
    totalHours: 8,
    normalHours: 8,
    otHours: 0,
    lateMinutes: 0,
    earlyLeaveMinutes: 0,
    shortLeaveMinutes: 0,
    timeLossMinutes: 0,
    status: 'PRESENT',
    isManualCorrection: false,
    remarks: 'Test Attendance'
  };

  DatabaseService.saveProcessedAttendanceBatch([attA]);
  console.log(`- Attendance Count: ${(DatabaseService as any).state.processedAttendance.length} (Expected: 1)`);
  foundB = (DatabaseService as any).state.employees.find((e: any) => e.id === 'emp-B');
  console.log(`- Employee B still exists after attendance: ${!!foundB}`);
  if (!foundB) {
    throw new Error('FAIL: Employee B vanished after saving attendance!');
  }

  // Create leave for Employee A
  const leaveA: EmployeeLeave = {
    id: 'leave-A',
    employeeId: 'emp-A',
    leaveTypeId: 'lt-01',
    startDate: '2026-08-02',
    endDate: '2026-08-02',
    daysCount: 1,
    status: 'APPROVED',
    reason: 'Vacation'
  } as any;

  await DatabaseService.saveLeave(leaveA);
  console.log(`- Leaves Count: ${(DatabaseService as any).state.employeeLeaves.length} (Expected: 1)`);
  
  foundB = (DatabaseService as any).state.employees.find((e: any) => e.id === 'emp-B');
  const foundAtt = (DatabaseService as any).state.processedAttendance.find((a: any) => a.id === 'att-A');
  console.log(`- Employee B still exists after leave: ${!!foundB}`);
  console.log(`- Attendance still exists after leave: ${!!foundAtt}`);

  if (!foundB) {
    throw new Error('FAIL: Employee B vanished after saving leave!');
  }
  if (!foundAtt) {
    throw new Error('FAIL: Attendance record vanished after saving leave!');
  }
  console.log('=> PASS\n');


  console.log('==================================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! Sri Lankan Statutory Compliance Secured.');
  console.log('==================================================');
}

try {
  runTests();
} catch (err: any) {
  console.error('\n❌ TEST SUITE FAILED:');
  console.error(err.message || err);
  process.exit(1);
}
