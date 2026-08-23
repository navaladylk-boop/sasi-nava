import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  Printer,
  FileSpreadsheet,
  Users,
  CalendarCheck,
  Clock,
  Landmark,
  Calculator,
  Filter,
  Sparkles,
  Search
} from 'lucide-react';
import {
  Employee,
  ProcessedAttendance,
  PayrollPeriod,
  CompanySettings,
  Language,
  Department
} from '../../types';
import { BackButton } from '../common/NavigationButtons';
import { translations } from '../../i18n/translations';

interface ReportsViewProps {
  language: Language;
  currentMonth: string;
  employees: Employee[];
  attendance: ProcessedAttendance[];
  payrollPeriod?: PayrollPeriod;
  departments: Department[];
  settings: CompanySettings;
  onBack?: () => void;
}

type ReportType =
  | 'emp-master'
  | 'daily-att'
  | 'monthly-att'
  | 'late-arrivals'
  | 'ot-report'
  | 'payroll-summary'
  | 'epf-etf-statutory'
  | 'incentives';

export const ReportsView: React.FC<ReportsViewProps> = ({
  language,
  currentMonth,
  employees,
  attendance,
  payrollPeriod,
  departments,
  settings,
  onBack
}) => {
  const t = translations[language];

  const [selectedReport, setSelectedReport] = useState<ReportType>('payroll-summary');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  const reportItems = [
    { id: 'payroll-summary', title: 'Monthly Payroll Summary Report', icon: Calculator, desc: 'Gross, Net, Deductions, Cost to Company' },
    { id: 'epf-etf-statutory', title: 'EPF & ETF Statutory Contribution Return', icon: Landmark, desc: '8%, 12%, 3% Sri Lankan Labour return' },
    { id: 'emp-master', title: 'Employee Master Directory', icon: Users, desc: 'Full staff list with NIC, EPF, Basic salaries' },
    { id: 'daily-att', title: 'Daily Attendance Punch Log', icon: CalendarCheck, desc: 'First IN, Last OUT, Shift hours' },
    { id: 'late-arrivals', title: 'Late Arrivals & Punctuality Report', icon: Clock, desc: 'Employees reporting after grace period' },
    { id: 'ot-report', title: 'Overtime (OT) Hours & Pay Report', icon: Sparkles, desc: 'Approved OT hours at 1.5x / 2.0x rates' },
    { id: 'incentives', title: 'Allowances & Incentives Schedule', icon: FileSpreadsheet, desc: 'Fixed, variable and attendance allowances' }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `Report_${selectedReport}_${currentMonth}.csv`;

    if (selectedReport === 'payroll-summary' || selectedReport === 'epf-etf-statutory') {
      const records = payrollPeriod?.records || [];
      headers = ['Emp Code', 'Name', 'EPF No', 'Basic', 'No-Pay Deduct', 'Gross', 'EPF 8%', 'Net Salary', 'EPF 12%', 'ETF 3%'];
      rows = records.map(r => [
        r.employeeCode,
        `"${r.employeeName}"`,
        r.epfNumber,
        r.basicSalary,
        r.noPayBasicDeduction,
        r.grossSalary,
        r.epfEmployeeAmount,
        r.netSalary,
        r.epfEmployerAmount,
        r.etfEmployerAmount
      ]);
    } else if (selectedReport === 'emp-master') {
      headers = ['Code', 'Full Name', 'NIC', 'EPF No', 'Department', 'Basic Salary', 'Allowance', 'Bank Name', 'Account No'];
      rows = employees.map(e => [
        e.employeeCode,
        `"${e.fullName}"`,
        e.nic,
        e.epfNumber,
        departments.find(d => d.id === e.departmentId)?.name || 'General',
        e.basicSalary,
        e.fixedAllowance + e.otherAllowance,
        e.bankName,
        `'${e.bankAccountNumber}`
      ]);
    } else {
      headers = ['Date', 'Emp Code', 'Name', 'Status', 'First IN', 'Last OUT', 'Normal Hrs', 'OT Hrs', 'Late Mins'];
      rows = attendance.filter(a => a.date.startsWith(currentMonth)).map(a => {
        const emp = employees.find(e => e.id === a.employeeId);
        return [
          a.date,
          emp?.employeeCode || '',
          `"${emp?.fullName || ''}"`,
          a.status,
          a.firstIn || '',
          a.lastOut || '',
          a.normalHours,
          a.otHours,
          a.lateMinutes
        ];
      });
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {onBack && <BackButton onClick={onBack} />}
          </div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-[#005a9e]" />
            {t.reports}
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Audit-ready Sri Lankan payroll reports, EPF/ETF statutory schedules, and attendance summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#f9fafb] text-[#374151] rounded-lg text-xs font-semibold border border-[#d1d5db] transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel (CSV)
          </button>
        </div>
      </div>

      {/* Select Report Cards List (No Print) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 no-print">
        {reportItems.map(item => {
          const Icon = item.icon;
          const isSelected = selectedReport === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedReport(item.id as ReportType)}
              className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-50 border-[#005a9e] text-[#005a9e] shadow-xs'
                  : 'bg-white border-[#d1d5db] text-[#4b5563] hover:text-[#111827] hover:bg-[#f9fafb]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#005a9e] text-white' : 'bg-[#f1f5f9] text-[#475569]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs leading-snug">{item.title}</div>
              </div>
              <p className="text-[10px] text-[#6b7280] mt-2">{item.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Report Document Paper Preview */}
      <div className="bg-white border border-[#d1d5db] rounded-xl p-6 shadow-xs space-y-4 font-sans">
        {/* Printable Report Header */}
        <div className="border-b-2 border-[#e5e7eb] pb-3 text-center print:border-black">
          <h2 className="text-base font-bold uppercase text-[#111827] print:text-black">{settings.companyName}</h2>
          <p className="text-xs text-[#6b7280] print:text-gray-600">{settings.address} | EPF Reg No: {settings.epfRegistrationNumber}</p>
          <div className="text-xs font-bold text-[#005a9e] uppercase tracking-wide mt-1.5 print:text-black">
            {reportItems.find(r => r.id === selectedReport)?.title} - {currentMonth}
          </div>
        </div>

        {/* Dynamic Report Content Table */}
        <div className="overflow-x-auto">
          {selectedReport === 'payroll-summary' && (
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#f8fafc] text-[#475569] uppercase text-[10px] tracking-wider border-b border-[#e2e8f0] print:bg-gray-100 print:text-black">
                <tr>
                  <th className="py-2.5 px-3">Emp Code</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">EPF No</th>
                  <th className="py-2.5 px-3 text-right">Basic (Rs.)</th>
                  <th className="py-2.5 px-3 text-right text-rose-600 print:text-black">No-Pay (Rs.)</th>
                  <th className="py-2.5 px-3 text-right">Gross (Rs.)</th>
                  <th className="py-2.5 px-3 text-right text-[#005a9e] print:text-black">EPF 8% (Rs.)</th>
                  <th className="py-2.5 px-3 text-right font-bold text-emerald-700 print:text-black">Net Pay (Rs.)</th>
                  <th className="py-2.5 px-3 text-right text-indigo-700 print:text-black">EPF 12% (Rs.)</th>
                  <th className="py-2.5 px-3 text-right text-cyan-700 print:text-black">ETF 3% (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] font-mono text-[11px] print:text-black">
                {!payrollPeriod || !payrollPeriod.records || payrollPeriod.records.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-[#9ca3af] font-sans">
                      No payroll records for {currentMonth}.
                    </td>
                  </tr>
                ) : (
                  payrollPeriod.records.map(r => (
                    <tr key={r.id} className="hover:bg-[#f8fafc]">
                      <td className="py-2 px-3 font-bold text-[#005a9e] print:text-black">{r.employeeCode}</td>
                      <td className="py-2 px-3 font-sans text-[#111827] print:text-black">{r.employeeName}</td>
                      <td className="py-2 px-3 text-emerald-700 print:text-black">{r.epfNumber}</td>
                      <td className="py-2 px-3 text-right">{(r.basicSalary ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-rose-600 print:text-black">
                        {(r.noPayBasicDeduction ?? 0) > 0 ? `-${(r.noPayBasicDeduction ?? 0).toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-[#111827] print:text-black">{(r.grossSalary ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-[#005a9e] print:text-black">-{(r.epfEmployeeAmount ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 print:text-black">Rs. {(r.netSalary ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-indigo-700 print:text-black">{(r.epfEmployerAmount ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-cyan-700 print:text-black">{(r.etfEmployerAmount ?? 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {selectedReport === 'emp-master' && (
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#f8fafc] text-[#475569] uppercase text-[10px] tracking-wider border-b border-[#e2e8f0] print:bg-gray-100 print:text-black">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">NIC</th>
                  <th className="py-2.5 px-3">EPF No</th>
                  <th className="py-2.5 px-3 text-right">Basic (Rs.)</th>
                  <th className="py-2.5 px-3 text-right">Fixed Allowance (Rs.)</th>
                  <th className="py-2.5 px-3">Bank Details</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] text-[11px] print:text-black">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-[#f8fafc]">
                    <td className="py-2 px-3 font-mono font-bold text-[#005a9e] print:text-black">{emp.employeeCode}</td>
                    <td className="py-2 px-3 font-medium text-[#111827] print:text-black">{emp.fullName}</td>
                    <td className="py-2 px-3 font-mono">{emp.nic}</td>
                    <td className="py-2 px-3 font-mono text-emerald-700 print:text-black">{emp.epfNumber}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">{(emp.basicSalary ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono">{(emp.fixedAllowance ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-3 font-mono text-[#6b7280] print:text-black">
                      {emp.bankName} - {emp.bankAccountNumber}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-[10px] font-bold text-emerald-700 print:text-black">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport !== 'payroll-summary' && selectedReport !== 'emp-master' && (
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#f8fafc] text-[#475569] uppercase text-[10px] tracking-wider border-b border-[#e2e8f0] print:bg-gray-100 print:text-black">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">IN</th>
                  <th className="py-2.5 px-3 text-center">OUT</th>
                  <th className="py-2.5 px-3 text-center">Total Hrs</th>
                  <th className="py-2.5 px-3 text-center text-amber-700 print:text-black">OT Hrs</th>
                  <th className="py-2.5 px-3 text-center">Late (Mins)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] font-mono text-[11px] print:text-black">
                {attendance.filter(a => a.date.startsWith(currentMonth)).slice(0, 30).map(a => {
                  const emp = employees.find(e => e.id === a.employeeId);
                  return (
                    <tr key={a.id} className="hover:bg-[#f8fafc]">
                      <td className="py-2 px-3 text-[#374151] print:text-black">{a.date}</td>
                      <td className="py-2 px-3 font-sans text-[#111827] print:text-black">{emp?.fullName}</td>
                      <td className="py-2 px-3 text-center font-bold">{a.status}</td>
                      <td className="py-2 px-3 text-center text-emerald-700 print:text-black">{a.firstIn || '--:--'}</td>
                      <td className="py-2 px-3 text-center text-[#005a9e] print:text-black">{a.lastOut || '--:--'}</td>
                      <td className="py-2 px-3 text-center">{a.totalHours}h</td>
                      <td className="py-2 px-3 text-center text-amber-700 print:text-black">{a.otHours > 0 ? `${a.otHours}h` : '-'}</td>
                      <td className="py-2 px-3 text-center">{a.lateMinutes > 0 ? `${a.lateMinutes}m` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
