import React, { useState } from 'react';
import {
  CalendarOff,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertCircle,
  Calendar,
  Filter
} from 'lucide-react';
import { Employee, EmployeeLeave, LeaveType, Language } from '../../types';
import { translations } from '../../i18n/translations';

interface LeaveManagementViewProps {
  language: Language;
  employees: Employee[];
  leaves: EmployeeLeave[];
  leaveTypes: LeaveType[];
  onApplyLeave: (leave: Omit<EmployeeLeave, 'id'>) => void;
  onUpdateLeaveStatus: (id: string, status: 'APPROVED' | 'REJECTED', approver: string) => void;
}

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({
  language,
  employees,
  leaves,
  leaveTypes,
  onApplyLeave,
  onUpdateLeaveStatus
}) => {
  const t = translations[language];

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newLeave, setNewLeave] = useState<Partial<EmployeeLeave>>({
    employeeId: employees[0]?.id || '',
    leaveTypeId: leaveTypes[0]?.id || '',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date().toISOString().substring(0, 10),
    daysCount: 1,
    reason: '',
    status: 'APPROVED'
  });

  const handleOpenApplyModal = () => {
    setNewLeave({
      employeeId: employees[0]?.id || '',
      leaveTypeId: leaveTypes[0]?.id || '',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: new Date().toISOString().substring(0, 10),
      daysCount: 1,
      reason: '',
      status: 'APPROVED'
    });
    setIsModalOpen(true);
  };

  const handleDateChange = (start?: string, end?: string) => {
    const s = start || newLeave.startDate || '';
    const e = end || newLeave.endDate || '';
    let count = 1;
    if (s && e) {
      const d1 = new Date(s);
      const d2 = new Date(e);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      count = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    setNewLeave(prev => ({ ...prev, startDate: s, endDate: e, daysCount: count }));
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.employeeId || !newLeave.leaveTypeId || !newLeave.startDate || !newLeave.endDate) {
      alert('Please fill all required leave fields.');
      return;
    }
    onApplyLeave({
      employeeId: newLeave.employeeId,
      leaveTypeId: newLeave.leaveTypeId,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      daysCount: newLeave.daysCount || 1,
      reason: newLeave.reason || 'Personal leave request',
      status: newLeave.status as any || 'APPROVED',
      appliedDate: new Date().toISOString().substring(0, 10),
      approvedBy: 'HR Administrator'
    });
    setIsModalOpen(false);
  };

  const getEmp = (id: string) => employees.find(e => e.id === id);
  const getLeaveType = (id: string) => leaveTypes.find(lt => lt.id === id);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-[#005a9e]" />
            {t.leaveManagement}
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Manage Annual, Casual, Medical, and No-Pay unpaid leaves. No-Pay leave days automatically calculate statutory basic & allowance deductions in payroll.
          </p>
        </div>

        <button
          id="apply-leave-btn"
          onClick={handleOpenApplyModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.applyLeave}
        </button>
      </div>

      {/* Statutory Leave Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-xs">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold">Sri Lanka Shop & Office Employees Act Leave Rules:</div>
          <div className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
            Standard full-time staff are entitled to 14 Annual leaves and 7 Casual leaves per annum. Any unexcused absence or designated <strong>No-Pay Leave</strong> automatically triggers Basic salary daily deduction (Basic ÷ 25) and Special Tiered Allowance deduction.
          </div>
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="bg-white border border-[#d1d5db] rounded-xl overflow-hidden shadow-xs space-y-3 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
          Leave Applications & History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-[#475569] uppercase text-[10px] tracking-wider border-b border-[#e2e8f0]">
              <tr>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Leave Type</th>
                <th className="py-3 px-3">Duration (Dates)</th>
                <th className="py-3 px-3 text-center">Days</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#9ca3af] text-xs">
                    No leave records found. Click "Apply Leave" to record an approved or unpaid leave.
                  </td>
                </tr>
              ) : (
                leaves.map(l => {
                  const emp = getEmp(l.employeeId);
                  const lt = getLeaveType(l.leaveTypeId);
                  const isNoPay = lt?.code === 'NOPAY' || l.leaveTypeId === 'lt-4';

                  return (
                    <tr key={l.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#111827]">{emp?.fullName}</div>
                        <div className="font-mono text-[11px] text-[#005a9e]">{emp?.employeeCode}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                            isNoPay
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-blue-50 text-[#005a9e] border-blue-200'
                          }`}
                        >
                          {lt?.name || 'General Leave'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#374151]">
                        {l.startDate} → {l.endDate}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-[#111827]">
                        {l.daysCount} d
                      </td>
                      <td className="py-3 px-3 text-[#6b7280] text-[11px]">
                        {l.reason}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            l.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : l.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {l.status === 'APPROVED' ? <CheckCircle2 className="w-2.5 h-2.5" /> : null}
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {l.status === 'PENDING' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onUpdateLeaveStatus(l.id, 'APPROVED', 'HR Admin')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onUpdateLeaveStatus(l.id, 'REJECTED', 'HR Admin')}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#9ca3af]">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#d1d5db] rounded-2xl w-full max-w-md shadow-xl overflow-hidden font-sans">
            <div className="px-6 py-4 bg-[#f9fafb] border-b border-[#e5e7eb] flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <CalendarOff className="w-4 h-4 text-[#005a9e]" />
                {t.applyLeave}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#9ca3af] hover:text-[#111827] font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Select Employee *</label>
                <select
                  required
                  value={newLeave.employeeId}
                  onChange={e => setNewLeave({ ...newLeave, employeeId: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                >
                  {employees.filter(e => e.isActive).map(e => (
                    <option key={e.id} value={e.id}>
                      {e.employeeCode} - {e.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">{t.leaveType} *</label>
                <select
                  required
                  value={newLeave.leaveTypeId}
                  onChange={e => setNewLeave({ ...newLeave, leaveTypeId: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none font-semibold"
                >
                  {leaveTypes.map(lt => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} {lt.code === 'NOPAY' ? '(Unpaid - Deducts from Salary)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.startDate} *</label>
                  <input
                    type="date"
                    required
                    value={newLeave.startDate}
                    onChange={e => handleDateChange(e.target.value, undefined)}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.endDate} *</label>
                  <input
                    type="date"
                    required
                    value={newLeave.endDate}
                    onChange={e => handleDateChange(undefined, e.target.value)}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">{t.daysCount}</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newLeave.daysCount || 1}
                  onChange={e => setNewLeave({ ...newLeave, daysCount: Number(e.target.value) })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono font-bold focus:border-[#005a9e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">{t.leaveReason}</label>
                <input
                  type="text"
                  placeholder="e.g. Medical emergency / Family event"
                  value={newLeave.reason || ''}
                  onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#e5e7eb] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#f9fafb] border border-[#d1d5db] text-[#374151] rounded-lg font-semibold shadow-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg font-semibold shadow-xs"
                >
                  Save & Apply Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
