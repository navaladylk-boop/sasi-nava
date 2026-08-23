import React, { useState, useEffect } from 'react';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckSquare,
  Square,
  Layers,
  CheckCircle2
} from 'lucide-react';
import {
  PayrollPeriod,
  CompanySettings,
  Language,
  Employee,
  CalculatedSalaryRecord
} from '../../types';
import { BackButton } from '../common/NavigationButtons';
import { translations } from '../../i18n/translations';

interface PayslipQuadViewProps {
  language: Language;
  currentMonth: string;
  payrollPeriod?: PayrollPeriod;
  settings: CompanySettings;
  employees: Employee[];
  onBack?: () => void;
}

export const PayslipQuadView: React.FC<PayslipQuadViewProps> = ({
  language,
  currentMonth,
  payrollPeriod,
  settings,
  employees,
  onBack
}) => {
  const t = translations[language];

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [showSinhala, setShowSinhala] = useState<boolean>(true);
  const [showTamil, setShowTamil] = useState<boolean>(true);

  const records = payrollPeriod?.records || [];

  // Automatically select all employees when records load or change
  useEffect(() => {
    if (records.length > 0) {
      setSelectedEmpIds(records.map(r => r.employeeId));
    }
  }, [payrollPeriod]);

  const handleSelectAll = () => {
    setSelectedEmpIds(records.map(r => r.employeeId));
  };

  const handleClearSelection = () => {
    setSelectedEmpIds([]);
  };

  const toggleSelectEmployee = (empId: string) => {
    if (selectedEmpIds.includes(empId)) {
      setSelectedEmpIds(selectedEmpIds.filter(id => id !== empId));
    } else {
      setSelectedEmpIds([...selectedEmpIds, empId]);
    }
  };

  // Filter records based on selected employees
  const displayedRecords = records.filter(r => selectedEmpIds.includes(r.employeeId));

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
        className="single-payslip-quad payslip-item bg-white text-slate-900 border-2 border-slate-300 rounded-lg p-3.5 flex flex-col justify-between shadow-xs text-[11px] font-sans relative overflow-hidden h-[380px] print:h-auto print:border-black"
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
              <div className="flex justify-between text-slate-500 text-[9px]">
                <span>Original Basic:</span>
                <span className="font-mono">{(record.basicSalary ?? 0).toLocaleString()}</span>
              </div>
              {(record.noPayBasicDeduction ?? 0) > 0 && (
                <div className="flex justify-between text-rose-600 text-[9px]">
                  <span>Less No-Pay ({record.unpaidLeaveDays || 0}d):</span>
                  <span className="font-mono">-{(record.noPayBasicDeduction ?? 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 bg-slate-50 px-1 py-0.5 rounded border border-slate-200 text-[10px]">
                <span>Earned Basic:</span>
                <span className="font-mono font-bold text-blue-900">
                  Rs. {(record.netBasicSalary ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[10px] pt-0.5">
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
                <div className="flex justify-between text-amber-700 text-[10px]">
                  <span>OT ({record.otHours || 0} hrs):</span>
                  <span className="font-mono font-semibold">+{(record.otAmount ?? 0).toLocaleString()}</span>
                </div>
              )}
              {(record.incentives ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-700 text-[10px]">
                  <span>Incentives:</span>
                  <span className="font-mono">+{(record.incentives ?? 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-slate-300 pt-0.5 text-slate-900 mt-1 text-[10px]">
                <span>Gross Earnings:</span>
                <span className="font-mono">Rs. {(record.grossSalary ?? 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="space-y-0.5">
              <div className="font-bold uppercase text-[9px] text-slate-600 border-b border-slate-200 pb-0.5">
                Deductions (Rs.)
              </div>
              <div className="flex justify-between text-blue-800 text-[10px]">
                <span>EPF (8%):</span>
                <span className="font-mono font-semibold">-{(record.epfEmployeeAmount ?? 0).toLocaleString()}</span>
              </div>
              {(record.salaryAdvance ?? 0) > 0 && (
                <div className="flex justify-between text-rose-700 text-[10px]">
                  <span>Salary Advance:</span>
                  <span className="font-mono">-{(record.salaryAdvance ?? 0).toLocaleString()}</span>
                </div>
              )}
              {(record.loanDeductions ?? 0) > 0 && (
                <div className="flex justify-between text-rose-700 text-[10px]">
                  <span>Loan Recovery:</span>
                  <span className="font-mono">-{(record.loanDeductions ?? 0).toLocaleString()}</span>
                </div>
              )}
              {(record.shortLeaveDeduction ?? 0) > 0 && (
                <div className="flex justify-between text-rose-700 text-[10px]">
                  <span>Short Leave/Time Loss:</span>
                  <span className="font-mono">-{(record.shortLeaveDeduction ?? 0).toLocaleString()}</span>
                </div>
              )}
              {(record.otherDeductions ?? 0) > 0 && (
                <div className="flex justify-between text-rose-700 text-[10px]">
                  <span>Other Deductions:</span>
                  <span className="font-mono">-{(record.otherDeductions ?? 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-slate-300 pt-0.5 text-rose-800 mt-1 text-[10px]">
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
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-6 font-sans">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {onBack && <BackButton onClick={onBack} />}
          </div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#005a9e]" />
            {t.payslips} - <span className="font-mono text-[#005a9e]">4-in-1 A4 Layout</span>
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Specifically formatted to print 4 equal payslip quadrants per standard A4 portrait sheet with Sri Lankan EPF/ETF and multilingual names.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Multilingual Name Toggles */}
          <div className="flex items-center gap-2 bg-white border border-[#d1d5db] px-3 py-1.5 rounded-lg text-xs shadow-xs">
            <label className="flex items-center gap-1 cursor-pointer text-[#374151]">
              <input
                type="checkbox"
                checked={showSinhala}
                onChange={e => setShowSinhala(e.target.checked)}
                className="rounded"
              />
              <span>සිංහල</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer text-[#374151] ml-2">
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
            disabled={selectedEmpIds.length === 0}
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#005a9e] hover:bg-[#004880] disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            {t.print4OnA4} ({selectedEmpIds.length})
          </button>
        </div>
      </div>

      {/* Selected Employee Checklist & Action Controls */}
      <div className="bg-white border border-[#d1d5db] rounded-xl p-4 space-y-3 no-print shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#005a9e]" />
            <span className="font-bold text-xs text-[#111827]">
              Select Employees for Printing ({selectedEmpIds.length} of {records.length} selected)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 bg-[#f0f9ff] hover:bg-blue-100 text-[#005a9e] border border-blue-200 rounded text-xs font-semibold cursor-pointer transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleClearSelection}
              className="px-3 py-1 bg-white hover:bg-gray-100 text-[#4b5563] border border-[#d1d5db] rounded text-xs font-semibold cursor-pointer transition-colors"
            >
              Clear Selection
            </button>
            <button
              id="print-selected-payslips-btn"
              disabled={selectedEmpIds.length === 0}
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#005a9e] hover:bg-[#004880] disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Selected Payslips ({selectedEmpIds.length})
            </button>
          </div>
        </div>

        {/* Checkbox Matrix for Individual Employee Selection */}
        {records.length === 0 ? (
          <div className="text-xs text-[#9ca3af] py-2">
            No calculated employees available for {currentMonth}. Go to "Payroll" screen and click "Calculate Salary".
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
            {records.map(r => {
              const isSelected = selectedEmpIds.includes(r.employeeId);
              return (
                <label
                  key={r.employeeId}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors select-none ${
                    isSelected
                      ? 'bg-blue-50/80 border-[#005a9e] text-[#005a9e] font-semibold'
                      : 'bg-white border-[#d1d5db] text-[#4b5563] hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectEmployee(r.employeeId)}
                    className="rounded text-[#005a9e] focus:ring-[#005a9e]"
                  />
                  <span className="font-mono text-[11px] font-bold">{r.employeeCode}</span>
                  <span className="truncate">{r.employeeName}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Page Navigation Switcher (No Print) */}
      <div className="bg-white border border-[#d1d5db] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 no-print text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-[#374151]">
            Showing <strong>{displayedRecords.length}</strong> selected payslips in 4-per-A4 grid format
          </span>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center gap-3">
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            className="p-1.5 bg-white hover:bg-[#f9fafb] disabled:opacity-40 text-[#374151] rounded border border-[#d1d5db] transition-colors shadow-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[#374151] font-mono">
            Sheet <strong>{currentPage + 1}</strong> of <strong>{totalPages}</strong> ({displayedRecords.length} payslips)
          </span>
          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            className="p-1.5 bg-white hover:bg-[#f9fafb] disabled:opacity-40 text-[#374151] rounded border border-[#d1d5db] transition-colors shadow-xs cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Screen Preview Container: Styled like a real A4 Paper in 2x2 grid */}
      <div className="no-print flex justify-center py-2">
        <div className="w-full max-w-4xl bg-white border border-[#d1d5db] rounded-2xl p-6 shadow-md">
          <div className="text-center text-xs font-semibold text-[#6b7280] mb-3 flex items-center justify-center gap-2">
            <Layers className="w-4 h-4 text-[#005a9e]" />
            <span>Interactive 4-Quadrant A4 Sheet Preview (Page {currentPage + 1} of {totalPages})</span>
          </div>

          {displayedRecords.length === 0 ? (
            <div className="text-center py-16 text-[#9ca3af] text-xs">
              No employees selected for print preview. Please select at least one employee from the list above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pageRecords.map((rec, idx) => renderSinglePayslipCard(rec, idx))}
              {/* If fewer than 4 on the page, fill blank quadrant to visualize A4 grid */}
              {Array.from({ length: Math.max(0, 4 - pageRecords.length) }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="border-2 border-dashed border-[#e5e7eb] rounded-lg p-6 flex flex-col items-center justify-center text-[#9ca3af] text-xs"
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
          if (pageItems.length === 0) return null;
          return (
            <div
              key={`print-page-${pageIdx}`}
              className="a4-quad-sheet page-break"
            >
              {pageItems.map((rec, idx) => renderSinglePayslipCard(rec, idx))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
