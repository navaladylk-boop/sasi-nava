import { PayrollEngine } from './payrollEngine';
import { CompanySettings, Employee, AllowanceDeductionRule } from '../types';

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

    console.log(`\n--- TEST RESULTS Summary: ${passCount} PASSED, ${failCount} FAILED ---`);
  } catch (error) {
    console.error('Test execution failed with error:', error);
  }
}
