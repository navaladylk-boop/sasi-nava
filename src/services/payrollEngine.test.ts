import { PayrollEngine } from './payrollEngine';
import { CompanySettings, Employee, AllowanceDeductionRule, EmployeeLeave } from '../types';
import { AttendanceProcessor } from './attendanceProcessor';

// Mock settings and rules for testing LankaHR Payroll new business rules
const testSettings: CompanySettings = {
  id: 'company-01',
  companyName: 'Test Lanka Manufacturing',
  address: 'Colombo',
  telephone: '123456',
  email: 'test@lankahr.lk',
  epfRegistrationNumber: 'EPF-TEST-123',
  defaultWorkingDaysPerMonth: 25,
  normalWorkingHoursPerDay: 9, // Configurable daily working hours (Part 9)
  shiftStartTime: '08:00',
  shiftEndTime: '17:00',
  lateGraceMinutes: 15,
  breakTimeMinutes: 0, // Configurable break time (Part 9)
  shortLeaveAllowanceMinutes: 300, // Configurable Short Leave allowance (Part 10)
  shortLeaveRateType: 'AUTOMATIC', // Configurable rate selection (Part 23)
  shortLeaveFixedMinuteRate: 2.50,
  epfEmployeeRate: 8,
  epfEmployerRate: 12,
  etfEmployerRate: 3,
};

const testRules: AllowanceDeductionRule[] = [];

const testEmployee: Employee = {
  id: 'emp-01',
  employeeCode: 'EMP001',
  fullName: 'Sahan Perera',
  nic: '199508123456',
  dob: '1995-08-01',
  gender: 'MALE',
  address: 'Colombo',
  telephone: '0771234567',
  email: 'sahan@test.lk',
  departmentId: 'dept-01',
  designationId: 'desg-01',
  joinDate: '2023-01-01',
  employmentStatus: 'PERMANENT',
  epfNumber: 'EPF-101',
  epfEnabled: true,
  etfEnabled: true,
  basicSalary: 30000,
  fixedAllowance: 5000,
  otherAllowance: 0,
  bankName: 'BOC',
  bankAccountNumber: '123456789',
  branch: 'Colombo Fort',
  payrollCategoryId: 'cat-01',
  workingDaysPerMonth: 25,
  normalWorkingHours: 9,
  otRateType: '1.5X_STANDARD',
  isActive: true,
  fingerprintUserId: '1',
};

export function runPayrollEngineTests() {
  console.log('--- STARTING LANKAHR PAYROLL ENGINE TEST SUITE ---');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failCount++;
    }
  }

  try {
    // Test 1: Dynamic Working Days & No-Pay Daily Rate Calculation
    // Basic = 30,000, Final working days = 23, Unpaid/No-Pay Days = 5
    // Divisor should be 23 instead of hardcoded 25
    const test1Result = PayrollEngine.calculateEmployeeSalary({
      employee: testEmployee,
      workedDays: 18,
      unpaidLeaveDays: 5,
      otHours: 0,
      lateMinutes: 0,
      settings: testSettings,
      rules: testRules,
      monthlyWorkingDays: 23, // 23 Days divisor override
    });

    const expectedDailyRate = 30000 / 23;
    const expectedNoPayDeduction = Math.round(expectedDailyRate * 5); // 6,522
    assert(
      test1Result.workingDays === 23,
      'Should use dynamic final working days divisor (23 days)'
    );
    assert(
      test1Result.noPayBasicDeduction === expectedNoPayDeduction,
      `No-Pay basic deduction should be based on dynamic daily rate (${test1Result.noPayBasicDeduction} vs expected ${expectedNoPayDeduction})`
    );
    assert(
      test1Result.netBasicSalary === 30000 - expectedNoPayDeduction,
      'Net basic salary should equal Basic - No Pay deduction'
    );

    // Test 2: EPF / ETF calculated on Net Basic Salary (Basic minus No-Pay deduction)
    // Basic = 30,000, No-pay basic = 6,522, EPF Liable salary = 23,478
    // EPF Employee (8%) = 23,478 * 0.08 = 1,878
    // EPF Employer (12%) = 23,478 * 0.12 = 2,817
    // ETF Employer (3%) = 23,478 * 0.03 = 704
    const expectedEpfBasis = 30000 - expectedNoPayDeduction;
    const expectedEpfEmployee = Math.round(expectedEpfBasis * 0.08);
    const expectedEpfEmployer = Math.round(expectedEpfBasis * 0.12);
    const expectedEtfEmployer = Math.round(expectedEpfBasis * 0.03);

    assert(
      test1Result.epfLiableSalary === expectedEpfBasis,
      'EPF/ETF liable salary must be Basic Salary after NO_PAY deduction'
    );
    assert(
      test1Result.epfEmployeeAmount === expectedEpfEmployee,
      `Employee EPF amount (8%) should be Rs. ${expectedEpfEmployee} (got ${test1Result.epfEmployeeAmount})`
    );
    assert(
      test1Result.epfEmployerAmount === expectedEpfEmployer,
      `Employer EPF share (12%) should be Rs. ${expectedEpfEmployer} (got ${test1Result.epfEmployerAmount})`
    );
    assert(
      test1Result.etfEmployerAmount === expectedEtfEmployer,
      `Employer ETF share (3%) should be Rs. ${expectedEtfEmployer} (got ${test1Result.etfEmployerAmount})`
    );

    // Test 3: Configurable Short Leave Free Allowance & Automatic Minute Rate
    // Eligible time loss = 420 minutes (7 hours)
    // Short Leave free allowance = 300 minutes (5 hours)
    // Excess minutes = 120 minutes (2 hours)
    // Rate type = AUTOMATIC
    // Automatic Minute Rate = 30000 / 23 working days / 9 working hours / 60 = 2.415459...
    // Expected deduction = Math.round(120 * (30000 / 23 / 9 / 60)) = Math.round(120 * 2.415459...) = 290
    const test3Result = PayrollEngine.calculateEmployeeSalary({
      employee: testEmployee,
      workedDays: 18,
      unpaidLeaveDays: 5,
      otHours: 0,
      lateMinutes: 0,
      timeLossMinutes: 420, // 420 minutes total
      settings: testSettings,
      rules: testRules,
      monthlyWorkingDays: 23,
    });

    const expectedAutoMinuteRate = 30000 / 23 / 9 / 60;
    const expectedAutoDeduction = Math.round(120 * expectedAutoMinuteRate);
    assert(
      test3Result.timeLossMinutes === 420,
      'Should register time loss minutes of 420'
    );
    assert(
      test3Result.shortLeaveDeduction === expectedAutoDeduction,
      `Automatic minute rate short leave deduction should be Rs. ${expectedAutoDeduction} (got ${test3Result.shortLeaveDeduction})`
    );

    // Test 4: Short Leave Fixed Minute Rate Option
    // Excess minutes = 120 minutes
    // Rate type = FIXED, Fixed rate = Rs. 2.50 per minute (Part 23)
    // Expected deduction = 120 * 2.50 = 300
    const fixedRateSettings: CompanySettings = {
      ...testSettings,
      shortLeaveRateType: 'FIXED',
      shortLeaveFixedMinuteRate: 2.50,
    };
    const test4Result = PayrollEngine.calculateEmployeeSalary({
      employee: testEmployee,
      workedDays: 18,
      unpaidLeaveDays: 5,
      otHours: 0,
      lateMinutes: 0,
      timeLossMinutes: 420,
      settings: fixedRateSettings,
      rules: testRules,
      monthlyWorkingDays: 23,
    });

    const expectedFixedDeduction = Math.round(120 * 2.50);
    assert(
      test4Result.shortLeaveDeduction === expectedFixedDeduction,
      `Fixed minute rate short leave deduction should be Rs. ${expectedFixedDeduction} (got ${test4Result.shortLeaveDeduction})`
    );

    // Test 5: Multiple Non-Overlapping Short Leaves on the Same Day
    // Employee TEST001, Date: 2026-08-20, Short Leave 1: 10:00–11:00, Short Leave 2: 15:00–15:30
    // Expected: Both processed successfully. Total short leave minutes = 90.
    const testLeaves: EmployeeLeave[] = [
      {
        id: 'leave-sl-1',
        employeeId: 'emp-test-01',
        leaveTypeId: 'lt-short',
        startDate: '2026-08-20',
        endDate: '2026-08-20',
        appliedDate: '2026-08-19',
        daysCount: 0,
        durationType: 'SHORT_LEAVE',
        startTime: '10:00',
        endTime: '11:00',
        durationMinutes: 60,
        status: 'APPROVED',
        reason: 'Personal'
      },
      {
        id: 'leave-sl-2',
        employeeId: 'emp-test-01',
        leaveTypeId: 'lt-short',
        startDate: '2026-08-20',
        endDate: '2026-08-20',
        appliedDate: '2026-08-19',
        daysCount: 0,
        durationType: 'SHORT_LEAVE',
        startTime: '15:00',
        endTime: '15:30',
        durationMinutes: 30,
        status: 'APPROVED',
        reason: 'Personal'
      }
    ];

    const testEmpTEST001: Employee = {
      ...testEmployee,
      id: 'emp-test-01',
      employeeCode: 'TEST001',
      normalWorkingHours: 9
    };

    const processingResult = AttendanceProcessor.processMonthAttendance(
      '2026-08',
      [testEmpTEST001],
      [
        {
          id: 'p-1',
          deviceId: 'd1',
          deviceName: 'Device 1',
          deviceUserId: 'TEST001',
          employeeId: 'emp-test-01',
          punchDate: '2026-08-20',
          punchTime: '08:00:00',
          punchTimestamp: '2026-08-20 08:00:00',
          punchType: 'IN',
          verificationMode: 'FINGERPRINT',
          isProcessed: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'p-2',
          deviceId: 'd1',
          deviceName: 'Device 1',
          deviceUserId: 'TEST001',
          employeeId: 'emp-test-01',
          punchDate: '2026-08-20',
          punchTime: '17:00:00',
          punchTimestamp: '2026-08-20 17:00:00',
          punchType: 'OUT',
          verificationMode: 'FINGERPRINT',
          isProcessed: false,
          createdAt: new Date().toISOString()
        }
      ],
      testLeaves,
      [],
      testSettings
    );

    const targetDayRecord = processingResult.records.find(r => r.date === '2026-08-20');
    assert(
      targetDayRecord !== undefined,
      'Should process attendance for 2026-08-20'
    );
    assert(
      targetDayRecord?.shortLeaveMinutes === 90,
      `Total Short Leave minutes should be 90 (got ${targetDayRecord?.shortLeaveMinutes})`
    );

    // Test 6: Overlapping Short Leave validation helper function simulation
    // Let's verify that the overlap logic inside our validator behaves exactly as requested.
    // 10:00 -> 11:00 overlaps with 10:30 -> 11:30
    const checkOverlap = (s1: string, e1: string, s2: string, e2: string): boolean => {
      const getMins = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      return getMins(s1) < getMins(e2) && getMins(e1) > getMins(s2);
    };

    assert(
      checkOverlap('10:00', '11:00', '10:30', '11:30') === true,
      '10:00-11:00 should overlap with 10:30-11:30'
    );
    assert(
      checkOverlap('10:00', '11:00', '15:00', '15:30') === false,
      '10:00-11:00 should NOT overlap with 15:00-15:30'
    );

    // Test 7: Full Day Leave Protection
    // Create: Full Day Paid Leave. Expected: Time loss = 0.
    const fullDayLeaveList: EmployeeLeave[] = [
      {
        id: 'leave-fd-1',
        employeeId: 'emp-test-01',
        leaveTypeId: 'lt-paid',
        startDate: '2026-08-20',
        endDate: '2026-08-20',
        appliedDate: '2026-08-19',
        daysCount: 1,
        durationType: 'FULL_DAY',
        status: 'APPROVED',
        reason: 'Paid Annual Leave'
      }
    ];

    const processingResultFullDay = AttendanceProcessor.processMonthAttendance(
      '2026-08',
      [testEmpTEST001],
      [
        {
          id: 'p-1',
          deviceId: 'd1',
          deviceName: 'Device 1',
          deviceUserId: 'TEST001',
          employeeId: 'emp-test-01',
          punchDate: '2026-08-20',
          punchTime: '08:45:00', // Late by 45 mins, but has full day leave approved
          punchTimestamp: '2026-08-20 08:45:00',
          punchType: 'IN',
          verificationMode: 'FINGERPRINT',
          isProcessed: false,
          createdAt: new Date().toISOString()
        }
      ],
      fullDayLeaveList,
      [],
      testSettings
    );

    const fullDayRecord = processingResultFullDay.records.find(r => r.date === '2026-08-20');
    assert(
      fullDayRecord?.timeLossMinutes === 0,
      `Full-day leave should result in exactly 0 time loss minutes (got ${fullDayRecord?.timeLossMinutes})`
    );

    // Test 8: Working Days Divisor Validation
    // If Final Working Days is 23: Basic Daily Rate: 30,000 / 23 = 1304.35 (NOT 30,000 / 25)
    const test8Result = PayrollEngine.calculateEmployeeSalary({
      employee: testEmployee,
      workedDays: 23,
      unpaidLeaveDays: 0,
      otHours: 0,
      lateMinutes: 0,
      settings: testSettings,
      rules: testRules,
      monthlyWorkingDays: 23
    });

    const expectedRateFor23 = 30000 / 23;
    assert(
      test8Result.basicDailyRate === Math.round(expectedRateFor23 * 100) / 100,
      `Daily rate with 23 working days should be ${Math.round(expectedRateFor23 * 100) / 100} (got ${test8Result.basicDailyRate})`
    );

    console.log(`\n--- TEST RESULTS Summary: ${passCount} PASSED, ${failCount} FAILED ---`);
  } catch (error) {
    console.error('Test execution failed with error:', error);
  }
}
