import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  RefreshCw,
  Search,
  Filter,
  Edit,
  Clock,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Sliders,
  Calendar
} from 'lucide-react';
import {
  Employee,
  ProcessedAttendance,
  AttendanceStatus,
  Language,
  RawAttendancePunch,
  CompanySettings,
  EmployeeLeave
} from '../../types';
import { BackButton } from '../common/NavigationButtons';
import { translations } from '../../i18n/translations';
import { AttendanceProcessor } from '../../services/attendanceProcessor';

interface AttendanceViewProps {
  language: Language;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  employees: Employee[];
  attendance: ProcessedAttendance[];
  rawPunches: RawAttendancePunch[];
  leaves: EmployeeLeave[];
  settings: CompanySettings;
  onSaveAttendanceBatch: (records: ProcessedAttendance[]) => void;
  onUpdateSingleAttendance: (id: string, updates: Partial<ProcessedAttendance>) => void;
  onBack?: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  language,
  currentMonth,
  onMonthChange,
  employees,
  attendance,
  rawPunches,
  leaves,
  settings,
  onSaveAttendanceBatch,
  onUpdateSingleAttendance,
  onBack
}) => {
  const t = translations[language];

  const [selectedEmpId, setSelectedEmpId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<ProcessedAttendance | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processWarnings, setProcessWarnings] = useState<string[]>([]);

  // Filtered attendance for this month
  const filteredRecords = useMemo(() => {
    return attendance.filter(record => {
      const matchesMonth = record.date.startsWith(currentMonth);
      const matchesEmp = selectedEmpId === 'ALL' || record.employeeId === selectedEmpId;
      const matchesStatus = selectedStatus === 'ALL' || record.status === selectedStatus;
      const matchesDate = !selectedDate || record.date === selectedDate;
      return matchesMonth && matchesEmp && matchesStatus && matchesDate;
    });
  }, [attendance, currentMonth, selectedEmpId, selectedStatus, selectedDate]);

  const handleProcessAttendance = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = AttendanceProcessor.processMonthAttendance(
        currentMonth,
        employees,
        rawPunches,
        leaves,
        attendance,
        settings
      );
      onSaveAttendanceBatch(result.records);
      setProcessWarnings(result.warnings);
      setIsProcessing(false);
    }, 600);
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    onUpdateSingleAttendance(editingRecord.id, {
      firstIn: editingRecord.firstIn,
      lastOut: editingRecord.lastOut,
      totalHours: editingRecord.totalHours,
      normalHours: editingRecord.normalHours,
      otHours: editingRecord.otHours,
      status: editingRecord.status,
      remarks: editingRecord.remarks
    });
    setEditingRecord(null);
  };

  const exportCsv = () => {
    const headers = [
      'Employee Code',
      'Employee Name',
      'Date',
      'First IN',
      'Last OUT',
      'Total Hours',
      'Normal Hours',
      'OT Hours',
      'Late (Mins)',
      'Status',
      'Manual Edit',
      'Remarks'
    ];
    const rows = filteredRecords.map(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return [
        emp?.employeeCode || '',
        `"${emp?.fullName || ''}"`,
        r.date,
        r.firstIn || '',
        r.lastOut || '',
        r.totalHours,
        r.normalHours,
        r.otHours,
        r.lateMinutes,
        r.status,
        r.isManualCorrection ? 'YES' : 'NO',
        `"${r.remarks || ''}"`
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEmp = (id: string) => employees.find(e => e.id === id);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-5 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {onBack && <BackButton onClick={onBack} />}
          </div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#005a9e]" />
            {t.attendanceProcessing}
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Review first IN, last OUT, overtime (OT), late arrivals, unpaid leave days, and manual adjustments.
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
              className="bg-transparent text-[#111827] font-bold font-mono focus:outline-none cursor-pointer"
            />
          </div>

          <button
            id="process-attendance-btn"
            disabled={isProcessing}
            onClick={handleProcessAttendance}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#005a9e] hover:bg-[#004880] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Processing Shifts...' : t.processAttendance}
          </button>

          <button
            id="export-att-csv-btn"
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#f9fafb] text-[#374151] rounded-lg text-xs font-semibold border border-[#d1d5db] transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            {t.exportExcel}
          </button>
        </div>
      </div>

      {/* Warnings Banner if missing punches occurred */}
      {processWarnings.length > 0 && (
        <div className="p-3.5 rounded-xl border bg-amber-50 border-amber-200 text-amber-900 flex items-start gap-3 text-xs shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Attendance Warnings Detected:</div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] max-h-24 overflow-y-auto">
              {processWarnings.slice(0, 5).map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
              {processWarnings.length > 5 && (
                <li>...and {processWarnings.length - 5} more punches with missing OUT times.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Filter Ribbon */}
      <div className="bg-white border border-[#d1d5db] rounded-xl p-3.5 flex flex-wrap items-center gap-3 no-print text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#6b7280]" />
          <select
            value={selectedEmpId}
            onChange={e => setSelectedEmpId(e.target.value)}
            className="bg-white border border-[#d1d5db] rounded-lg px-2.5 py-1.5 text-[#111827] focus:outline-none focus:border-[#005a9e] max-w-[220px]"
          >
            <option value="ALL">All Employees ({employees.length})</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>
                {e.employeeCode} - {e.fullName}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-white border border-[#d1d5db] rounded-lg px-2.5 py-1.5 text-[#111827] focus:outline-none focus:border-[#005a9e]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="NO_PAY">No-Pay Unpaid Leave</option>
            <option value="ABSENT">Absent</option>
            <option value="LEAVE">Paid Leave</option>
            <option value="WEEKEND">Weekend</option>
          </select>

          <input
            type="date"
            placeholder="Specific Date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-white border border-[#d1d5db] rounded-lg px-2.5 py-1.5 text-[#111827] focus:outline-none focus:border-[#005a9e]"
          />
        </div>

        <div className="ml-auto text-[#6b7280]">
          Showing <span className="font-bold text-[#111827]">{filteredRecords.length}</span> daily records
        </div>
      </div>

      {/* Attendance Grid Table */}
      <div className="bg-white border border-[#d1d5db] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#f8fafc] text-[#475569] uppercase text-[10px] tracking-wider border-b border-[#e2e8f0]">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3 text-center">First IN</th>
                <th className="py-3 px-3 text-center">Last OUT</th>
                <th className="py-3 px-3 text-center">Total Hrs</th>
                <th className="py-3 px-3 text-center">Normal Hrs</th>
                <th className="py-3 px-3 text-center text-amber-700">OT Hrs</th>
                <th className="py-3 px-3 text-center">Late (Mins)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Remarks</th>
                <th className="py-3 px-3 text-center no-print">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] font-mono">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-[#9ca3af] text-xs font-sans">
                    No attendance records found for {currentMonth}. Click "Process Attendance" to compute from biometric punches.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => {
                  const emp = getEmp(rec.employeeId);
                  return (
                    <tr key={rec.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-2.5 px-3 text-[#374151] font-semibold">{rec.date}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-semibold text-[#111827]">
                          <span className="font-mono text-[#005a9e] mr-1.5">{emp?.employeeCode}</span>
                          {emp?.fullName}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                        {rec.firstIn || '--:--'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#005a9e] font-bold">
                        {rec.lastOut || '--:--'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#111827]">{rec.totalHours}h</td>
                      <td className="py-2.5 px-3 text-center text-[#6b7280]">{rec.normalHours}h</td>
                      <td className="py-2.5 px-3 text-center font-bold text-amber-700">
                        {rec.otHours > 0 ? `+${rec.otHours}h` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {rec.lateMinutes > 0 ? (
                          <span className="text-rose-700 font-bold">{rec.lateMinutes}m</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            rec.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : rec.status === 'NO_PAY'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : rec.status === 'ABSENT'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : rec.status === 'LEAVE'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-gray-100 text-[#4b5563] border-gray-200'
                          }`}
                        >
                          {rec.status}
                        </span>
                        {rec.isManualCorrection && (
                          <span className="ml-1 text-[9px] text-[#005a9e] bg-blue-50 border border-blue-200 px-1 py-0.2 rounded">
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-[#6b7280] text-[11px] truncate max-w-[180px]">
                        {rec.remarks || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center no-print">
                        <button
                          onClick={() => setEditingRecord({ ...rec })}
                          title="Manual Attendance Correction"
                          className="p-1.5 text-[#6b7280] hover:text-[#005a9e] rounded hover:bg-[#eff6ff] transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Correction Dialog */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#d1d5db] rounded-2xl w-full max-w-md shadow-xl overflow-hidden font-sans">
            <div className="px-6 py-4 bg-[#f9fafb] border-b border-[#e5e7eb] flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Edit className="w-4 h-4 text-[#005a9e]" />
                {t.manualAttendanceEntry}
              </h2>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-[#9ca3af] hover:text-[#111827] font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="p-6 space-y-4 text-xs">
              <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] text-[11px]">
                <div>Employee: <span className="font-bold text-[#111827]">{getEmp(editingRecord.employeeId)?.fullName}</span></div>
                <div>Date: <span className="font-mono text-[#005a9e] font-bold">{editingRecord.date}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.firstIn} (HH:mm)</label>
                  <input
                    type="text"
                    placeholder="08:30"
                    value={editingRecord.firstIn || ''}
                    onChange={e => setEditingRecord({ ...editingRecord, firstIn: e.target.value })}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.lastOut} (HH:mm)</label>
                  <input
                    type="text"
                    placeholder="17:00"
                    value={editingRecord.lastOut || ''}
                    onChange={e => setEditingRecord({ ...editingRecord, lastOut: e.target.value })}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.totalHours}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingRecord.totalHours || 0}
                    onChange={e => setEditingRecord({ ...editingRecord, totalHours: Number(e.target.value) })}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-2 py-1.5 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.normalHours}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingRecord.normalHours || 0}
                    onChange={e => setEditingRecord({ ...editingRecord, normalHours: Number(e.target.value) })}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-2 py-1.5 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.otHours}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingRecord.otHours || 0}
                    onChange={e => setEditingRecord({ ...editingRecord, otHours: Number(e.target.value) })}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-2 py-1.5 text-[#111827] font-mono font-bold text-amber-700 focus:border-[#005a9e] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">{t.status}</label>
                <select
                  value={editingRecord.status}
                  onChange={e => setEditingRecord({ ...editingRecord, status: e.target.value as any })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none font-semibold"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="NO_PAY">NO_PAY (Unpaid Leave - Deducts Basic & Allowance)</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="LEAVE">LEAVE (Paid)</option>
                  <option value="WEEKEND">WEEKEND</option>
                  <option value="HOLIDAY">HOLIDAY</option>
                </select>
              </div>

              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">{t.remarks}</label>
                <input
                  type="text"
                  placeholder="Reason for manual correction..."
                  value={editingRecord.remarks || ''}
                  onChange={e => setEditingRecord({ ...editingRecord, remarks: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                />
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
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
