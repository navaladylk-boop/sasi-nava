import React, { useState, useMemo } from 'react';
import {
  CalendarOff,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertCircle,
  Calendar,
  Filter,
  Search,
  Edit3,
  Trash2,
  ArrowLeft,
  X
} from 'lucide-react';
import { Employee, EmployeeLeave, LeaveType, Language, PayrollPeriod } from '../../types';
import { BackButton } from '../common/NavigationButtons';
import { translations } from '../../i18n/translations';
import { DatabaseService } from '../../services/db';

interface LeaveManagementViewProps {
  language: Language;
  employees: Employee[];
  leaves: EmployeeLeave[];
  leaveTypes: LeaveType[];
  payrollPeriods?: PayrollPeriod[];
  onSaveLeave: (leave: EmployeeLeave | Omit<EmployeeLeave, 'id'>) => Promise<void> | void;
  onDeleteLeave: (id: string) => Promise<void> | void;
  onUpdateLeaveStatus?: (id: string, status: 'APPROVED' | 'REJECTED', approver: string) => void;
  onBack?: () => void;
}

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({
  language,
  employees,
  leaves,
  leaveTypes,
  payrollPeriods = [],
  onSaveLeave,
  onDeleteLeave,
  onUpdateLeaveStatus,
  onBack
}) => {
  const t = translations[language];

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EmployeeLeave>>({
    employeeId: employees[0]?.id || '',
    leaveTypeId: leaveTypes[0]?.id || '',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date().toISOString().substring(0, 10),
    daysCount: 1,
    reason: '',
    status: 'APPROVED'
  });
  const [initialFormSnapshot, setInitialFormSnapshot] = useState<string>('');
  const [showUnsavedWarning, setShowUnsavedWarning] = useState<boolean>(false);

  // Delete confirmation state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Success / notification message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [payrollWarningModal, setPayrollWarningModal] = useState<{
    show: boolean;
    pendingAction?: () => void;
    message?: string;
  }>({ show: false });

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');

  const getEmp = (id: string) => employees.find(e => e.id === id);
  const getLeaveType = (id: string) => leaveTypes.find(lt => lt.id === id);

  // ESC key keydown handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showUnsavedWarning) {
          setShowUnsavedWarning(false);
        } else if (deleteTargetId) {
          setDeleteTargetId(null);
        } else if (payrollWarningModal.show) {
          setPayrollWarningModal({ show: false });
        } else if (isModalOpen) {
          handleCloseModalAttempt();
        } else if (onBack) {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUnsavedWarning, deleteTargetId, payrollWarningModal, isModalOpen, onBack, formData, initialFormSnapshot]);

  // Open Add Modal
  const handleOpenAdd = () => {
    const defaultData = {
      employeeId: employees[0]?.id || '',
      leaveTypeId: leaveTypes[0]?.id || '',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: new Date().toISOString().substring(0, 10),
      daysCount: 1,
      reason: '',
      status: 'APPROVED' as const
    };
    setEditingLeaveId(null);
    setFormData(defaultData);
    setInitialFormSnapshot(JSON.stringify(defaultData));
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (leave: EmployeeLeave) => {
    const data = {
      employeeId: leave.employeeId,
      leaveTypeId: leave.leaveTypeId,
      startDate: leave.startDate,
      endDate: leave.endDate,
      daysCount: leave.daysCount,
      reason: leave.reason,
      status: leave.status
    };
    setEditingLeaveId(leave.id);
    setFormData(data);
    setInitialFormSnapshot(JSON.stringify(data));
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Check if form is dirty
  const isFormDirty = () => {
    return JSON.stringify(formData) !== initialFormSnapshot;
  };

  const handleCloseModalAttempt = () => {
    if (isFormDirty()) {
      setShowUnsavedWarning(true);
    } else {
      setIsModalOpen(false);
    }
  };

  // Date calculation
  const handleDateChange = (start?: string, end?: string) => {
    const s = start !== undefined ? start : (formData.startDate || '');
    const e = end !== undefined ? end : (formData.endDate || '');
    let count = 1;
    if (s && e) {
      const d1 = new Date(s);
      const d2 = new Date(e);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diffTime = d2.getTime() - d1.getTime();
        count = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
      }
    }
    setFormData(prev => ({ ...prev, startDate: s, endDate: e, daysCount: count }));
  };

  // Check payroll impact
  const checkPayrollImpact = (startDate: string, endDate: string): boolean => {
    if (!payrollPeriods || payrollPeriods.length === 0) return false;
    const startMonth = startDate.substring(0, 7);
    const endMonth = endDate.substring(0, 7);
    return payrollPeriods.some(
      p => (p.monthYear === startMonth || p.monthYear === endMonth) && (p.status === 'FINALIZED' || p.status === 'CALCULATED')
    );
  };

  // Submit Form (Add or Edit)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.employeeId || !formData.leaveTypeId || !formData.startDate || !formData.endDate) {
      setErrorMessage('Please fill in all required leave fields.');
      return;
    }

    // Date Validation: To Date < From Date
    if (formData.endDate < formData.startDate) {
      setErrorMessage('End date cannot be earlier than start date.');
      return;
    }

    // Overlapping Leave Validation
    const overlap = leaves.find(l => {
      if (editingLeaveId && l.id === editingLeaveId) return false;
      if (l.employeeId !== formData.employeeId) return false;
      if (l.status === 'REJECTED') return false;
      // Check date range overlap
      return (
        (formData.startDate! >= l.startDate && formData.startDate! <= l.endDate) ||
        (formData.endDate! >= l.startDate && formData.endDate! <= l.endDate) ||
        (l.startDate >= formData.startDate! && l.startDate <= formData.endDate!)
      );
    });

    if (overlap) {
      setErrorMessage('Leave already exists for this employee during the selected dates.');
      return;
    }

    // Payroll Safety Check
    const hasPayrollImpact = checkPayrollImpact(formData.startDate!, formData.endDate!);
    if (hasPayrollImpact) {
      setPayrollWarningModal({
        show: true,
        message: 'Payroll has already been generated for this period. Recalculate payroll if required. Do you want to continue?',
        pendingAction: () => executeSave()
      });
      return;
    }

    executeSave();
  };

  const executeSave = async () => {
    setPayrollWarningModal({ show: false });
    try {
      if (editingLeaveId) {
        await onSaveLeave({
          id: editingLeaveId,
          employeeId: formData.employeeId!,
          leaveTypeId: formData.leaveTypeId!,
          startDate: formData.startDate!,
          endDate: formData.endDate!,
          daysCount: formData.daysCount || 1,
          reason: formData.reason || '',
          status: formData.status as any || 'APPROVED',
          appliedDate: new Date().toISOString().substring(0, 10),
          approvedBy: 'HR Admin'
        });
        setSuccessMessage('Leave updated successfully.');
      } else {
        await onSaveLeave({
          employeeId: formData.employeeId!,
          leaveTypeId: formData.leaveTypeId!,
          startDate: formData.startDate!,
          endDate: formData.endDate!,
          daysCount: formData.daysCount || 1,
          reason: formData.reason || '',
          status: formData.status as any || 'APPROVED',
          appliedDate: new Date().toISOString().substring(0, 10),
          approvedBy: 'HR Admin'
        });
        setSuccessMessage('Leave saved successfully.');
      }
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save leave.');
    }
  };

  // Delete handling
  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const leaveRec = leaves.find(l => l.id === deleteTargetId);
    const hasPayrollImpact = leaveRec ? checkPayrollImpact(leaveRec.startDate, leaveRec.endDate) : false;

    if (hasPayrollImpact) {
      setPayrollWarningModal({
        show: true,
        message: 'This leave record affects an existing payroll calculation. Do you want to continue?',
        pendingAction: () => executeDelete(deleteTargetId)
      });
      setDeleteTargetId(null);
      return;
    }

    await executeDelete(deleteTargetId);
  };

  const executeDelete = async (id: string) => {
    try {
      await onDeleteLeave(id);
      setDeleteTargetId(null);
      setSuccessMessage('Leave deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete leave.');
    }
  };

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const emp = getEmp(l.employeeId);
      const lt = getLeaveType(l.leaveTypeId);

      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchCode = emp?.employeeCode.toLowerCase().includes(q) || false;
        const matchName = emp?.fullName.toLowerCase().includes(q) || false;
        const matchReason = l.reason.toLowerCase().includes(q) || false;
        if (!matchCode && !matchName && !matchReason) return false;
      }

      // Leave type filter
      if (filterType !== 'ALL' && l.leaveTypeId !== filterType) return false;

      // Status filter
      if (filterStatus !== 'ALL' && l.status !== filterStatus) return false;

      // Month filter
      if (filterMonth !== 'ALL') {
        const startsInMonth = l.startDate.startsWith(filterMonth);
        const endsInMonth = l.endDate.startsWith(filterMonth);
        if (!startsInMonth && !endsInMonth) return false;
      }

      return true;
    });
  }, [leaves, employees, leaveTypes, searchTerm, filterType, filterStatus, filterMonth]);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-6 font-sans">
      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMessage}
          <button onClick={() => setErrorMessage(null)} className="ml-auto font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {onBack && <BackButton onClick={onBack} />}
          </div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-[#005a9e]" />
            {t.leaveManagement}
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Complete Leave Management for Annual, Casual, Medical, and No-Pay leaves with automatic SQLite synchronization and payroll integration.
          </p>
        </div>

        <button
          id="apply-leave-btn"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.applyLeave}
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-[#d1d5db] rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search employee ID, name, reason..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#f9fafb] border border-[#d1d5db] rounded-lg pl-9 pr-3 py-2 text-[#111827] focus:bg-white focus:border-[#005a9e] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full bg-[#f9fafb] border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:bg-white focus:border-[#005a9e] focus:outline-none"
          >
            <option value="ALL">All Leave Types</option>
            {leaveTypes.map(lt => (
              <option key={lt.id} value={lt.id}>{lt.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full bg-[#f9fafb] border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:bg-white focus:border-[#005a9e] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div>
          <input
            type="month"
            value={filterMonth === 'ALL' ? '' : filterMonth}
            onChange={e => setFilterMonth(e.target.value || 'ALL')}
            placeholder="Filter by Month"
            className="w-full bg-[#f9fafb] border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:bg-white focus:border-[#005a9e] focus:outline-none"
          />
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="bg-white border border-[#d1d5db] rounded-xl overflow-hidden shadow-xs space-y-3 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
            Leave Records ({filteredLeaves.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-[#475569] uppercase text-[10px] tracking-wider border-b border-[#e2e8f0]">
              <tr>
                <th className="py-3 px-3">Employee ID & Name</th>
                <th className="py-3 px-3">Leave Type</th>
                <th className="py-3 px-3">From → To Date</th>
                <th className="py-3 px-3 text-center">Days</th>
                <th className="py-3 px-3 text-center">Paid / Unpaid</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Created Date</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-[#9ca3af] text-xs">
                    No leave records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map(l => {
                  const emp = getEmp(l.employeeId);
                  const lt = getLeaveType(l.leaveTypeId);
                  const isPaid = lt ? lt.isPaid : !(l.leaveTypeId === 'lt-4' || l.reason?.toLowerCase().includes('no pay'));

                  return (
                    <tr key={l.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#111827]">{emp?.fullName || 'Unknown'}</div>
                        <div className="font-mono text-[11px] text-[#005a9e]">{emp?.employeeCode || l.employeeId}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-[#005a9e] border border-blue-200">
                          {lt?.name || 'Leave'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#374151]">
                        {l.startDate} → {l.endDate}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-[#111827]">
                        {l.daysCount} d
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isPaid ? 'Paid' : 'Unpaid (No-Pay)'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#6b7280] text-[11px] max-w-xs truncate">
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
                          {l.status === 'APPROVED' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-[#6b7280]">
                        {l.appliedDate || '2026-01-01'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(l)}
                            className="p-1.5 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#374151] rounded-lg transition-colors cursor-pointer"
                            title="Edit Leave"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(l.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Leave"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {l.status === 'PENDING' && onUpdateLeaveStatus && (
                            <button
                              onClick={() => onUpdateLeaveStatus(l.id, 'APPROVED', 'HR Admin')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#d1d5db] rounded-2xl w-full max-w-md shadow-xl overflow-hidden font-sans">
            <div className="px-6 py-4 bg-[#f9fafb] border-b border-[#e5e7eb] flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <CalendarOff className="w-4 h-4 text-[#005a9e]" />
                {editingLeaveId ? 'Edit Leave Application' : t.applyLeave}
              </h2>
              <button onClick={handleCloseModalAttempt} className="text-[#9ca3af] hover:text-[#111827] font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Select Employee *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
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
                  value={formData.leaveTypeId}
                  onChange={e => setFormData({ ...formData, leaveTypeId: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none font-semibold"
                >
                  {leaveTypes.map(lt => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} {lt.isPaid ? '(Paid)' : '(Unpaid - Deducts from Salary)'}
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
                    value={formData.startDate}
                    onChange={e => handleDateChange(e.target.value, undefined)}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.endDate} *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => handleDateChange(undefined, e.target.value)}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Number of Days (Auto-calculated)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.daysCount || 1}
                  onChange={e => setFormData({ ...formData, daysCount: Number(e.target.value) })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono font-bold focus:border-[#005a9e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Status *</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                >
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">{t.leaveReason} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medical emergency / Family event / Annual vacation"
                  value={formData.reason || ''}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#e5e7eb] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModalAttempt}
                  className="px-4 py-2 bg-white hover:bg-[#f9fafb] border border-[#d1d5db] text-[#374151] rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  {editingLeaveId ? 'Update Leave Record' : 'Save & Apply Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#d1d5db] rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4 font-sans text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-[#111827]">Are you sure you want to delete this leave record?</h3>
            </div>
            <p className="text-[#6b7280]">
              This action will permanently delete the leave entry from SQLite storage and update attendance calculations.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 bg-white hover:bg-[#f9fafb] border border-[#d1d5db] text-[#374151] rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#d1d5db] rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4 font-sans text-xs">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-[#111827]">Unsaved changes will be lost. Do you want to close?</h3>
            </div>
            <p className="text-[#6b7280]">
              You have entered or modified leave information. Closing now will discard your current edits.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowUnsavedWarning(false)}
                className="px-4 py-2 bg-white hover:bg-[#f9fafb] border border-[#d1d5db] text-[#374151] rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowUnsavedWarning(false);
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold cursor-pointer"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Warning / Confirmation Modal */}
      {payrollWarningModal.show && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#d1d5db] rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4 font-sans text-xs">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-[#111827]">Payroll Period Notice</h3>
            </div>
            <p className="text-[#374151] leading-relaxed">
              {payrollWarningModal.message || 'This leave record may affect an existing payroll calculation. Do you want to continue?'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPayrollWarningModal({ show: false })}
                className="px-4 py-2 bg-white hover:bg-[#f9fafb] border border-[#d1d5db] text-[#374151] rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const action = payrollWarningModal.pendingAction;
                  setPayrollWarningModal({ show: false });
                  if (action) action();
                }}
                className="px-4 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg font-semibold cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
