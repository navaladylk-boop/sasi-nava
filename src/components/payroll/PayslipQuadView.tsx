import React, { useState } from 'react';
import {
  Printer,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  User,
  ShieldAlert,
  Layers
} from 'lucide-react';
import {
  PayrollPeriod,
  CompanySettings,
  Language,
  Employee,
  CalculatedSalaryRecord
} from '../../types';
import { translations } from '../../i18n/translations';

interface PayslipQuadViewProps {
  language: Language;
  currentMonth: string;
  payrollPeriod?: PayrollPeriod;
  settings: CompanySettings;
  employees: Employee[];
}

export const PayslipQuadView: React.FC<PayslipQuadViewProps> = ({
  language,
  currentMonth,
  payrollPeriod,
  settings,
  employees
}) => {
  const t = translations[language];

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('ALL');
  const [showSinhala, setShowSinhala] = useState<boolean>(true);
  const [showTamil, setShowTamil] = useState<boolean>(true);

  const records = payrollPeriod?.records || [];

  // Filter records if specific employee selected
  const displayedRecords =
    selectedEmpId === 'ALL'
      ? records
      : records.filter(r => r.employeeId === selectedEmpId);

  // Chunk displayed records into groups of 4 (4-per-A4 page)
  const pageSize = 4;
  const totalPages = Math.ceil(displayedRecords.length / pageSize) || 1;
  const pageRecords = displayedRecords.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  const handlePrint = () => {
    window.print();
  };

  const getEmpData = (empId: string) => {
    return employees.find(e => e.id === empId);
  };

  const renderSinglePayslipCard = (record: CalculatedSalaryRecord, index: number) => {
    const emp = getEmpData(record.employeeId);

    return (
      <div
        key={record.id}
        className="payslip-item bg-white text-slate-900 border-2 border-slate-300 rounded-lg p-3.5 flex flex-col justify-between shadow-sm text-[11px] font-sans relative overflow-hidden h-[380px] print:h-auto print:border-black"
      >
        {/* Top Header */}
        <div>
          <div className="flex items-start justify-between border-b border-slate-300 pb-1.5 mb-1.5">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-tight text-slate-900 leading-none">
                {settings.companyName}
              </h3>
              <p className="text-[9px] text-slate-600 mt-0.5">
                EPF Reg No: <span className="font-mono font-bold text-slate-800">{settings.epfRegistrationNumber}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider print:bg-black">
                PAYSLIP
              </span>
              <div className="text-[10px] font-bold font-mono text-slate-700 mt-0.5">
                {currentMonth}
              </div>
            </div>
          </div>

          {/* Employee Information Strip */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 bg-slate-100/90 p-1.5 rounded border border-slate-200 text-[10px] mb-2 print:bg-gray-100">
            <div>
              <span className="text-slate-500 text-[9px]">EMP: </span>
              <span className="font-mono font-bold text-blue-700">{record.employeeCode}</span> -{' '}
              <span className="font-bold text-slate-900">{record.employeeName}</span>
              {showSinhala && emp?.nameSinhala && (
                <div className="text-[9px] text-slate-600 font-medium">{emp.nameSinhala}</div>
              )}
              {showTamil && emp?.nameTamil && (
                <div className="text-[9px] text-slate-600">{emp.nameTamil}</div>
              )}
            </div>

            <div className="text-right">
              <div>
                <span className="text-slate-500 text-[9px]">EPF NO: </span>
                <span className="font-mono font-bold text-emerald-700">{record.epfNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[9px]">NIC: </span>
                <span className="font-mono text-slate-700">{emp?.nic || '-'}</span>
              </div>
              <div className="truncate text-slate-600 text-[9px]">
                {record.departmentName} • {record.designationTitle}
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Two-Column Grid */}
          <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded p-1.5 mb-1.5 text-[10px]">
            {/* Earnings Column */}
            <div className="space-y-0.5 border-r border-slate-200 pr-2">
              <div className="font-bold uppercase text-[9px] text-slate-600 border-b border-slate-200 pb-0.5">
                Earnings (Rs.)
              </div>
              <div className="flex justify-between">
                <span>Basic Salary:</span>
                <span className="font-mono font-semibold">{(record.basicSalary ?? 0).toLocaleString()}</span>
              </div>
              {(record.noPayBasicDeduction ?? 0) > 0 && (
                <div className="flex justify-between text-rose-600 text-[9px]">
                  <span>Less No-Pay ({record.unpaidLeaveDays || 0}d):</span>
                  <span className="font-mono">-{(record.noPayBasicDeduction ?? 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Fixed Allowance:</span>
                <span className="font-mono">{(record.totalAllowances ?? 0).toLocaleString()}</span>
              </div>
              {(record.noPayAllowanceDeduction ?? 0) > 0 && (
                <div className="flex justify-between text-rose-600 text-[9px]">
                  <span>Less Allow. Deduct:</span>
                  <span className="font-mono">-{(record.noPayAllowanceDeduction ?? 0).toLocaleString()}</span>
                </div>
              )}
              {(record.otAmount ?? 0) > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>OT ({record.otHours || 0} hrs):</span>
                  <span className="font-mono font-semibold">+{(record.otAmount ?? 0).toLocaleString()}</span>
                </div>
              )}
              {(record.incentives ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Incentives:</span>
                  <span className="font-mono">+{(record.incentives ?? 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-slate-300 pt-0.5 text-slate-900 mt-1">
                <span>Gross Salary:</span>
                <span className="font-mono">Rs. {(record.grossSalary ?? 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="space-y-0.5">
              <div className="font-bold uppercase text-[9px] text-slate-600 border-b border-slate-200 pb-0.5">
                Deductions (Rs.)
              </div>
              <div className="flex justify-between text-blue-800">
                <span>EPF (8%):</span>
                <span className="font-mono font-semibold">-{(record.epfEmployeeAmount ?? 0).toLocaleString()}</span>
              </div>
              {(record.salaryAdvance ?? 0) > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>Salary Advance:</span>
                  <span className="font-mono">-{(record.salaryAdvance ?? 0).toLocaleString()}</span>
                </div>
              )}
              {(record.loanDeductions ?? 0) > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>Loan Recovery:</span>
                  <span className="font-mono">-{(record.loanDeductions ?? 0).toLocaleString()}</span>
                </div>
              )}
              {(record.otherDeductions ?? 0) > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>Other Deductions:</span>
                  <span className="font-mono">-{(record.otherDeductions ?? 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-slate-300 pt-0.5 text-rose-800 mt-1">
                <span>Total Deductions:</span>
                <span className="font-mono">-Rs. {(record.totalDeductions ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Statutory Contributions, Net Pay & Signature Section */}
        <div>
          {/* Net Salary Highlight Box */}
          <div className="bg-slate-900 text-white p-1.5 rounded flex justify-between items-center mb-1.5 print:bg-black">
            <span className="font-bold uppercase tracking-wider text-[10px]">NET SALARY (PAYABLE):</span>
            <span className="font-mono font-bold text-sm text-emerald-300 print:text-white">
              Rs. {(record.netSalary ?? 0).toLocaleString()}
            </span>
          </div>

          {/* Employer Statutory Contribution Strip */}
          <div className="flex justify-between text-[9px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono mb-2">
            <span>Employer EPF (12%): <strong>Rs. {(record.epfEmployerAmount ?? 0).toLocaleString()}</strong></span>
            <span>Employer ETF (3%): <strong>Rs. {(record.etfEmployerAmount ?? 0).toLocaleString()}</strong></span>
          </div>

          {/* Signature Lines */}
          <div className="grid grid-cols-2 gap-4 text-center text-[9px] pt-2 border-t border-dotted border-slate-400">
            <div>
              <div className="border-b border-slate-400 w-4/5 mx-auto mb-0.5"></div>
              <span className="text-slate-600">Employee Signature</span>
            </div>
            <div>
              <div className="border-b border-slate-400 w-4/5 mx-auto mb-0.5"></div>
              <span className="text-slate-600">Authorized Signature</span>
            </div>
          </div>

          <div className="text-[8px] text-slate-400 text-center mt-1">
            * This is a computer generated confidential Sri Lankan payslip.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-950 text-slate-100 space-y-5">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-violet-400" />
            {t.payslips} - <span className="font-mono text-violet-300">4-in-1 A4 Layout</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Specifically formatted to print 4 equal payslip quadrants per standard A4 portrait sheet with Sri Lankan EPF/ETF and multilingual names.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Multilingual Name Toggles */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
            <label className="flex items-center gap-1 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showSinhala}
                onChange={e => setShowSinhala(e.target.checked)}
                className="rounded"
              />
              <span>සිංහල</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer text-slate-300 ml-2">
              <input
                type="checkbox"
                checked={showTamil}
                onChange={e => setShowTamil(e.target.checked)}
                className="rounded"
              />
              <span>தமிழ்</span>
            </label>
          </div>

          <button
            id="print-all-payslips-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-violet-900/40 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            {t.print4OnA4}
          </button>
        </div>
      </div>

      {/* Page Navigation & Filter Bar (No Print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 no-print text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedEmpId}
            onChange={e => {
              setSelectedEmpId(e.target.value);
              setCurrentPage(0);
            }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="ALL">All Employees (4 per A4 page)</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>
                {e.employeeCode} - {e.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center gap-3">
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded border border-slate-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-slate-300 font-mono">
            Sheet <strong>{currentPage + 1}</strong> of <strong>{totalPages}</strong> ({displayedRecords.length} payslips)
          </span>
          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded border border-slate-700 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Screen Preview Container: Styled like a real A4 Paper in 2x2 grid */}
      <div className="no-print flex justify-center py-4">
        <div className="w-full max-w-4xl bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="text-center text-xs font-semibold text-slate-400 mb-3 flex items-center justify-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <span>Interactive 4-Quadrant A4 Sheet Preview (Page {currentPage + 1} of {totalPages})</span>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No calculated payroll records found for {currentMonth}. Go to "Payroll" screen and click "Calculate Salary" first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pageRecords.map((rec, idx) => renderSinglePayslipCard(rec, idx))}
              {/* If fewer than 4 on the page, fill blank quadrant to visualize A4 grid */}
              {Array.from({ length: Math.max(0, 4 - pageRecords.length) }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="border-2 border-dashed border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center text-slate-600 text-xs"
                >
                  <span>[Blank Quadrant Slot]</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Printable All Pages (Only visible to window.print) */}
      <div className="hidden print-only">
        {Array.from({ length: totalPages }).map((_, pageIdx) => {
          const pageItems = displayedRecords.slice(pageIdx * 4, (pageIdx + 1) * 4);
          return (
            <div
              key={`print-page-${pageIdx}`}
              className="payslip-sheet-a4 a4-grid-2x2 page-break"
            >
              {pageItems.map((rec, idx) => renderSinglePayslipCard(rec, idx))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
