import React, { useState } from 'react';
import {
  Landmark,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CreditCard,
  Printer,
  ShieldCheck,
  Building2,
  FileCheck2,
  Clock
} from 'lucide-react';
import {
  PayrollPeriod,
  CompanySettings,
  Language,
  Employee
} from '../../types';
import { translations } from '../../i18n/translations';

interface EpfEtfManagementViewProps {
  language: Language;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  payrollPeriod?: PayrollPeriod;
  settings: CompanySettings;
  employees: Employee[];
  onSavePayrollPeriod: (period: PayrollPeriod) => void;
}

export const EpfEtfManagementView: React.FC<EpfEtfManagementViewProps> = ({
  language,
  currentMonth,
  onMonthChange,
  payrollPeriod,
  settings,
  employees,
  onSavePayrollPeriod
}) => {
  const t = translations[language];

  const [epfPaid, setEpfPaid] = useState<boolean>(payrollPeriod?.isEpfPaid || false);
  const [etfPaid, setEtfPaid] = useState<boolean>(payrollPeriod?.isEtfPaid || false);
  const [epfPaymentRef, setEpfPaymentRef] = useState<string>(payrollPeriod?.epfPaymentReference || '');
  const [etfPaymentRef, setEtfPaymentRef] = useState<string>(payrollPeriod?.etfPaymentReference || '');
  const [paymentDate, setPaymentDate] = useState<string>(
    payrollPeriod?.epfPaymentDate || new Date().toISOString().substring(0, 10)
  );

  const records = payrollPeriod?.records || [];

  const totalEpf8 = records.reduce((s, r) => s + (r.epfEmployeeAmount || 0), 0);
  const totalEpf12 = records.reduce((s, r) => s + (r.epfEmployerAmount || 0), 0);
  const totalEpfCombined = totalEpf8 + totalEpf12; // 20%
  const totalEtf3 = records.reduce((s, r) => s + (r.etfEmployerAmount || 0), 0); // 3%
  const totalLiableEarnings = records.reduce((s, r) => s + ((r.basicSalary || 0) - (r.noPayBasicDeduction || 0)), 0);

  const handleSavePaymentStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payrollPeriod) return;

    onSavePayrollPeriod({
      ...payrollPeriod,
      isEpfPaid: epfPaid,
      isEtfPaid: etfPaid,
      epfPaymentReference: epfPaymentRef,
      etfPaymentReference: etfPaymentRef,
      epfPaymentDate: paymentDate,
      etfPaymentDate: paymentDate
    });
    alert('Statutory payment status successfully recorded in database!');
  };

  const handlePrintFormC = () => {
    window.print();
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#005a9e]" />
            {t.epfEtfManagement} - <span className="font-mono text-[#005a9e]">{currentMonth}</span>
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Sri Lankan Employees' Provident Fund (EPF 8% + 12%) & Employees' Trust Fund (ETF 3%) statutory compliance and payment tracker.
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
            id="print-form-c-btn"
            onClick={handlePrintFormC}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#f9fafb] text-[#374151] rounded-lg text-xs font-semibold border border-[#d1d5db] transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Form-C Monthly Return
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
        <div className="bg-white border border-[#d1d5db] rounded-xl p-4 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#6b7280]">Total Liable Basic Earnings</div>
          <div className="text-xl font-bold font-mono text-[#111827] mt-1">
            Rs. {totalLiableEarnings.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#9ca3af] mt-0.5">Subject to EPF/ETF</div>
        </div>

        <div className="bg-white border border-[#d1d5db] rounded-xl p-4 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#005a9e]">{t.epfEmployee8} (Staff Deduction)</div>
          <div className="text-xl font-bold font-mono text-[#005a9e] mt-1">
            Rs. {totalEpf8.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#6b7280] mt-0.5">8% Liable basic</div>
        </div>

        <div className="bg-white border border-[#d1d5db] rounded-xl p-4 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-indigo-700">{t.epfEmployer12} (Company Share)</div>
          <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
            Rs. {totalEpf12.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#6b7280] mt-0.5">12% Company liability</div>
        </div>

        <div className="bg-white border border-[#d1d5db] rounded-xl p-4 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-rose-700">Combined Total EPF (20%)</div>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">
            Rs. {totalEpfCombined.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#6b7280] mt-0.5">Payable to Central Bank / Labour Dept</div>
        </div>
      </div>

      {/* Statutory Payment Status & Reference Update Form */}
      <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-4 no-print">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
          <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-700" />
            Monthly Statutory Payment Status & Reference Log
          </h2>
          <span className="text-xs text-[#6b7280]">
            Due Date: Last working day of the following month
          </span>
        </div>

        <form onSubmit={handleSavePaymentStatus} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EPF Section */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111827] text-sm">EPF (20% - Rs. {totalEpfCombined.toLocaleString()})</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={epfPaid}
                    onChange={e => setEpfPaid(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#cbd5e1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2.5 font-bold text-xs text-[#374151]">
                    {epfPaid ? 'EPF Paid [✓]' : 'Unpaid [!]'}
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-[#4b5563] mb-1">EPF Cheque / Bank Transfer Reference No</label>
                <input
                  type="text"
                  placeholder="e.g. BOC-CHQ-890412 or FT2401098231"
                  value={epfPaymentRef}
                  onChange={e => setEpfPaymentRef(e.target.value)}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                />
              </div>
            </div>

            {/* ETF Section */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111827] text-sm">ETF (3% - Rs. {totalEtf3.toLocaleString()})</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={etfPaid}
                    onChange={e => setEtfPaid(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#cbd5e1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2.5 font-bold text-xs text-[#374151]">
                    {etfPaid ? 'ETF Paid [✓]' : 'Unpaid [!]'}
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-[#4b5563] mb-1">ETF Cheque / Bank Transfer Reference No</label>
                <input
                  type="text"
                  placeholder="e.g. COM-FT-991204 or SLIPS-REF-0012"
                  value={etfPaymentRef}
                  onChange={e => setEtfPaymentRef(e.target.value)}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <label className="text-[#4b5563]">Payment Clearance Date:</label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="bg-white border border-[#d1d5db] rounded px-2.5 py-1 text-[#111827] font-mono focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Update Payment Status
            </button>
          </div>
        </form>
      </div>

      {/* Form C Statutory Return Table (Printable) */}
      <div className="bg-white border border-[#d1d5db] rounded-xl overflow-hidden shadow-xs p-4 space-y-3">
        <div className="flex justify-between items-center no-print">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
            Form C Monthly EPF Contribution Schedule
          </h3>
          <span className="text-xs text-[#6b7280]">
            EPF Employer Registration No: <strong className="text-[#111827] font-mono">{settings.epfRegistrationNumber}</strong>
          </span>
        </div>

        {/* Printable Form C Header */}
        <div className="hidden print-only text-black font-sans mb-4">
          <div className="text-center border-b-2 border-black pb-2">
            <h2 className="text-base font-bold uppercase">{settings.companyName}</h2>
            <p className="text-xs">FORM 'C' MONTHLY EPF RETURN - {currentMonth}</p>
            <p className="text-xs">EPF Registration No: {settings.epfRegistrationNumber} | Address: {settings.address}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#f8fafc] text-[#475569] uppercase text-[10px] tracking-wider border-b border-[#e2e8f0] print:text-black print:bg-gray-200">
              <tr>
                <th className="py-2.5 px-3">EPF Member No</th>
                <th className="py-2.5 px-3">Employee Name</th>
                <th className="py-2.5 px-3">NIC Number</th>
                <th className="py-2.5 px-3 text-right">Total Liable Earnings (Rs.)</th>
                <th className="py-2.5 px-3 text-right text-[#005a9e] print:text-black">Member 8% (Rs.)</th>
                <th className="py-2.5 px-3 text-right text-indigo-700 print:text-black">Employer 12% (Rs.)</th>
                <th className="py-2.5 px-3 text-right font-bold text-rose-700 print:text-black">Total EPF 20% (Rs.)</th>
                <th className="py-2.5 px-3 text-right text-cyan-700 print:text-black">ETF 3% (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] font-mono text-[11px] print:text-black">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[#9ca3af] font-sans">
                    No payroll data calculated for {currentMonth}.
                  </td>
                </tr>
              ) : (
                records.map(r => {
                  const emp = employees.find(e => e.id === r.employeeId);
                  const liable = (r.basicSalary ?? 0) - (r.noPayBasicDeduction ?? 0);
                  const totalEpf = (r.epfEmployeeAmount ?? 0) + (r.epfEmployerAmount ?? 0);

                  return (
                    <tr key={r.id} className="hover:bg-[#f8fafc]">
                      <td className="py-2 px-3 font-bold text-emerald-700 print:text-black">{r.epfNumber}</td>
                      <td className="py-2 px-3 font-sans font-medium text-[#111827] print:text-black">{r.employeeName}</td>
                      <td className="py-2 px-3 text-[#6b7280] print:text-black">{emp?.nic || '-'}</td>
                      <td className="py-2 px-3 text-right text-[#111827] print:text-black">{(liable ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-[#005a9e] print:text-black">{(r.epfEmployeeAmount ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-indigo-700 print:text-black">{(r.epfEmployerAmount ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700 print:text-black">{(totalEpf ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-cyan-700 print:text-black">{(r.etfEmployerAmount ?? 0).toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {records.length > 0 && (
              <tfoot className="bg-[#f8fafc] font-mono font-bold text-xs border-t-2 border-[#d1d5db] text-[#111827] print:text-black print:bg-gray-200">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3 text-right font-sans uppercase">
                    Total Return Contributions:
                  </td>
                  <td className="py-2.5 px-3 text-right">{totalLiableEarnings.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-[#005a9e] print:text-black">{totalEpf8.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-indigo-700 print:text-black">{totalEpf12.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-rose-700 print:text-black">{totalEpfCombined.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-cyan-700 print:text-black">{totalEtf3.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
