import React, { useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Employee, IncentiveRecord, IncentiveType, Language } from '../../types';
import { translations } from '../../i18n/translations';

interface IncentivesViewProps {
  language: Language;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  employees: Employee[];
  incentives: IncentiveRecord[];
  onSaveIncentive: (incentive: Partial<IncentiveRecord>) => void;
  onDeleteIncentive: (id: string) => void;
}

export const IncentivesView: React.FC<IncentivesViewProps> = ({
  language,
  currentMonth,
  onMonthChange,
  employees,
  incentives,
  onSaveIncentive,
  onDeleteIncentive
}) => {
  const t = translations[language];

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingIncentive, setEditingIncentive] = useState<Partial<IncentiveRecord> | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');

  // Filtered incentives for the selected month
  const monthIncentives = useMemo(() => {
    return incentives.filter(inc => {
      const matchesMonth = !currentMonth || inc.payrollMonth === currentMonth;
      const emp = employees.find(e => e.id === inc.employeeId);
      const matchesSearch =
        !searchTerm ||
        (emp && emp.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp && emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inc.remarks && inc.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = selectedType === 'ALL' || inc.type === selectedType;

      return matchesMonth && matchesSearch && matchesType;
    });
  }, [incentives, currentMonth, employees, searchTerm, selectedType]);

  const totalIncentivesAmount = useMemo(() => {
    return monthIncentives.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }, [monthIncentives]);

  const handleOpenAdd = () => {
    setEditingIncentive({
      employeeId: employees[0]?.id || '',
      payrollMonth: currentMonth,
      type: 'PRODUCTION',
      targetAmount: 100000,
      achievementAmount: 120000,
      amount: 5000,
      description: 'Monthly Performance / Target Incentive',
      remarks: 'Achieved 120% of sales/production target',
      date: new Date().toISOString().substring(0, 10)
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inc: IncentiveRecord) => {
    setEditingIncentive({ ...inc });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncentive || !editingIncentive.employeeId) {
      alert('Please select an employee.');
      return;
    }

    onSaveIncentive(editingIncentive);
    setIsModalOpen(false);
    setEditingIncentive(null);
    setSaveSuccessMessage('Incentive record saved and synchronized with Payroll.');
    setTimeout(() => setSaveSuccessMessage(''), 3500);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this incentive entry?')) {
      onDeleteIncentive(id);
    }
  };

  const handleCalculateSuggestedAmount = () => {
    if (!editingIncentive) return;
    const target = Number(editingIncentive.targetAmount) || 0;
    const achieve = Number(editingIncentive.achievementAmount) || 0;
    if (target > 0 && achieve >= target) {
      const surplus = achieve - target;
      // 5% of surplus plus base Rs. 2000 bonus
      const calculated = Math.round(2000 + surplus * 0.05);
      setEditingIncentive(prev => (prev ? { ...prev, amount: calculated } : null));
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-5 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#005a9e]" />
            Incentives & Performance Rewards
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Manage target vs achievement, production bonuses, and attendance incentives. All records automatically feed into monthly payroll calculations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#d1d5db] shadow-2xs">
            <Calendar className="w-4 h-4 text-[#6b7280]" />
            <span className="text-xs text-[#6b7280] font-medium">Month:</span>
            <input
              type="month"
              value={currentMonth}
              onChange={e => onMonthChange(e.target.value)}
              className="text-xs font-bold text-[#111827] bg-transparent border-none focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Incentive
          </button>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {saveSuccessMessage}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#d1d5db] shadow-xs">
          <div className="flex justify-between items-center text-xs text-[#6b7280] font-medium">
            <span>Total Incentives ({currentMonth})</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-[#111827] mt-1">
            Rs. {totalIncentivesAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">
            Included in gross salary calculations
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d1d5db] shadow-xs">
          <div className="flex justify-between items-center text-xs text-[#6b7280] font-medium">
            <span>Beneficiary Employees</span>
            <Award className="w-4 h-4 text-[#005a9e]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#111827] mt-1">
            {monthIncentives.length}
          </div>
          <p className="text-[11px] text-[#6b7280] mt-1">
            Across active departments
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d1d5db] shadow-xs">
          <div className="flex justify-between items-center text-xs text-[#6b7280] font-medium">
            <span>Statutory EPF/ETF Impact</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-[#111827] mt-1">
            Non-EPF Allowance
          </div>
          <p className="text-[11px] text-[#6b7280] mt-1">
            Incentives add to gross take-home without EPF deduction
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#d1d5db] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by employee name, code, or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg focus:border-[#005a9e] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#6b7280]" />
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="text-xs bg-white border border-[#d1d5db] rounded-lg px-3 py-1.5 focus:border-[#005a9e] focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="PRODUCTION">Production Incentive</option>
            <option value="SALES">Sales Incentive</option>
            <option value="ATTENDANCE">Attendance Bonus</option>
            <option value="SEASONAL">Seasonal / Festive</option>
            <option value="MANUAL">Manual / Special</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#d1d5db] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[#4b5563] font-bold">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Target</th>
                <th className="py-3 px-4 text-right">Achievement</th>
                <th className="py-3 px-4 text-right">Incentive Amount</th>
                <th className="py-3 px-4">Date / Month</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {monthIncentives.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#6b7280]">
                    <Award className="w-8 h-8 mx-auto mb-2 text-[#9ca3af]" />
                    No incentive records found for {currentMonth}.
                  </td>
                </tr>
              ) : (
                monthIncentives.map(inc => {
                  const emp = employees.find(e => e.id === inc.employeeId);
                  const isTargetMet =
                    inc.targetAmount && inc.achievementAmount
                      ? inc.achievementAmount >= inc.targetAmount
                      : false;

                  return (
                    <tr key={inc.id} className="hover:bg-[#f9fafb] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#111827]">
                          {emp ? emp.fullName : 'Unknown Employee'}
                        </div>
                        <div className="text-[11px] text-[#6b7280] font-mono">
                          {emp?.employeeCode || inc.employeeId}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {inc.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#4b5563]">
                        {inc.targetAmount ? `Rs. ${inc.targetAmount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {inc.achievementAmount ? (
                          <span className={isTargetMet ? 'text-emerald-700 font-bold' : 'text-[#4b5563]'}>
                            Rs. {inc.achievementAmount.toLocaleString()}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                        Rs. {Number(inc.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#6b7280]">
                        {inc.date || inc.payrollMonth}
                      </td>
                      <td className="py-3 px-4 text-[#4b5563] max-w-xs truncate">
                        {inc.remarks || inc.description}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(inc)}
                            className="p-1 text-[#005a9e] hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inc.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Add/Edit Modal */}
      {isModalOpen && editingIncentive && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full border border-[#d1d5db] shadow-xl overflow-hidden">
            <div className="p-4 bg-[#f9fafb] border-b border-[#e5e7eb] flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#005a9e]" />
                {editingIncentive.id ? 'Edit Incentive Record' : 'Add Employee Incentive'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#6b7280] hover:text-[#111827] font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Employee *</label>
                <select
                  required
                  value={editingIncentive.employeeId || ''}
                  onChange={e => setEditingIncentive({ ...editingIncentive, employeeId: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                >
                  <option value="">Select Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeCode} - {emp.fullName} ({emp.basicSalary ? `Rs. ${emp.basicSalary.toLocaleString()}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">Payroll Month *</label>
                  <input
                    type="month"
                    required
                    value={editingIncentive.payrollMonth || currentMonth}
                    onChange={e => setEditingIncentive({ ...editingIncentive, payrollMonth: e.target.value })}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">Incentive Type *</label>
                  <select
                    value={editingIncentive.type || 'PRODUCTION'}
                    onChange={e => setEditingIncentive({ ...editingIncentive, type: e.target.value as IncentiveType })}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                  >
                    <option value="PRODUCTION">Production Incentive</option>
                    <option value="SALES">Sales Incentive</option>
                    <option value="ATTENDANCE">Attendance Bonus</option>
                    <option value="SEASONAL">Seasonal / Festive</option>
                    <option value="MANUAL">Manual / Custom</option>
                    <option value="OTHER">Other Reward</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">Target Amount (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 100000"
                    value={editingIncentive.targetAmount || 0}
                    onChange={e => setEditingIncentive({ ...editingIncentive, targetAmount: Number(e.target.value) })}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">Achievement Amount (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 120000"
                    value={editingIncentive.achievementAmount || 0}
                    onChange={e => setEditingIncentive({ ...editingIncentive, achievementAmount: Number(e.target.value) })}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[#4b5563] font-medium">Incentive Amount (Rs.) *</label>
                  <button
                    type="button"
                    onClick={handleCalculateSuggestedAmount}
                    className="text-[11px] text-[#005a9e] hover:underline font-semibold"
                  >
                    Auto-calc bonus
                  </button>
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 5000"
                  value={editingIncentive.amount || 0}
                  onChange={e => setEditingIncentive({ ...editingIncentive, amount: Number(e.target.value) })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-bold font-mono text-base focus:border-[#005a9e] focus:outline-none text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Remarks / Justification</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Completed targeted output on time; zero quality rejection."
                  value={editingIncentive.remarks || ''}
                  onChange={e => setEditingIncentive({ ...editingIncentive, remarks: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#e5e7eb] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#f9fafb] border border-[#d1d5db] text-[#374151] rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Incentive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
