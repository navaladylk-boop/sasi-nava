import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Clock,
  Landmark,
  Globe,
  Save,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Radio,
  Briefcase
} from 'lucide-react';
import {
  CompanySettings,
  Language,
  UserRole,
  FingerprintDevice,
  RawAttendancePunch,
  Employee,
  Department,
  Designation
} from '../../types';
import { translations } from '../../i18n/translations';
import { AttendanceDeviceSettings } from './AttendanceDeviceSettings';
import { OrgStructureSettings } from './OrgStructureSettings';

interface SettingsViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currentUserRole: UserRole;
  onUserRoleChange: (role: UserRole) => void;
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
  devices?: FingerprintDevice[];
  rawPunches?: RawAttendancePunch[];
  employees?: Employee[];
  departments?: Department[];
  designations?: Designation[];
  onSaveDepartment?: (dept: Partial<Department>) => void;
  onDeleteDepartment?: (id: string) => { success: boolean; message?: string };
  onSaveDesignation?: (desig: Partial<Designation>) => void;
  onDeleteDesignation?: (id: string) => { success: boolean; message?: string };
  onSaveDevice?: (device: Partial<FingerprintDevice>) => void;
  onPunchesDownloaded?: (punches: RawAttendancePunch[]) => void;
  onUpdateEmployee?: (emp: Partial<Employee>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  onLanguageChange,
  currentUserRole,
  onUserRoleChange,
  settings,
  onSaveSettings,
  devices = [],
  rawPunches = [],
  employees = [],
  departments = [],
  designations = [],
  onSaveDepartment = () => {},
  onDeleteDepartment = () => ({ success: true }),
  onSaveDesignation = () => {},
  onDeleteDesignation = () => ({ success: true }),
  onSaveDevice = () => {},
  onPunchesDownloaded = () => {},
  onUpdateEmployee = () => {}
}) => {
  const t = translations[language];

  const [activeSubTab, setActiveSubTab] = useState<'general' | 'org' | 'device'>('general');
  const [formSettings, setFormSettings] = useState<CompanySettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#005a9e]" />
            {t.companySettings}
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Configure company registration, EPF registration number, working hours, statutory rates, organizational structure, and biometric devices.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold animate-fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Settings saved successfully!
          </div>
        )}
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#d1d5db]">
        <button
          type="button"
          onClick={() => setActiveSubTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'general'
              ? 'border-[#005a9e] text-[#005a9e] bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-[#6b7280] hover:text-[#111827]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Company Profile & Statutory
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('org')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'org'
              ? 'border-[#005a9e] text-[#005a9e] bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-[#6b7280] hover:text-[#111827]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Departments & Designations
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('device')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'device'
              ? 'border-[#005a9e] text-[#005a9e] bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-[#6b7280] hover:text-[#111827]'
          }`}
        >
          <Radio className="w-4 h-4" />
          Attendance Device (Hikvision DS-K1A8503MF)
        </button>
      </div>

      {activeSubTab === 'device' ? (
        <AttendanceDeviceSettings
          language={language}
          devices={devices}
          rawPunches={rawPunches}
          employees={employees}
          onSaveDevice={onSaveDevice}
          onPunchesDownloaded={onPunchesDownloaded}
          onUpdateEmployee={onUpdateEmployee}
        />
      ) : activeSubTab === 'org' ? (
        <OrgStructureSettings
          language={language}
          departments={departments}
          designations={designations}
          onSaveDepartment={onSaveDepartment}
          onDeleteDepartment={onDeleteDepartment}
          onSaveDesignation={onSaveDesignation}
          onDeleteDesignation={onDeleteDesignation}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Profile Section */}
        <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2 border-b border-[#e5e7eb] pb-3">
            <Building2 className="w-4 h-4 text-[#005a9e]" />
            1. Company Profile & Registration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">{t.companyName} *</label>
              <input
                type="text"
                required
                value={formSettings.companyName}
                onChange={e => setFormSettings({ ...formSettings, companyName: e.target.value })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">{t.epfRegistrationNumber} *</label>
              <input
                type="text"
                required
                placeholder="e.g. EPF/A/89104"
                value={formSettings.epfRegistrationNumber}
                onChange={e => setFormSettings({ ...formSettings, epfRegistrationNumber: e.target.value })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 font-mono focus:border-[#005a9e] focus:outline-none text-emerald-700 font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[#4b5563] mb-1 font-medium">{t.address}</label>
              <input
                type="text"
                value={formSettings.address}
                onChange={e => setFormSettings({ ...formSettings, address: e.target.value })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">{t.telephone}</label>
              <input
                type="text"
                value={formSettings.telephone}
                onChange={e => setFormSettings({ ...formSettings, telephone: e.target.value })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">{t.email}</label>
              <input
                type="email"
                value={formSettings.email}
                onChange={e => setFormSettings({ ...formSettings, email: e.target.value })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Working Hours & Shift Rules */}
        <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2 border-b border-[#e5e7eb] pb-3">
            <Clock className="w-4 h-4 text-[#005a9e]" />
            2. Attendance Rules, Shifts & Grace Periods
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">Default Working Days (Divisor)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formSettings.defaultWorkingDaysPerMonth}
                onChange={e => setFormSettings({ ...formSettings, defaultWorkingDaysPerMonth: Number(e.target.value) })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
              />
              <span className="text-[10px] text-[#6b7280]">Standard divisor = 25 days</span>
            </div>

            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">Normal Working Hours/Day</label>
              <input
                type="number"
                min="1"
                max="24"
                value={formSettings.normalWorkingHoursPerDay}
                onChange={e => setFormSettings({ ...formSettings, normalWorkingHoursPerDay: Number(e.target.value) })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
              />
              <span className="text-[10px] text-[#6b7280]">Standard 8.0 hours</span>
            </div>

            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">Shift Start Time</label>
              <input
                type="text"
                placeholder="08:30"
                value={formSettings.shiftStartTime}
                onChange={e => setFormSettings({ ...formSettings, shiftStartTime: e.target.value })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">Late Grace Period (Minutes)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={formSettings.lateGraceMinutes}
                onChange={e => setFormSettings({ ...formSettings, lateGraceMinutes: Number(e.target.value) })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
              />
              <span className="text-[10px] text-[#6b7280]">Default 15 minutes</span>
            </div>
          </div>
        </div>

        {/* Statutory Sri Lankan EPF & ETF Rates */}
        <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2 border-b border-[#e5e7eb] pb-3">
            <Landmark className="w-4 h-4 text-[#005a9e]" />
            3. Sri Lankan Statutory Rates (EPF / ETF)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">{t.epfEmployeeRate} (%)</label>
              <input
                type="number"
                step="0.5"
                value={formSettings.epfEmployeeRate}
                onChange={e => setFormSettings({ ...formSettings, epfEmployeeRate: Number(e.target.value) })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#005a9e] font-mono font-bold focus:border-[#005a9e] focus:outline-none"
              />
              <span className="text-[10px] text-[#6b7280]">Employee contribution (8.0%)</span>
            </div>

            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">{t.epfEmployerRate} (%)</label>
              <input
                type="number"
                step="0.5"
                value={formSettings.epfEmployerRate}
                onChange={e => setFormSettings({ ...formSettings, epfEmployerRate: Number(e.target.value) })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-indigo-700 font-mono font-bold focus:border-[#005a9e] focus:outline-none"
              />
              <span className="text-[10px] text-[#6b7280]">Employer share (12.0%)</span>
            </div>

            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">{t.etfEmployerRate} (%)</label>
              <input
                type="number"
                step="0.5"
                value={formSettings.etfEmployerRate}
                onChange={e => setFormSettings({ ...formSettings, etfEmployerRate: Number(e.target.value) })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-cyan-700 font-mono font-bold focus:border-[#005a9e] focus:outline-none"
              />
              <span className="text-[10px] text-[#6b7280]">ETF Board contribution (3.0%)</span>
            </div>
          </div>
        </div>

        {/* User Role Switcher */}
        <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2 border-b border-[#e5e7eb] pb-3">
            <UserCheck className="w-4 h-4 text-[#005a9e]" />
            4. Access Control & Active User Role
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {(['Admin', 'HR Manager', 'Payroll Officer', 'Operator'] as UserRole[]).map(role => (
              <button
                key={role}
                type="button"
                onClick={() => onUserRoleChange(role)}
                className={`px-4 py-2 rounded-lg border font-semibold transition-colors cursor-pointer ${
                  currentUserRole === role
                    ? 'bg-[#005a9e] border-[#005a9e] text-white shadow-xs'
                    : 'bg-white border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb]'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Application Settings
          </button>
        </div>
      </form>
      )}
    </div>
  );
};
