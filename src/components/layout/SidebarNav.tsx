import React from 'react';
import {
  LayoutDashboard,
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
  Sliders,
  Award
} from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../i18n/translations';

export type ActiveTab =
  | 'dashboard'
  | 'employees'
  | 'attendance'
  | 'devices'
  | 'leave'
  | 'incentives'
  | 'payroll'
  | 'salary-sheet'
  | 'payslips'
  | 'epf-etf'
  | 'allowance-rules'
  | 'reports'
  | 'settings'
  | 'backup';

interface SidebarNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  language: Language;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onSelectTab,
  language
}) => {
  const t = translations[language];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'employees', label: t.employees, icon: Users },
    { id: 'attendance', label: t.attendance, icon: CalendarCheck },
    { id: 'devices', label: t.fingerprintMachine, icon: Fingerprint },
    { id: 'leave', label: t.leave, icon: CalendarOff },
    { id: 'incentives', label: 'Incentives', icon: Award },
    { id: 'payroll', label: t.payroll, icon: Calculator },
    { id: 'salary-sheet', label: t.salarySheet, icon: TableProperties },
    { id: 'payslips', label: t.payslips, icon: Printer },
    { id: 'epf-etf', label: t.epfEtf, icon: Landmark },
    { id: 'allowance-rules', label: t.allowanceRules, icon: Sliders },
    { id: 'reports', label: t.reports, icon: FileBarChart },
    { id: 'settings', label: t.settings, icon: Settings },
    { id: 'backup', label: t.backupRestore, icon: Database }
  ];

  return (
    <aside
      id="app-sidebar-nav"
      className="no-print w-60 bg-white border-r border-[#d1d5db] flex flex-col justify-between shrink-0 select-none overflow-y-auto font-sans"
    >
      <div className="p-3 space-y-1">
        <div className="text-[10px] font-bold text-[#6b7280] uppercase px-2 mb-2 tracking-wider">
          Main Menu
        </div>

        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onSelectTab(item.id as ActiveTab)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#eff6ff] text-[#005a9e] font-semibold border border-blue-200/80 shadow-xs'
                  : 'text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827]'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-[#005a9e]' : 'text-[#6b7280]'
                }`}
              />
              <span className="truncate text-left">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Sri Lankan Compliance info badge */}
      <div className="p-3 border border-[#e5e7eb] bg-[#f9fafb] m-3 rounded-lg text-[11px] text-[#4b5563] space-y-1 shadow-xs">
        <div className="font-semibold text-[#111827] flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Sri Lankan Labour Rules
        </div>
        <div className="text-[10px] text-[#6b7280] leading-tight">
          EPF Emp 8% • Emplr 12% • ETF 3% • 25 Working Days Divisor
        </div>
      </div>
    </aside>
  );
};
