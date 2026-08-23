import React from 'react';
import {
  Users,
  CalendarCheck,
  Fingerprint,
  CalendarOff,
  Calculator,
  TableProperties,
  Printer,
  Landmark,
  FileBarChart,
  Settings,
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  DownloadCloud,
  Sliders
} from 'lucide-react';
import { Language, Employee, ProcessedAttendance, PayrollPeriod, FingerprintDevice } from '../../types';
import { translations } from '../../i18n/translations';
import { ActiveTab } from '../layout/SidebarNav';

interface DashboardViewProps {
  language: Language;
  onNavigate: (tab: ActiveTab) => void;
  employees: Employee[];
  attendance: ProcessedAttendance[];
  currentMonth: string;
  payrollPeriod?: PayrollPeriod;
  devices: FingerprintDevice[];
  onTriggerDownloadPunches: () => void;
  onTriggerGeneratePayroll: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  language,
  onNavigate,
  employees,
  attendance,
  currentMonth,
  payrollPeriod,
  devices,
  onTriggerDownloadPunches,
  onTriggerGeneratePayroll
}) => {
  const t = translations[language];

  const totalEmpCount = employees.filter(e => e.isActive).length;
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayAttendance = attendance.filter(a => a.date === todayStr);

  const presentCount = todayAttendance.filter(a => a.status === 'PRESENT').length;
  const absentCount = todayAttendance.filter(a => a.status === 'ABSENT' || a.status === 'NO_PAY').length;
  const onLeaveCount = todayAttendance.filter(a => a.status === 'LEAVE').length;

  const isCalculated = payrollPeriod && payrollPeriod.status !== 'DRAFT';
  const onlineDevices = devices.filter(d => d.status === 'ONLINE').length;

  const quickTiles = [
    { id: 'employees', label: t.employees, icon: Users, color: 'from-blue-600 to-blue-700', border: 'border-blue-500/40', desc: 'Add, Edit, Master list' },
    { id: 'attendance', label: t.attendance, icon: CalendarCheck, color: 'from-indigo-600 to-indigo-700', border: 'border-indigo-500/40', desc: 'Daily punch review & OT' },
    { id: 'devices', label: t.fingerprintMachine, icon: Fingerprint, color: 'from-cyan-600 to-cyan-700', border: 'border-cyan-500/40', desc: 'Hikvision ISAPI IP Sync' },
    { id: 'leave', label: t.leave, icon: CalendarOff, color: 'from-amber-600 to-amber-700', border: 'border-amber-500/40', desc: 'Annual, Casual, No-Pay' },
    { id: 'payroll', label: t.payroll, icon: Calculator, color: 'from-emerald-600 to-emerald-700', border: 'border-emerald-500/40', desc: '1-Click Monthly Salary' },
    { id: 'salary-sheet', label: t.salarySheet, icon: TableProperties, color: 'from-teal-600 to-teal-700', border: 'border-teal-500/40', desc: 'Master sheet & Excel export' },
    { id: 'payslips', label: t.payslips, icon: Printer, color: 'from-violet-600 to-violet-700', border: 'border-violet-500/40', desc: '4 Payslips on 1 A4 page' },
    { id: 'epf-etf', label: t.epfEtf, icon: Landmark, color: 'from-rose-600 to-rose-700', border: 'border-rose-500/40', desc: '8%, 12%, 3% & Payment tick' },
    { id: 'allowance-rules', label: t.allowanceRules, icon: Sliders, color: 'from-purple-600 to-purple-700', border: 'border-purple-500/40', desc: 'Tiered Unpaid Leave Rules' },
    { id: 'reports', label: t.reports, icon: FileBarChart, color: 'from-sky-600 to-sky-700', border: 'border-sky-500/40', desc: 'Statutory returns & prints' },
    { id: 'settings', label: t.settings, icon: Settings, color: 'from-slate-700 to-slate-800', border: 'border-slate-600/40', desc: 'Rates, Working days, Lang' },
    { id: 'backup', label: t.backupRestore, icon: Database, color: 'from-slate-800 to-slate-900', border: 'border-slate-700/40', desc: 'Database backup (.db)' }
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-6 font-sans">
      {/* 4 Metric KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-[#d1d5db] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[#6b7280] text-xs font-bold uppercase tracking-wide">{t.totalEmployees}</p>
            <Users className="w-4 h-4 text-[#005a9e]" />
          </div>
          <p className="text-3xl font-bold text-[#111827] mt-1">{totalEmpCount}</p>
          <div className="text-[11px] text-green-600 font-semibold mt-1">Active: {totalEmpCount}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#d1d5db] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[#6b7280] text-xs font-bold uppercase tracking-wide">{t.presentToday}</p>
            <CheckCircle2 className="w-4 h-4 text-[#005a9e]" />
          </div>
          <p className="text-3xl font-bold text-[#005a9e] mt-1">{presentCount}</p>
          <div className="text-[11px] text-[#6b7280] font-medium mt-1">
            Rate: {totalEmpCount > 0 ? Math.round((presentCount / totalEmpCount) * 100) : 0}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#d1d5db] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[#6b7280] text-xs font-bold uppercase tracking-wide">{t.absentToday}</p>
            <AlertCircle className="w-4 h-4 text-[#dc2626]" />
          </div>
          <p className="text-3xl font-bold text-[#dc2626] mt-1">
            {absentCount < 10 ? `0${absentCount}` : absentCount}
          </p>
          <div className="text-[11px] text-[#6b7280] font-medium mt-1">Unplanned / No-Pay</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#d1d5db] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[#6b7280] text-xs font-bold uppercase tracking-wide">{t.onLeaveToday}</p>
            <CalendarOff className="w-4 h-4 text-[#d97706]" />
          </div>
          <p className="text-3xl font-bold text-[#d97706] mt-1">
            {onLeaveCount < 10 ? `0${onLeaveCount}` : onLeaveCount}
          </p>
          <div className="text-[11px] text-[#6b7280] font-medium mt-1">Approved Leave</div>
        </div>
      </section>

      {/* Main Workflow & Status Ribbon */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8-cols */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Yellow Banner */}
          <div className="bg-[#fef9c3] border border-[#fde047] p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="text-[#854d0e] font-bold text-sm flex items-center gap-1.5">
                <span>Current Payroll Month: {currentMonth}</span>
              </h3>
              <p className="text-[#a16207] text-xs mt-0.5">
                {isCalculated && payrollPeriod?.totalNet !== undefined
                  ? `Calculated (Net LKR ${(payrollPeriod.totalNet ?? 0).toLocaleString()}). Ready for payslip export.`
                  : 'Status: Ready for calculation. 25 standard working days configured.'}
              </p>
            </div>
            <button
              id="dash-gen-payroll-btn"
              onClick={onTriggerGeneratePayroll}
              className="bg-[#854d0e] hover:bg-[#713f12] text-white px-4 py-2 rounded font-bold text-xs uppercase shadow-xs transition-colors shrink-0"
            >
              {isCalculated ? 'Recalculate Payroll' : 'Generate Payroll'}
            </button>
          </div>

          {/* Quick Actions Workflow Container */}
          <div className="bg-white border border-[#d1d5db] rounded-lg shadow-xs flex flex-col">
            <div className="p-3 border-b border-[#e5e7eb] flex justify-between items-center bg-[#f9fafb]">
              <h2 className="font-bold text-xs text-[#374151] uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#005a9e]" />
                {t.quickActions}
              </h2>
              <span className="text-[10px] bg-[#e5e7eb] text-[#4b5563] font-medium px-2 py-0.5 rounded">
                Process Guide
              </span>
            </div>

            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                id="dash-action-config"
                onClick={() => onNavigate('devices')}
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#d1d5db] hover:border-[#005a9e] hover:bg-[#eff6ff] rounded-xl transition-colors group cursor-pointer"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🖧</span>
                <span className="text-xs font-bold uppercase text-[#4b5563] group-hover:text-[#005a9e]">
                  Config Device
                </span>
                <span className="text-[10px] text-[#9ca3af] mt-0.5">Hikvision ISAPI</span>
              </button>

              <button
                id="dash-action-download"
                onClick={onTriggerDownloadPunches}
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#d1d5db] hover:border-[#005a9e] hover:bg-[#eff6ff] rounded-xl transition-colors group cursor-pointer"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📥</span>
                <span className="text-xs font-bold uppercase text-[#4b5563] group-hover:text-[#005a9e] text-center">
                  Download Punches
                </span>
                <span className="text-[10px] text-[#9ca3af] mt-0.5">Fetch terminal logs</span>
              </button>

              <button
                id="dash-action-leave"
                onClick={() => onNavigate('leave')}
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#d1d5db] hover:border-[#005a9e] hover:bg-[#eff6ff] rounded-xl transition-colors group cursor-pointer"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📑</span>
                <span className="text-xs font-bold uppercase text-[#4b5563] group-hover:text-[#005a9e]">
                  Process Leave
                </span>
                <span className="text-[10px] text-[#9ca3af] mt-0.5">Shop & Office act</span>
              </button>

              <button
                id="dash-action-payslips"
                onClick={() => onNavigate('payslips')}
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#d1d5db] hover:border-[#005a9e] hover:bg-[#eff6ff] rounded-xl transition-colors group cursor-pointer"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🖨️</span>
                <span className="text-xs font-bold uppercase text-[#4b5563] group-hover:text-[#005a9e]">
                  Print Payslips
                </span>
                <span className="text-[10px] text-[#9ca3af] mt-0.5">4 slips on 1 A4</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 4-cols */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* EPF / ETF Status Card */}
          <div className="bg-white border border-[#d1d5db] rounded-lg shadow-xs p-4 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#6b7280] uppercase mb-3 border-b border-[#e5e7eb] pb-2 flex items-center justify-between">
                <span>EPF / ETF Status</span>
                <Landmark className="w-3.5 h-3.5 text-[#005a9e]" />
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#4b5563] font-medium">Monthly Status ({currentMonth})</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    payrollPeriod?.isEpfPaid || payrollPeriod?.epfPaid
                      ? 'bg-green-100 text-green-800'
                      : isCalculated
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {payrollPeriod?.isEpfPaid || payrollPeriod?.epfPaid ? 'PAID' : isCalculated ? 'UNPAID' : 'PENDING'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#f3f4f6] rounded border border-[#e5e7eb] mt-4">
              <p className="text-[10px] text-[#6b7280] mb-0.5 font-bold uppercase">Estimated Statutory Total</p>
              <p className="text-lg font-mono font-bold text-[#111827]">
                LKR {payrollPeriod ? (((payrollPeriod.totalEpfEmployee ?? 0) + (payrollPeriod.totalEpfEmployer ?? 0) + (payrollPeriod.totalEtfEmployer ?? 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </p>
              <p className="text-[10px] text-[#6b7280] mt-0.5">EPF (8%+12%) + ETF (3%)</p>
            </div>
          </div>

          {/* Support Line Dark Card */}
          <div className="bg-[#1e293b] text-white p-4 rounded-lg shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
                LankaHR Support & Helpline
              </h4>
              <p className="text-base font-bold font-mono text-slate-100">+94 11 280 4455</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Colombo Engineering Support Desk</p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onNavigate('settings')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-[10px] py-1.5 font-bold rounded uppercase transition text-slate-200"
              >
                Settings
              </button>
              <button
                onClick={() => onNavigate('backup')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-[10px] py-1.5 font-bold rounded uppercase transition text-slate-200"
              >
                Backup DB
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* All Application Modules Grid */}
      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
          All Application Modules
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickTiles.map(tile => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.id}
                id={`dash-tile-${tile.id}`}
                onClick={() => onNavigate(tile.id as ActiveTab)}
                className="p-4 rounded-xl bg-white border border-[#d1d5db] hover:border-[#005a9e] hover:shadow-md transition-all duration-150 text-left shadow-xs flex flex-col justify-between h-28 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-[#eff6ff] rounded-lg group-hover:bg-[#005a9e] transition-colors">
                    <Icon className="w-4 h-4 text-[#005a9e] group-hover:text-white transition-colors" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#9ca3af] group-hover:text-[#005a9e] group-hover:translate-x-0.5 transition" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#111827] tracking-tight group-hover:text-[#005a9e] transition-colors">
                    {tile.label}
                  </div>
                  <div className="text-[11px] text-[#6b7280] truncate mt-0.5">{tile.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
