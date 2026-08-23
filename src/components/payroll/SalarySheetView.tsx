import React from 'react';
import {
  TableProperties,
  Printer,
  FileSpreadsheet,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';
import { PayrollPeriod, CompanySettings, Language } from '../../types';
import { translations } from '../../i18n/translations';

interface SalarySheetViewProps {
  language: Language;
  currentMonth: string;
  payrollPeriod?: PayrollPeriod;
  settings: CompanySettings;
}

export const SalarySheetView: React.FC<SalarySheetViewProps> = ({
  language,
  currentMonth,
  payrollPeriod,
  settings
}) => {
  const t = translations[language];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!payrollPeriod || payrollPeriod.records.length === 0) return;

    const headers = [
      'Emp Code',
      'Employee Name',
      'EPF No',
      'Department',
      'Basic Salary',
      'No-Pay Basic Deduct',
      'Net Basic',
      'Total Allowances',
      'No-Pay Allow Deduct',
      'Net Allowances',
      'OT Hours',
      'OT Amount',
      'Incentives',
      'Gross Salary',
      'EPF Employee (8%)',
      'Salary Advance',
      'Loan Deductions',
      'Other Deductions',
      'Total Deductions',
      'Net Salary',
      'EPF Employer (12%)',
      'ETF Employer (3%)',
      'Cost to Company'
    ];

    const rows = payrollPeriod.records.map(r => [
      r.employeeCode,
      `"${r.employeeName}"`,
      r.epfNumber,
      `"${r.departmentName}"`,
      r.basicSalary,
      r.noPayBasicDeduction,
      r.netBasicSalary,
      r.totalAllowances,
      r.noPayAllowanceDeduction,
      r.netAllowances,
      r.otHours,
      r.otAmount,
      r.incentives,
      r.grossSalary,
      r.epfEmployeeAmount,
      r.salaryAdvance,
      r.loanDeductions,
      r.otherDeductions,
      r.totalDeductions,
      r.netSalary,
      r.epfEmployerAmount,
      r.etfEmployerAmount,
      r.costToCompany
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Salary_Sheet_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const records = payrollPeriod?.records || [];

  // Totals calculations
  const totalBasic = records.reduce((s, r) => s + (r.basicSalary || 0), 0);
  const totalNoPayBasic = records.reduce((s, r) => s + (r.noPayBasicDeduction || 0), 0);
  const totalNetBasic = records.reduce((s, r) => s + (r.netBasicSalary || 0), 0);
  const totalAllow = records.reduce((s, r) => s + (r.totalAllowances || 0), 0);
  const totalNoPayAllow = records.reduce((s, r) => s + (r.noPayAllowanceDeduction || 0), 0);
  const totalNetAllow = records.reduce((s, r) => s + (r.netAllowances || 0), 0);
  const totalOtHours = records.reduce((s, r) => s + (r.otHours || 0), 0);
  const totalOtAmount = records.reduce((s, r) => s + (r.otAmount || 0), 0);
  const totalIncentives = records.reduce((s, r) => s + (r.incentives || 0), 0);
  const totalGross = records.reduce((s, r) => s + (r.grossSalary || 0), 0);
  const totalEpf8 = records.reduce((s, r) => s + (r.epfEmployeeAmount || 0), 0);
  const totalAdvances = records.reduce((s, r) => s + (r.salaryAdvance || 0), 0);
  const totalLoans = records.reduce((s, r) => s + (r.loanDeductions || 0), 0);
  const totalOther = records.reduce((s, r) => s + (r.otherDeductions || 0), 0);
  const totalDeducts = records.reduce((s, r) => s + (r.totalDeductions || 0), 0);
  const totalNet = records.reduce((s, r) => s + (r.netSalary || 0), 0);
  const totalEpf12 = records.reduce((s, r) => s + (r.epfEmployerAmount || 0), 0);
  const totalEtf3 = records.reduce((s, r) => s + (r.etfEmployerAmount || 0), 0);
  const totalCost = records.reduce((s, r) => s + (r.costToCompany || 0), 0);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-950 text-slate-100 space-y-5">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <TableProperties className="w-5 h-5 text-teal-400" />
            {t.salarySheet} - <span className="font-mono text-teal-300">{currentMonth}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete Sri Lankan statutory salary master sheet with EPF (8%/12%), ETF (3%), and No-Pay allowance deductions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="print-salary-sheet-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            {t.printSalarySheet}
          </button>

          <button
            id="export-sheet-excel-btn"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-teal-900/40 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {t.exportExcel} (CSV)
          </button>
        </div>
      </div>

      {/* Printable Sheet Company Header */}
      <div className="hidden print-only mb-4 text-black font-sans">
        <div className="text-center border-b-2 border-black pb-2 mb-3">
          <h2 className="text-xl font-bold uppercase">{settings.companyName}</h2>
          <p className="text-xs text-gray-700">{settings.address} | Tel: {settings.telephone}</p>
          <p className="text-xs font-bold mt-1">
            MASTER SALARY SHEET - PAYROLL MONTH: {currentMonth} (EPF REG NO: {settings.epfRegistrationNumber})
          </p>
        </div>
      </div>

      {/* Full Width Master Sheet Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead className="sticky top-0 bg-slate-950 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 select-none">
              <tr>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800">Emp Code</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 min-w-[140px]">Employee Name</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800">EPF No</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-right">Basic</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-right text-rose-400">No-Pay Basic</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-right">Net Basic</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-right">Allowances</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-right text-rose-400">No-Pay Allow</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-right">Net Allow</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-center text-amber-300">OT (Hrs)</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-right text-amber-300">OT Amount</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-right text-emerald-300">Incentives</th>
                <th className="py-2.5 px-2 bg-slate-900 border-r border-slate-800 text-right font-bold text-white">Gross</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-right text-blue-400">EPF (8%)</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-right text-rose-400">Advances</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-right text-rose-400">Loans</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-right text-rose-400">Total Deduct</th>
                <th className="py-2.5 px-2 bg-emerald-950/80 border-r border-slate-800 text-right font-bold text-emerald-300">Net Payable</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-right text-indigo-400">EPF (12%)</th>
                <th className="py-2.5 px-2 bg-slate-950 border-r border-slate-800 text-right text-cyan-400">ETF (3%)</th>
                <th className="py-2.5 px-2 bg-slate-950 text-right text-violet-300">Cost to Co.</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={21} className="text-center py-10 text-slate-500 font-sans">
                    No payroll data available for {currentMonth}. Go to "Payroll" screen and click "Calculate Salary".
                  </td>
                </tr>
              ) : (
                records.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2 px-2 font-bold text-blue-400 border-r border-slate-800/60">{r.employeeCode}</td>
                    <td className="py-2 px-2 font-sans font-medium text-slate-100 border-r border-slate-800/60">{r.employeeName}</td>
                    <td className="py-2 px-2 text-emerald-400 border-r border-slate-800/60">{r.epfNumber}</td>
                    <td className="py-2 px-2 text-right text-slate-200 border-r border-slate-800/60">{(r.basicSalary ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-rose-400 border-r border-slate-800/60">{(r.noPayBasicDeduction ?? 0) > 0 ? `-${(r.noPayBasicDeduction ?? 0).toLocaleString()}` : '-'}</td>
                    <td className="py-2 px-2 text-right text-slate-100 font-semibold border-r border-slate-800/60">{(r.netBasicSalary ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-slate-300 border-r border-slate-800/60">{(r.totalAllowances ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-rose-400 border-r border-slate-800/60">{(r.noPayAllowanceDeduction ?? 0) > 0 ? `-${(r.noPayAllowanceDeduction ?? 0).toLocaleString()}` : '-'}</td>
                    <td className="py-2 px-2 text-right text-slate-200 border-r border-slate-800/60">{(r.netAllowances ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-2 text-center text-amber-300 border-r border-slate-800/60">{(r.otHours ?? 0) > 0 ? `${r.otHours}h` : '-'}</td>
                    <td className="py-2 px-2 text-right text-amber-300 border-r border-slate-800/60">{(r.otAmount ?? 0) > 0 ? (r.otAmount ?? 0).toLocaleString() : '-'}</td>
                    <td className="py-2 px-2 text-right text-emerald-300 border-r border-slate-800/60">{(r.incentives ?? 0) > 0 ? (r.incentives ?? 0).toLocaleString() : '-'}</td>
                    <td className="py-2 px-2 text-right font-bold text-white bg-slate-800/40 border-r border-slate-800/60">{(r.grossSalary ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-blue-400 border-r border-slate-800/60">-{(r.epfEmployeeAmount ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-rose-400 border-r border-slate-800/60">{(r.salaryAdvance ?? 0) > 0 ? `-${(r.salaryAdvance ?? 0).toLocaleString()}` : '-'}</td>
                    <td className="py-2 px-2 text-right text-rose-400 border-r border-slate-800/60">{(r.loanDeductions ?? 0) > 0 ? `-${(r.loanDeductions ?? 0).toLocaleString()}` : '-'}</td>
                    <td className="py-2 px-2 text-right text-rose-300 font-semibold border-r border-slate-800/60">-{(r.totalDeductions ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right font-bold text-emerald-400 bg-emerald-950/40 border-r border-slate-800/60">Rs. {(r.netSalary ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-indigo-400 border-r border-slate-800/60">{(r.epfEmployerAmount ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-cyan-400 border-r border-slate-800/60">{(r.etfEmployerAmount ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-violet-300 font-semibold">{(r.costToCompany ?? 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Totals Summary Footer */}
            {records.length > 0 && (
              <tfoot className="bg-slate-950 font-mono font-bold text-xs border-t-2 border-slate-700 text-white select-none">
                <tr>
                  <td colSpan={3} className="py-3 px-2 text-right uppercase font-sans text-slate-300 border-r border-slate-800">
                    Grand Total ({records.length} Staff):
                  </td>
                  <td className="py-3 px-2 text-right border-r border-slate-800">{(totalBasic ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-rose-400 border-r border-slate-800">-{(totalNoPayBasic ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right border-r border-slate-800">{(totalNetBasic ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right border-r border-slate-800">{(totalAllow ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-rose-400 border-r border-slate-800">-{(totalNoPayAllow ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right border-r border-slate-800">{(totalNetAllow ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-center text-amber-300 border-r border-slate-800">{totalOtHours || 0}h</td>
                  <td className="py-3 px-2 text-right text-amber-300 border-r border-slate-800">{(totalOtAmount ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-emerald-300 border-r border-slate-800">{(totalIncentives ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-white bg-slate-900 border-r border-slate-800">{(totalGross ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-blue-400 border-r border-slate-800">-{(totalEpf8 ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-rose-400 border-r border-slate-800">-{(totalAdvances ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-rose-400 border-r border-slate-800">-{(totalLoans ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-rose-300 border-r border-slate-800">-{(totalDeducts ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-emerald-400 bg-emerald-950/80 border-r border-slate-800">
                    Rs. {(totalNet ?? 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right text-indigo-400 border-r border-slate-800">{(totalEpf12 ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-cyan-400 border-r border-slate-800">{(totalEtf3 ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-violet-300">{(totalCost ?? 0).toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Signature Section for Printed Physical Paper */}
      <div className="hidden print-only mt-12 text-black text-xs">
        <div className="grid grid-cols-3 gap-8 text-center pt-8 border-t border-gray-400">
          <div>
            <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
            <p className="font-bold">Prepared By (HR Officer)</p>
          </div>
          <div>
            <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
            <p className="font-bold">Checked By (Accountant)</p>
          </div>
          <div>
            <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
            <p className="font-bold">Approved By (Managing Director)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
