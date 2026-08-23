import React, { useState } from 'react';
import {
  Calculator,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Landmark,
  Layers,
  ArrowRight,
  Sliders
} from 'lucide-react';
import {
  Employee,
  ProcessedAttendance,
  PayrollPeriod,
  CalculatedSalaryRecord,
  CompanySettings,
  AllowanceDeductionRule,
  Language,
  Department,
  Designation,
  EmployeeLeave,
  IncentiveRecord,
  PayrollCategory
} from '../../types';
import { translations } from '../../i18n/translations';
import { PayrollEngine } from '../../services/payrollEngine';
import { DatabaseService } from '../../services/db';
import { BackButton } from '../common/NavigationButtons';
import { ActiveTab } from '../layout/SidebarNav';

interface PayrollGenerationViewProps {
  language: Language;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  employees: Employee[];
  attendance: ProcessedAttendance[];
  payrollPeriod?: PayrollPeriod;
  settings: CompanySettings;
  allowanceRules: AllowanceDeductionRule[];
  departments?: Department[];
  designations?: Designation[];
  leaves?: EmployeeLeave[];
  incentives?: IncentiveRecord[];
  payrollCategories?: PayrollCategory[];
  onSavePayrollPeriod: (period: PayrollPeriod) => void;
  onNavigate: (tab: ActiveTab) => void;
  onBack?: () => void;
}

export const PayrollGenerationView: React.FC<PayrollGenerationViewProps> = ({
  language,
  currentMonth,
  onMonthChange,
  employees,
  attendance,
  payrollPeriod,
  settings,
  allowanceRules,
  departments = [],
  designations = [],
  leaves = [],
  incentives = [],
  payrollCategories = [],
  onSavePayrollPeriod,
  onNavigate,
  onBack
}) => {
  const t = translations[language];

  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calculationStep, setCalculationStep] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<CalculatedSalaryRecord | null>(null);

  const handleCalculatePayroll = () => {
    setIsCalculating(true);
    const workingDaysConfig = DatabaseService.getMonthlyWorkingDaysConfig(currentMonth);
    const finalWorkingDays = workingDaysConfig.finalWorkingDays;

    setCalculationStep('Step 1: Reading biometric attendance & leave records...');

    setTimeout(() => {
      setCalculationStep(`Step 2: Computing basic daily deductions (Basic ÷ ${finalWorkingDays} working days)...`);
      setTimeout(() => {
        setCalculationStep('Step 3: Evaluating Tiered Allowance deduction matrix...');
        setTimeout(() => {
          setCalculationStep('Step 4: Computing Overtime (1.5x/2.0x) & Sri Lankan EPF/ETF (8%, 12%, 3%)...');
          setTimeout(() => {
            const calculatedRecords: CalculatedSalaryRecord[] = [];

            employees.filter(e => e.isActive).forEach(emp => {
              // Extract employee attendance for the month
              const empAtt = attendance.filter(
                a => a.employeeId === emp.id && a.date.startsWith(currentMonth)
              );

              const workedDaysFromAtt = empAtt.filter(a => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;
              const noPayDaysFromAtt = empAtt.filter(a => a.status === 'NO_PAY' || a.status === 'ABSENT').length;

              // Read approved unpaid leaves for this employee in the month
              const empLeaves = leaves.filter(
                l => l.employeeId === emp.id &&
                l.status === 'APPROVED' &&
                (l.startDate.startsWith(currentMonth) || l.endDate.startsWith(currentMonth))
              );

              const noPayLeaveDays = empLeaves
                .filter(l => {
                  return l.leaveTypeId === 'lt-04' ||
                         l.leaveTypeId === 'lt-4' ||
                         l.leaveTypeId.toLowerCase().includes('no_pay') ||
                         l.leaveTypeId.toLowerCase().includes('unpaid');
                })
                .reduce((sum, l) => sum + (Number(l.daysCount) || 0), 0);

              // Total unpaid/no-pay days (max of attendance absence or leave requests)
              const totalUnpaidDays = Math.max(noPayDaysFromAtt, noPayLeaveDays);

              const standardWorkingDays = finalWorkingDays;
              const calculatedWorkedDays = workedDaysFromAtt > 0
                ? workedDaysFromAtt
                : Math.max(0, standardWorkingDays - totalUnpaidDays);

              const otHours = empAtt.reduce((sum, a) => sum + (Number(a.otHours) || 0), 0);
              const lateMins = empAtt.reduce((sum, a) => sum + (Number(a.lateMinutes) || 0), 0);
              const shortLeaveMins = empAtt.reduce((sum, a) => sum + (Number(a.shortLeaveMinutes) || 0), 0);
              const timeLossMins = empAtt.reduce((sum, a) => sum + (Number(a.timeLossMinutes) || 0), 0);

              // Read real approved incentives from DB
              const employeeIncentives = incentives.filter(
                i => i.employeeId === emp.id && i.payrollMonth === currentMonth
              );
              const realIncentiveTotal = employeeIncentives.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

              // Preserve existing manual adjustments if present
              const existingRecord = payrollPeriod?.records.find(r => r.employeeId === emp.id);

              const calc = PayrollEngine.calculateEmployeeSalary({
                employee: emp,
                workedDays: calculatedWorkedDays,
                unpaidLeaveDays: totalUnpaidDays,
                otHours,
                lateMinutes: lateMins,
                shortLeaveMinutes: shortLeaveMins,
                timeLossMinutes: timeLossMins,
                incentiveAmount: realIncentiveTotal > 0 ? realIncentiveTotal : (existingRecord?.incentives || 0),
                loanDeduction: existingRecord?.loanDeductions || 0,
                advanceDeduction: existingRecord?.salaryAdvance || 0,
                otherDeductions: existingRecord?.otherDeductions || 0,
                settings,
                rules: allowanceRules,
                categories: payrollCategories,
                departments,
                designations,
                monthlyWorkingDays: finalWorkingDays
              });

              calculatedRecords.push({
                ...calc,
                id: existingRecord?.id || `sal-${emp.id}-${currentMonth}`
              });
            });

            // Aggregate period totals
            const totalGross = calculatedRecords.reduce((sum, r) => sum + r.grossSalary, 0);
            const totalNet = calculatedRecords.reduce((sum, r) => sum + r.netSalary, 0);
            const totalEpf8 = calculatedRecords.reduce((sum, r) => sum + r.epfEmployeeAmount, 0);
            const totalEpf12 = calculatedRecords.reduce((sum, r) => sum + r.epfEmployerAmount, 0);
            const totalEtf3 = calculatedRecords.reduce((sum, r) => sum + r.etfEmployerAmount, 0);

            const updatedPeriod: PayrollPeriod = {
              id: payrollPeriod?.id || `pp-${currentMonth}`,
              monthYear: currentMonth,
              status: 'CALCULATED',
              calculatedAt: new Date().toISOString(),
              totalEmployees: calculatedRecords.length,
              totalGross,
              totalNet,
              totalEpfEmployee: totalEpf8,
              totalEpfEmployer: totalEpf12,
              totalEtfEmployer: totalEtf3,
              isEpfPaid: payrollPeriod?.isEpfPaid || false,
              isEtfPaid: payrollPeriod?.isEtfPaid || false,
              records: calculatedRecords
            };

            onSavePayrollPeriod(updatedPeriod);
            setIsCalculating(false);
            setCalculationStep('');
          }, 300);
        }, 300);
      }, 300);
    }, 300);
  };

  const handleToggleLock = () => {
    if (!payrollPeriod) return;
    const newStatus = payrollPeriod.status === 'FINALIZED' ? 'CALCULATED' : 'FINALIZED';
    onSavePayrollPeriod({ ...payrollPeriod, status: newStatus });
  };

  const handleSaveInlineAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !payrollPeriod) return;

    // Recalculate with modified inputs
    const emp = employees.find(emp => emp.id === editingRecord.employeeId);
    if (!emp) return;

    const workingDaysConfig = DatabaseService.getMonthlyWorkingDaysConfig(currentMonth);
    const finalWorkingDays = workingDaysConfig.finalWorkingDays;
    const standardWorkingDays = finalWorkingDays;
    const adjustedWorkedDays = Math.max(0, standardWorkingDays - editingRecord.unpaidLeaveDays);

    const calc = PayrollEngine.calculateEmployeeSalary({
      employee: emp,
      workedDays: adjustedWorkedDays,
      unpaidLeaveDays: editingRecord.unpaidLeaveDays,
      otHours: editingRecord.otHours,
      lateMinutes: editingRecord.lateMinutes || 0,
      shortLeaveMinutes: editingRecord.shortLeaveMinutes || 0,
      timeLossMinutes: editingRecord.timeLossMinutes || 0,
      incentiveAmount: editingRecord.incentives,
      loanDeduction: editingRecord.loanDeductions,
      advanceDeduction: editingRecord.salaryAdvance,
      otherDeductions: editingRecord.otherDeductions,
      settings,
      rules: allowanceRules,
      monthlyWorkingDays: finalWorkingDays
    });

    const updatedRecords = payrollPeriod.records.map(r =>
      r.id === editingRecord.id ? { ...calc, id: r.id } : r
    );

    const totalGross = updatedRecords.reduce((sum, r) => sum + r.grossSalary, 0);
    const totalNet = updatedRecords.reduce((sum, r) => sum + r.netSalary, 0);
    const totalEpf8 = updatedRecords.reduce((sum, r) => sum + r.epfEmployeeAmount, 0);
    const totalEpf12 = updatedRecords.reduce((sum, r) => sum + r.epfEmployerAmount, 0);
    const totalEtf3 = updatedRecords.reduce((sum, r) => sum + r.etfEmployerAmount, 0);

    onSavePayrollPeriod({
      ...payrollPeriod,
      totalGross,
      totalNet,
      totalEpfEmployee: totalEpf8,
      totalEpfEmployer: totalEpf12,
      totalEtfEmployer: totalEtf3,
      records: updatedRecords
    });

    setEditingRecord(null);
  };

  const isLocked = payrollPeriod?.status === 'FINALIZED';

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-6 font-sans">
      {/* Top Header & Calculation Launcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {onBack && <BackButton onClick={onBack} />}
          </div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#005a9e]" />
            {t.monthlyPayroll}
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Automated Sri Lankan payroll with tiered unpaid leave allowance deduction & statutory EPF/ETF compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-[#d1d5db] px-3 py-1.5 rounded-lg text-xs shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#005a9e]" />
            <input
              type="month"
              value={currentMonth}
              onChange={e => onMonthChange(e.target.value)}
              className="bg-transparent text-[#111827] font-bold font-mono focus:outline-none"
            />
          </div>

          <button
            id="run-payroll-calc-btn"
            disabled={isCalculating || isLocked}
            onClick={handleCalculatePayroll}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#005a9e] hover:bg-[#004880] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Calculator className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
            {isCalculating ? 'Computing Payroll...' : t.calculateSalary}
          </button>

          {payrollPeriod && (
            <button
              id="lock-payroll-btn"
              onClick={handleToggleLock}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition shadow-xs cursor-pointer ${
                isLocked
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb]'
              }`}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Unlock className="w-3.5 h-3.5" />}
              {isLocked ? t.finalized : t.finalizePayroll}
            </button>
          )}
        </div>
      </div>

      {/* Calculating Progress Banner */}
      {isCalculating && (
        <div className="p-4 rounded-xl border bg-blue-50 border-blue-200 text-[#005a9e] text-xs space-y-2 animate-pulse shadow-xs">
          <div className="font-bold flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#005a9e] animate-spin" />
            Executing Sri Lankan Payroll Engine...
          </div>
          <div className="font-mono text-[11px] text-blue-700">{calculationStep}</div>
        </div>
      )}

      {/* Monthly Working Days Info Bar */}
      {(() => {
        const workingDaysCfg = DatabaseService.getMonthlyWorkingDaysConfig(currentMonth);
        return (
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-[#005a9e] rounded-lg">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#111827] flex items-center gap-2">
                  Working Days for {currentMonth}: <span className="text-sm font-mono text-[#005a9e]">{workingDaysCfg.finalWorkingDays} Days</span>
                  {workingDaysCfg.manualOverride && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-semibold">Manual Override Active</span>
                  )}
                </div>
                <div className="text-[11px] text-[#6b7280] mt-0.5">
                  Calendar Days: {workingDaysCfg.calendarDays} | Sundays: {workingDaysCfg.sundaysCount} | Poya: {workingDaysCfg.poyaCount} | Public: {workingDaysCfg.publicHolidayCount} | Mercantile: {workingDaysCfg.mercantileHolidayCount} (Formula: Total - Non-Working)
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="px-3 py-1.5 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#374151] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Configure Working Days & Holidays
            </button>
          </div>
        );
      })()}

      {/* Monthly Summary Statistics Cards */}
      {payrollPeriod && payrollPeriod.records && payrollPeriod.records.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-[#d1d5db] rounded-xl p-3.5 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-[#6b7280]">{t.totalGrossSalary}</div>
            <div className="text-base font-bold font-mono text-[#111827] mt-1">
              Rs. {(payrollPeriod.totalGross ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-[#9ca3af] mt-0.5">Earnings before deductions</div>
          </div>

          <div className="bg-white border border-[#d1d5db] rounded-xl p-3.5 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-[#6b7280]">{t.totalNetSalary}</div>
            <div className="text-base font-bold font-mono text-emerald-700 mt-1">
              Rs. {(payrollPeriod.totalNet ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Take-home Bank payout</div>
          </div>

          <div className="bg-white border border-[#d1d5db] rounded-xl p-3.5 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-[#6b7280]">{t.epfEmployee8}</div>
            <div className="text-base font-bold font-mono text-[#005a9e] mt-1">
              Rs. {(payrollPeriod.totalEpfEmployee ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-blue-600 mt-0.5">Deducted from staff</div>
          </div>

          <div className="bg-white border border-[#d1d5db] rounded-xl p-3.5 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-[#6b7280]">{t.epfEmployer12}</div>
            <div className="text-base font-bold font-mono text-indigo-700 mt-1">
              Rs. {(payrollPeriod.totalEpfEmployer ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-indigo-600 mt-0.5">Company Contribution</div>
          </div>

          <div className="bg-white border border-[#d1d5db] rounded-xl p-3.5 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-[#6b7280]">{t.etfEmployer3}</div>
            <div className="text-base font-bold font-mono text-teal-700 mt-1">
              Rs. {(payrollPeriod.totalEtfEmployer ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-teal-600 mt-0.5">ETF Board Payment</div>
          </div>

          <div className="bg-white border border-[#d1d5db] rounded-xl p-3.5 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-[#6b7280]">{t.costToCompany}</div>
            <div className="text-base font-bold font-mono text-purple-700 mt-1">
              Rs. {((payrollPeriod.totalGross ?? 0) + (payrollPeriod.totalEpfEmployer ?? 0) + (payrollPeriod.totalEtfEmployer ?? 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-purple-600 mt-0.5">Total Employer Liability</div>
          </div>
        </div>
      )}

      {/* Quick Routing Ribbon: Salary Sheet & Payslips */}
      {payrollPeriod && (
        <div className="flex items-center justify-between bg-white border border-[#d1d5db] p-3 rounded-xl shadow-xs">
          <div className="text-xs text-[#374151] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Payroll calculation verified for <strong>{payrollPeriod.records.length}</strong> employees.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('salary-sheet')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f9fafb] text-[#374151] rounded-lg text-xs font-semibold border border-[#d1d5db] transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              View Full Salary Sheet
            </button>
            <button
              onClick={() => onNavigate('payslips')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print 4-in-1 Payslips
            </button>
          </div>
        </div>
      )}

      {/* Calculated Employees Table with Allowance Deduction breakdown */}
      <div className="bg-white border border-[#d1d5db] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#f8fafc] text-[#475569] uppercase text-[10px] font-semibold tracking-wider border-b border-[#e2e8f0]">
              <tr>
                <th className="py-3 px-3">Emp Code & Name</th>
                <th className="py-3 px-3 text-right">Basic</th>
                <th className="py-3 px-3 text-center text-red-600">No-Pay Days</th>
                <th className="py-3 px-3 text-right text-red-600">Basic Deduct</th>
                <th className="py-3 px-3 text-right">Allowances</th>
                <th className="py-3 px-3 text-right text-red-600">Allowance Deduct</th>
                <th className="py-3 px-3 text-right text-amber-700">OT Pay</th>
                <th className="py-3 px-3 text-right">Gross Salary</th>
                <th className="py-3 px-3 text-right text-[#005a9e]">EPF (8%)</th>
                <th className="py-3 px-3 text-right text-red-600">Loans/Adv</th>
                <th className="py-3 px-3 text-right font-bold text-emerald-700">Net Salary</th>
                <th className="py-3 px-3 text-center">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] font-mono">
              {!payrollPeriod || payrollPeriod.records.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-[#9ca3af] text-xs font-sans">
                    No payroll calculated yet for {currentMonth}. Click "Calculate Salary" above to execute calculation.
                  </td>
                </tr>
              ) : (
                payrollPeriod.records.map(rec => (
                  <tr key={rec.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-[#111827]">
                        <span className="font-mono text-[#005a9e] mr-1.5">{rec.employeeCode}</span>
                        {rec.employeeName}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#374151]">
                      {(rec.basicSalary ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {(rec.unpaidLeaveDays ?? 0) > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold text-[10px]">
                          {rec.unpaidLeaveDays} d
                        </span>
                      ) : (
                        <span className="text-[#9ca3af]">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-red-600">
                      {(rec.noPayBasicDeduction ?? 0) > 0 ? `-${(rec.noPayBasicDeduction ?? 0).toLocaleString()}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#374151]">
                      {(rec.totalAllowances ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-red-600">
                      {(rec.noPayAllowanceDeduction ?? 0) > 0 ? (
                        <span title={rec.allowanceCalculationBreakdown}>
                          -{(rec.noPayAllowanceDeduction ?? 0).toLocaleString()}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-700 font-semibold">
                      {(rec.otAmount ?? 0) > 0 ? `+${(rec.otAmount ?? 0).toLocaleString()}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#111827] font-bold">
                      {(rec.grossSalary ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#005a9e]">
                      -{(rec.epfEmployeeAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-red-600">
                      {((rec.loanDeductions ?? 0) + (rec.salaryAdvance ?? 0) + (rec.otherDeductions ?? 0) + (rec.shortLeaveDeduction ?? 0)) > 0 ? (
                        <span title={`Loan: ${(rec.loanDeductions ?? 0).toLocaleString()} | Advance: ${(rec.salaryAdvance ?? 0).toLocaleString()} | Short Leave: ${(rec.shortLeaveDeduction ?? 0).toLocaleString()} | Other: ${(rec.otherDeductions ?? 0).toLocaleString()}`}>
                          -{( (rec.loanDeductions ?? 0) + (rec.salaryAdvance ?? 0) + (rec.otherDeductions ?? 0) + (rec.shortLeaveDeduction ?? 0) ).toLocaleString()}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 bg-emerald-50/50">
                      Rs. {(rec.netSalary ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        disabled={isLocked}
                        onClick={() => setEditingRecord({ ...rec })}
                        className="px-2 py-1 bg-white hover:bg-[#f9fafb] border border-[#d1d5db] disabled:opacity-50 text-[#374151] rounded text-[11px] font-sans shadow-xs cursor-pointer"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline Salary Adjustments Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#d1d5db] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden font-sans">
            <div className="px-6 py-4 bg-[#f9fafb] border-b border-[#e5e7eb] flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#005a9e]" />
                Adjust Salary Components: {editingRecord.employeeName}
              </h2>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-[#9ca3af] hover:text-[#111827] font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInlineAdjustment} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#f9fafb] p-3 rounded-lg border border-[#e5e7eb]">
                <div>
                  <span className="text-[#6b7280] text-[10px] font-bold uppercase">BASIC SALARY</span>
                  <div className="font-mono font-bold text-[#111827]">Rs. {(editingRecord.basicSalary ?? 0).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-[#6b7280] text-[10px] font-bold uppercase">UNPAID LEAVE DAYS</span>
                  <input
                    type="number"
                    min="0"
                    max="31"
                    value={editingRecord.unpaidLeaveDays}
                    onChange={e => setEditingRecord({ ...editingRecord, unpaidLeaveDays: Number(e.target.value) })}
                    className="w-full bg-white border border-[#d1d5db] rounded px-2 py-1 text-[#111827] font-mono text-xs focus:outline-none focus:border-[#005a9e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.incentives} / Bonus</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[#9ca3af]">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      value={editingRecord.incentives || 0}
                      onChange={e => setEditingRecord({ ...editingRecord, incentives: Number(e.target.value) })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg pl-8 pr-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.salaryAdvance}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[#9ca3af]">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      value={editingRecord.salaryAdvance || 0}
                      onChange={e => setEditingRecord({ ...editingRecord, salaryAdvance: Number(e.target.value) })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg pl-8 pr-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.loanDeduction}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[#9ca3af]">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      value={editingRecord.loanDeductions || 0}
                      onChange={e => setEditingRecord({ ...editingRecord, loanDeductions: Number(e.target.value) })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg pl-8 pr-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.otherDeductions}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[#9ca3af]">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      value={editingRecord.otherDeductions || 0}
                      onChange={e => setEditingRecord({ ...editingRecord, otherDeductions: Number(e.target.value) })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg pl-8 pr-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e5e7eb] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-white hover:bg-[#f9fafb] border border-[#d1d5db] text-[#374151] rounded-lg font-semibold shadow-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg font-semibold shadow-xs"
                >
                  Recalculate & Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
