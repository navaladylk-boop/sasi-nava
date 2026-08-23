import { AttendanceProcessor } from '../src/services/attendanceProcessor';
import { PayrollEngine } from '../src/services/payrollEngine';
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

function runTests() {
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
    rules: []
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
    rules: []
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
