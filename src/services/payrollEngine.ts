import {
  Employee,
  PayrollCategory,
  AllowanceDeductionRule,
  ProcessedAttendance,
  IncentiveRecord,
  CompanySettings,
  CalculatedSalaryRecord,
  PayrollPeriod,
  Department,
  Designation
} from '../types';

export interface SingleEmployeeSalaryInput {
  employee: Employee;
  workedDays: number;
  unpaidLeaveDays: number;
  otHours: number;
  lateMinutes: number;
  shortLeaveMinutes?: number;
  timeLossMinutes?: number;
  incentiveAmount?: number;
  loanDeduction?: number;
  advanceDeduction?: number;
  otherDeductions?: number;
  settings: CompanySettings;
  rules: AllowanceDeductionRule[];
  categories?: PayrollCategory[];
  departments?: Department[];
  designations?: Designation[];
  monthlyWorkingDays?: number;
}

export class PayrollEngine {
  /**
   * Calculates allowance deduction based on configured rule and unpaid days
   */
  public static calculateAllowanceDeduction(
    fixedAllowance: number,
    unpaidDays: number,
    rules: AllowanceDeductionRule[],
    ruleId?: string,
    workingDays?: number
  ): {
    deductionAmount: number;
    remainingAllowance: number;
    breakdown: string;
  } {
    if (!workingDays || workingDays <= 0) {
      throw new Error('Final working days are not configured for this payroll month.');
    }
    if (unpaidDays <= 0 || fixedAllowance <= 0) {
      return {
        deductionAmount: 0,
        remainingAllowance: fixedAllowance,
        breakdown: 'No unpaid leave taken. Full allowance payable.'
      };
    }

    // Select the employee-specific rule, or default active rule
    let rule = ruleId ? rules.find(r => r.id === ruleId) : undefined;
    if (!rule) {
      rule = rules.find(r => r.isDefault && r.isActive !== false) || rules.find(r => r.isActive !== false) || rules[0];
    }

    if (!rule) {
      return {
        deductionAmount: 0,
        remainingAllowance: fixedAllowance,
        breakdown: 'No active deduction rule found.'
      };
    }

    let deduction = 0;
    const breakdownParts: string[] = [];

    // TIERED RULE (Customer Specific Matrix: Day 1=1500, Day 2=1500, Day 3=1000, Day 4=1000, etc.)
    if (rule.ruleType === 'TIERED' || rule.ruleType === 'TIERED_DAYS') {
      const tiers = rule.tiers || [];
      for (let day = 1; day <= unpaidDays; day++) {
        const tier = tiers.find(t => t.dayNumber === day);
        if (tier) {
          deduction += tier.deductionAmount;
          breakdownParts.push(`Day ${day}: -Rs. ${tier.deductionAmount}`);
        } else {
          const beyondDeduction = rule.defaultDeductionBeyondTiers ?? 1000;
          deduction += beyondDeduction;
          breakdownParts.push(`Day ${day}: -Rs. ${beyondDeduction} (extra)`);
        }
      }
    } else if (rule.ruleType === 'DAILY_PRORATA') {
      const divisor = workingDays;
      const dailyRate = fixedAllowance / divisor;
      deduction = Math.round(dailyRate * unpaidDays);
      breakdownParts.push(`${unpaidDays} days × (Rs. ${fixedAllowance} ÷ ${divisor})`);
    } else if (rule.ruleType === 'PERCENTAGE') {
      const rate = rule.percentageRate || 4;
      deduction = Math.round(fixedAllowance * (rate / 100) * unpaidDays);
      breakdownParts.push(`${unpaidDays} days × ${rate}%`);
    }

    // Never deduct more than the allowance itself (Allowance can never become negative)
    const cappedDeduction = Math.min(deduction, fixedAllowance);
    const remaining = Math.max(0, fixedAllowance - cappedDeduction);

    return {
      deductionAmount: cappedDeduction,
      remainingAllowance: remaining,
      breakdown: breakdownParts.join(' + ') + ` = Total Rs. ${cappedDeduction.toLocaleString()}`
    };
  }

  /**
   * Calculates a single employee's monthly salary components with full Sri Lankan statutory compliance
   */
  public static calculateEmployeeSalary(input: SingleEmployeeSalaryInput): CalculatedSalaryRecord {
    const {
      employee: emp,
      workedDays,
      unpaidLeaveDays,
      otHours,
      lateMinutes,
      shortLeaveMinutes,
      timeLossMinutes,
      incentiveAmount = 0,
      loanDeduction = 0,
      advanceDeduction = 0,
      otherDeductions = 0,
      settings,
      rules,
      categories = [],
      departments = [],
      designations = [],
      monthlyWorkingDays
    } = input;

    const workingDays = monthlyWorkingDays;
    if (!workingDays || workingDays <= 0) {
      throw new Error('Final working days are not configured for this payroll month.');
    }
    const normalHours = emp.normalWorkingHours || settings.normalWorkingHoursPerDay;
    if (!normalHours || normalHours <= 0) {
      throw new Error('Valid daily working hours are not configured for this employee or company.');
    }

    // 1. Basic Salary & No-Pay basic deduction
    // Formula: Basic Daily Rate = Basic Salary ÷ Working Days (e.g. 30,000 ÷ 25 = 1,200/day)
    const basicSalary = emp.basicSalary || 0;
    const basicDailyRate = workingDays > 0 ? basicSalary / workingDays : 0;
    const noPayBasicDeduction = Math.round(basicDailyRate * unpaidLeaveDays);
    const netBasicSalary = Math.max(0, basicSalary - noPayBasicDeduction);

    // 2. Fixed Allowance & Tiered Allowance Deduction Rule
    const fixedAllowance = emp.fixedAllowance || 0;
    const otherAllowance = emp.otherAllowance || 0;
    const totalAllowances = fixedAllowance + otherAllowance;

    // Resolve employee rule
    const category = categories.find(c => c.id === emp.payrollCategoryId);
    const targetRuleId = emp.allowanceDeductionRuleId || category?.allowanceDeductionRuleId;
    const allowanceResult = this.calculateAllowanceDeduction(fixedAllowance, unpaidLeaveDays, rules, targetRuleId, workingDays);
    const noPayAllowanceDeduction = allowanceResult.deductionAmount;
    const netAllowance = Math.max(0, totalAllowances - noPayAllowanceDeduction);

    // 3. Overtime (OT) Calculation
    // Multiplier options: 1.5x (Standard), 2.0x (Holiday/Sunday), or Fixed Custom Rate
    const standardHourlyDivisor = workingDays * normalHours || 200;
    const standardHourlyRate = standardHourlyDivisor > 0 ? basicSalary / standardHourlyDivisor : 0;

    let otRateMultiplier = 1.5;
    if (emp.otRateType === '2.0X_HOLIDAY') {
      otRateMultiplier = 2.0;
    } else if (category?.defaultOtMultiplier) {
      otRateMultiplier = category.defaultOtMultiplier;
    }

    const otHourlyRate =
      emp.otRateType === 'FIXED_HOURLY' && emp.otCustomHourlyRate
        ? emp.otCustomHourlyRate
        : standardHourlyRate * otRateMultiplier;

    const otAmount = Math.round(otHourlyRate * otHours);

    // 4. Gross Salary
    // Gross = Net Basic + Net Allowance + OT + Real Incentives
    const grossSalary = netBasicSalary + netAllowance + otAmount + incentiveAmount;

    // 5. Sri Lankan Statutory Contributions (EPF / ETF)
    // Liable salary = Basic Salary - No-pay basic deduction
    const epfLiableSalary = netBasicSalary;

    const isEpfEnabled = emp.epfEnabled !== false;
    const isEtfEnabled = emp.etfEnabled !== false;

    const epfEmpRate = isEpfEnabled ? (category?.epfRateEmployee ?? settings.epfEmployeeRate ?? 8) : 0;
    const epfEmplrRate = isEpfEnabled ? (category?.epfRateEmployer ?? settings.epfEmployerRate ?? 12) : 0;
    const etfEmplrRate = isEtfEnabled ? (category?.etfRateEmployer ?? settings.etfEmployerRate ?? 3) : 0;

    const epfEmployeeAmount = isEpfEnabled ? Math.round((epfLiableSalary * epfEmpRate) / 100) : 0;
    const epfEmployerAmount = isEpfEnabled ? Math.round((epfLiableSalary * epfEmplrRate) / 100) : 0;
    const etfEmployerAmount = isEtfEnabled ? Math.round((epfLiableSalary * etfEmplrRate) / 100) : 0;

    // 6. Deductions & Net Salary
    // Short Leave / Time Loss calculation with configurable free monthly allowance
    const allowanceMinutes = settings.shortLeaveAllowanceMinutes !== undefined ? settings.shortLeaveAllowanceMinutes : 300;
    const eligibleTimeLoss = timeLossMinutes !== undefined ? timeLossMinutes : (lateMinutes || 0);
    const excessTimeLoss = Math.max(0, eligibleTimeLoss - allowanceMinutes);
    
    let minuteRate = 0;
    if (settings.shortLeaveRateType === 'FIXED' && settings.shortLeaveFixedMinuteRate !== undefined) {
      minuteRate = settings.shortLeaveFixedMinuteRate;
    } else {
      // Automatic Minute Rate = basicSalary / workingDays / normalHours / 60
      minuteRate = (workingDays > 0 && normalHours > 0) ? (basicSalary / workingDays / normalHours / 60) : 0;
    }
    const shortLeaveDeduction = Math.round(excessTimeLoss * minuteRate);

    const totalDeductions = epfEmployeeAmount + advanceDeduction + loanDeduction + otherDeductions + shortLeaveDeduction;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    // Cost to Company (CTC) = Gross Salary + Employer EPF 12% + Employer ETF 3%
    const costToCompany = grossSalary + epfEmployerAmount + etfEmployerAmount;

    // Resolve Department & Designation dynamically
    const dept = departments.find(d => d.id === emp.departmentId);
    const desig = designations.find(d => d.id === emp.designationId);
    const departmentName = dept ? dept.name : 'General';
    const designationTitle = desig ? desig.title : 'Staff';

    return {
      id: `sal-${emp.id}`,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      nameSinhala: emp.nameSinhala,
      nameTamil: emp.nameTamil,
      nic: emp.nic,
      epfNumber: emp.epfNumber,
      epfEnabled: isEpfEnabled,
      etfEnabled: isEtfEnabled,
      departmentName,
      designationTitle,
      bankName: emp.bankName,
      bankAccountNumber: emp.bankAccountNumber,
      workingDays,
      workedDays,
      unpaidLeaveDays,
      otHours,
      lateMinutes,
      shortLeaveMinutes: shortLeaveMinutes ?? 0,
      timeLossMinutes: eligibleTimeLoss,
      shortLeaveDeduction,
      basicSalary,
      basicDailyRate: Math.round(basicDailyRate * 100) / 100,
      noPayBasicDeduction,
      netBasicSalary,
      fixedAllowance,
      otherAllowance,
      totalAllowances,
      noPayAllowanceDeduction,
      netAllowance,
      otHourlyRate: Math.round(otHourlyRate * 100) / 100,
      otAmount,
      incentives: incentiveAmount,
      grossSalary,
      epfLiableSalary,
      epfEmployeeRate: epfEmpRate,
      epfEmployeeAmount,
      epfEmployerRate: epfEmplrRate,
      epfEmployerAmount,
      etfEmployerRate: etfEmplrRate,
      etfEmployerAmount,
      advanceDeduction,
      salaryAdvance: advanceDeduction,
      loanDeduction,
      loanDeductions: loanDeduction,
      otherDeductions,
      totalDeductions,
      netSalary,
      costToCompany
    };
  }
}
