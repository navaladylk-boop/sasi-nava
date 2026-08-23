import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit,
  Save,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { Holiday, HolidayType, MonthlyWorkingDaysConfig, Language, UserRole } from '../../types';
import { translations } from '../../i18n/translations';
import { DatabaseService } from '../../services/db';
import { BackButton } from '../common/NavigationButtons';

interface HolidayCalendarViewProps {
  language: Language;
  currentUserRole: UserRole;
  onBack: () => void;
}

export const HolidayCalendarView: React.FC<HolidayCalendarViewProps> = ({
  language,
  currentUserRole,
  onBack
}) => {
  const t = translations[language];

  const isAdmin = currentUserRole === 'Admin';
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM
  
  const [monthlyConfig, setMonthlyConfig] = useState<MonthlyWorkingDaysConfig | null>(null);
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [manualDays, setManualDays] = useState<number>(25);

  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);
  const [editingHoliday, setEditingHoliday] = useState<Partial<Holiday> | null>(null);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  const loadData = () => {
    const allHols = DatabaseService.getHolidays();
    setHolidays(allHols);

    const config = DatabaseService.getMonthlyWorkingDaysConfig(selectedMonth);
    setMonthlyConfig(config);
    setIsManualOverride(config.manualOverride);
    setManualDays(config.manualWorkingDays);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditingModalOpen) {
          setIsEditingModalOpen(false);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingModalOpen, onBack]);

  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHoliday?.date || !editingHoliday?.name || !editingHoliday?.type) {
      setErrorMsg('Date, Name, and Holiday Type are required.');
      return;
    }

    try {
      DatabaseService.saveHoliday({
        id: editingHoliday.id,
        date: editingHoliday.date,
        name: editingHoliday.name,
        nameSinhala: editingHoliday.nameSinhala || '',
        nameTamil: editingHoliday.nameTamil || '',
        type: editingHoliday.type as HolidayType,
        year: parseInt(editingHoliday.date.substring(0, 4), 10) || selectedYear
      }, currentUserRole);

      setSuccessMsg('Holiday saved successfully.');
      setIsEditingModalOpen(false);
      setEditingHoliday(null);
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save holiday.');
    }
  };

  const handleDeleteHoliday = (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday? This will affect automatic working days calculation.')) return;
    try {
      DatabaseService.deleteHoliday(id, currentUserRole);
      setSuccessMsg('Holiday deleted successfully.');
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete holiday.');
    }
  };

  const handleSaveMonthlyConfig = async () => {
    if (!monthlyConfig) return;
    try {
      const updated: MonthlyWorkingDaysConfig = {
        ...monthlyConfig,
        manualOverride: isManualOverride,
        manualWorkingDays: Number(manualDays) || monthlyConfig.autoWorkingDays,
        updatedBy: currentUserRole
      };
      await DatabaseService.saveMonthlyWorkingDaysConfig(updated, currentUserRole);
      setSuccessMsg(`Working days configuration saved for ${selectedMonth}. Final Working Days: ${updated.manualOverride ? updated.manualWorkingDays : updated.autoWorkingDays}`);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save monthly working days.');
    }
  };

  const filteredHolidays = holidays.filter(h => h.year === selectedYear);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <BackButton onClick={onBack} />
        <div className="flex items-center gap-2">
          {successMsg && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-lg text-xs font-semibold animate-fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-800 px-3 py-1 rounded-lg text-xs font-semibold animate-fade-in shadow-xs">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              {errorMsg}
            </div>
          )}
          <button
            type="button"
            onClick={onBack}
            className="no-print px-3 py-1.5 bg-white border border-[#d1d5db] text-[#374151] rounded-lg text-xs font-medium hover:bg-[#f9fafb] cursor-pointer"
          >
            ✕ Close (ESC)
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#005a9e]" />
            Sri Lanka Holiday Calendar & Monthly Working Days
          </h1>
          <p className="text-xs text-[#6b7280] mt-1">
            Compliant with Sri Lanka Labour laws: Automatically calculates working days by subtracting Sundays, Poya, Public, and Mercantile holidays for accurate payroll divisors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-[#6b7280] uppercase mb-1">Select Year</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-xs font-semibold text-[#111827] focus:outline-hidden focus:ring-2 focus:ring-[#005a9e]"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2028}>2028</option>
            </select>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingHoliday({
                  date: `${selectedYear}-01-01`,
                  name: '',
                  type: 'Poya',
                  year: selectedYear
                });
                setIsEditingModalOpen(true);
              }}
              className="mt-5 flex items-center gap-1.5 px-3.5 py-2 bg-[#005a9e] text-white rounded-lg text-xs font-semibold hover:bg-[#004080] shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Holiday
            </button>
          )}
        </div>
      </div>

      {/* MONTHLY WORKING DAYS CONFIGURATION SECTION */}
      <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#e5e7eb] pb-4">
          <div>
            <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#005a9e]" />
              Monthly Working Days Calculation & Manual Override
            </h2>
            <p className="text-xs text-[#6b7280]">
              Select a payroll month to inspect calendar composition and final working days divisor used in salary calculations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#6b7280] uppercase mb-1">Payroll Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#d1d5db] rounded-lg text-xs font-semibold text-[#111827] focus:outline-hidden focus:ring-2 focus:ring-[#005a9e]"
              />
            </div>
          </div>
        </div>

        {monthlyConfig && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0] text-center space-y-1">
              <div className="text-[11px] font-medium text-[#64748b]">Total Calendar Days</div>
              <div className="text-2xl font-bold text-[#1e293b]">{monthlyConfig.calendarDays}</div>
              <div className="text-[10px] text-[#94a3b8]">Days in {selectedMonth}</div>
            </div>

            <div className="bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0] text-center space-y-1">
              <div className="text-[11px] font-medium text-[#64748b]">Sundays & Holidays</div>
              <div className="text-2xl font-bold text-[#dc2626]">
                {monthlyConfig.sundaysCount + monthlyConfig.poyaCount + monthlyConfig.publicHolidayCount + monthlyConfig.mercantileHolidayCount}
              </div>
              <div className="text-[10px] text-[#94a3b8]">
                Sun: {monthlyConfig.sundaysCount} | Poya: {monthlyConfig.poyaCount} | Pub: {monthlyConfig.publicHolidayCount}
              </div>
            </div>

            <div className="bg-[#f0fdf4] p-4 rounded-xl border border-[#bbf7d0] text-center space-y-1">
              <div className="text-[11px] font-semibold text-[#166534]">Auto Calculated Working Days</div>
              <div className="text-2xl font-bold text-[#15803d]">{monthlyConfig.autoWorkingDays}</div>
              <div className="text-[10px] text-[#16a34a]">Calendar Days - Non-Working Days</div>
            </div>

            <div className="bg-[#eff6ff] p-4 rounded-xl border border-[#bfdbfe] text-center space-y-1">
              <div className="text-[11px] font-semibold text-[#1e40af]">Final Working Days Divisor</div>
              <div className="text-2xl font-bold text-[#1d4ed8]">
                {isManualOverride ? monthlyConfig.manualWorkingDays : monthlyConfig.autoWorkingDays}
              </div>
              <div className="text-[10px] text-[#2563eb]">
                {isManualOverride ? '⚠️ Manual Override Active' : 'Automatic Formula Active'}
              </div>
            </div>
          </div>
        )}

        {isAdmin && monthlyConfig && (
          <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e7eb] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4">
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isManualOverride}
                  onChange={e => setIsManualOverride(e.target.checked)}
                  className="w-4 h-4 text-[#005a9e] rounded-sm border-[#d1d5db] focus:ring-[#005a9e]"
                />
                <span className="text-xs font-bold text-[#111827]">Enable Admin Manual Working Days Override for {selectedMonth}</span>
              </label>
              <p className="text-[11px] text-[#6b7280]">
                If enabled, payroll calculations for this month will use your specified working days instead of the automated Sri Lankan calendar calculation.
              </p>
            </div>

            {isManualOverride && (
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#6b7280] uppercase mb-1">Manual Working Days</label>
                  <input
                    type="number"
                    min={1}
                    max={monthlyConfig.calendarDays}
                    value={manualDays}
                    onChange={e => setManualDays(parseInt(e.target.value, 10) || 0)}
                    className="w-24 px-3 py-1.5 bg-white border border-[#d1d5db] rounded-lg text-xs font-bold text-[#111827]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveMonthlyConfig}
                  className="mt-5 px-4 py-2 bg-[#005a9e] text-white rounded-lg text-xs font-semibold hover:bg-[#004080] shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Override
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* HOLIDAYS TABLE */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#005a9e]" />
            Sri Lankan Holidays for {selectedYear} ({filteredHolidays.length})
          </h2>
          <span className="text-xs text-[#6b7280]">Includes Poya, Public, and Mercantile Holidays</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f9fafb] text-[#374151] border-b border-[#e5e7eb]">
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Holiday Name</th>
                <th className="p-3 font-semibold">Sinhala Name</th>
                <th className="p-3 font-semibold">Tamil Name</th>
                <th className="p-3 font-semibold">Type</th>
                {isAdmin && <th className="p-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filteredHolidays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#6b7280]">
                    No holidays recorded for {selectedYear}. Click "Add Holiday" to create one.
                  </td>
                </tr>
              ) : (
                filteredHolidays.sort((a, b) => a.date.localeCompare(b.date)).map(h => (
                  <tr key={h.id} className="hover:bg-[#f9fafb]">
                    <td className="p-3 font-mono font-medium text-[#111827]">{h.date}</td>
                    <td className="p-3 font-semibold text-[#111827]">{h.name}</td>
                    <td className="p-3 text-[#4b5563]">{h.nameSinhala || '-'}</td>
                    <td className="p-3 text-[#4b5563]">{h.nameTamil || '-'}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        h.type === 'Poya'
                          ? 'bg-purple-100 text-purple-800'
                          : h.type === 'Public'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {h.type}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingHoliday(h);
                            setIsEditingModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-[#f3f4f6] text-[#374151] rounded-md text-[11px] font-medium hover:bg-[#e5e7eb] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-[11px] font-medium hover:bg-red-100 cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT / ADD HOLIDAY MODAL */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-[#e5e7eb]">
            <div className="p-4 bg-[#005a9e] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingHoliday?.id ? 'Edit Holiday' : 'Add New Sri Lankan Holiday'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="text-white hover:text-gray-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHoliday} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">Holiday Date *</label>
                <input
                  type="date"
                  required
                  value={editingHoliday?.date || ''}
                  onChange={e => setEditingHoliday({ ...editingHoliday, date: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-xs text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">Holiday Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Duruthu Full Moon Poya Day"
                  value={editingHoliday?.name || ''}
                  onChange={e => setEditingHoliday({ ...editingHoliday, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-xs text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">Holiday Name (Sinhala)</label>
                <input
                  type="text"
                  placeholder="සිංහල නම"
                  value={editingHoliday?.nameSinhala || ''}
                  onChange={e => setEditingHoliday({ ...editingHoliday, nameSinhala: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-xs text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">Holiday Name (Tamil)</label>
                <input
                  type="text"
                  placeholder="தமிழ் பெயர்"
                  value={editingHoliday?.nameTamil || ''}
                  onChange={e => setEditingHoliday({ ...editingHoliday, nameTamil: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-xs text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">Holiday Type *</label>
                <select
                  value={editingHoliday?.type || 'Poya'}
                  onChange={e => setEditingHoliday({ ...editingHoliday, type: e.target.value as HolidayType })}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-xs text-[#111827]"
                >
                  <option value="Poya">Poya Holiday</option>
                  <option value="Public">Public Holiday</option>
                  <option value="Mercantile">Mercantile Holiday</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#d1d5db] text-[#374151] rounded-lg text-xs font-medium hover:bg-[#f9fafb] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#005a9e] text-white rounded-lg text-xs font-semibold hover:bg-[#004080] shadow-xs cursor-pointer"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
