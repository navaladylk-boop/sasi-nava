import React, { useState, useEffect, useCallback } from 'react';
import { WindowFrame } from './components/layout/WindowFrame';
import { SidebarNav, ActiveTab } from './components/layout/SidebarNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { EmployeeMasterView } from './components/employees/EmployeeMasterView';
import { AttendanceDeviceSettings } from './components/settings/AttendanceDeviceSettings';
import { AttendanceView } from './components/attendance/AttendanceView';
import { LeaveManagementView } from './components/leave/LeaveManagementView';
import { IncentivesView } from './components/payroll/IncentivesView';
import { PayrollGenerationView } from './components/payroll/PayrollGenerationView';
import { SalarySheetView } from './components/payroll/SalarySheetView';
import { PayslipQuadView } from './components/payroll/PayslipQuadView';
import { EpfEtfManagementView } from './components/epf/EpfEtfManagementView';
import { AllowanceRuleEditor } from './components/rules/AllowanceRuleEditor';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { BackupRestoreView } from './components/backup/BackupRestoreView';

import { DatabaseService } from './services/db';
import { AttendanceProcessor } from './services/attendanceProcessor';
import {
  Language,
  UserRole,
  Employee,
  Department,
  Designation,
  PayrollCategory,
  FingerprintDevice,
  RawAttendancePunch,
  ProcessedAttendance,
  EmployeeLeave,
  LeaveType,
  CompanySettings,
  AllowanceDeductionRule,
  PayrollPeriod,
  AuditLog,
  IncentiveRecord
} from './types';

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Admin');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [navHistory, setNavHistory] = useState<ActiveTab[]>(['dashboard']);
  const [currentMonth, setCurrentMonth] = useState<string>('2026-01');

  const navigateTo = useCallback((tab: ActiveTab) => {
    if (tab === activeTab) return;
    if (tab === 'dashboard') {
      setNavHistory(['dashboard']);
      setActiveTab('dashboard');
    } else {
      setNavHistory(prev => [...prev.filter(t => t !== tab), activeTab]);
      setActiveTab(tab);
    }
  }, [activeTab]);

  const goBack = useCallback(() => {
    if (navHistory.length > 1) {
      const newHistory = [...navHistory];
      const previousTab = newHistory.pop()!;
      setNavHistory(newHistory);
      setActiveTab(previousTab);
    } else {
      setActiveTab('dashboard');
      setNavHistory(['dashboard']);
    }
  }, [navHistory]);

  // Global ESC handler preventing app exit and handling back / modal close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();

        // Check if any modal is open
        const openModal = document.querySelector('[role="dialog"], .fixed.inset-0.z-50, .modal-backdrop');
        if (openModal) {
          const closeEvent = new CustomEvent('app-close-modal');
          window.dispatchEvent(closeEvent);
          return;
        }

        // If not on dashboard, go back
        if (activeTab !== 'dashboard') {
          goBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [activeTab, goBack]);

  // Database States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [payrollCategories, setPayrollCategories] = useState<PayrollCategory[]>([]);
  const [devices, setDevices] = useState<FingerprintDevice[]>([]);
  const [rawPunches, setRawPunches] = useState<RawAttendancePunch[]>([]);
  const [attendance, setAttendance] = useState<ProcessedAttendance[]>([]);
  const [leaves, setLeaves] = useState<EmployeeLeave[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [incentives, setIncentives] = useState<IncentiveRecord[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DatabaseService.getSettings());
  const [allowanceRules, setAllowanceRules] = useState<AllowanceDeductionRule[]>([]);
  const [payrollPeriod, setPayrollPeriod] = useState<PayrollPeriod | undefined>(undefined);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Refresh all state from local database
  const loadAllData = useCallback(() => {
    setEmployees(DatabaseService.getEmployees());
    setDepartments(DatabaseService.getDepartments());
    setDesignations(DatabaseService.getDesignations());
    setPayrollCategories(DatabaseService.getPayrollCategories());
    setDevices(DatabaseService.getDevices());
    setRawPunches(DatabaseService.getRawPunches());
    setAttendance(DatabaseService.getProcessedAttendance());
    setLeaves(DatabaseService.getLeaves());
    setLeaveTypes(DatabaseService.getLeaveTypes());
    setIncentives(DatabaseService.getIncentives());
    const currentSettings = DatabaseService.getSettings();
    setSettings(currentSettings);
    setCurrentLanguage(currentSettings.defaultLanguage || 'en');
    setAllowanceRules(DatabaseService.getAllowanceRules());
    setPayrollPeriod(DatabaseService.getPayrollPeriod(currentMonth));
    setAuditLogs(DatabaseService.getAuditLogs());
  }, [currentMonth]);

  useEffect(() => {
    DatabaseService.initialize().then(() => {
      loadAllData();
    });
  }, [loadAllData]);

  // Handler: Language Change
  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
    const updated = { ...settings, defaultLanguage: lang };
    DatabaseService.saveSettings(updated, currentUserRole);
    setSettings(updated);
  };

  // Handler: Save Employee
  const handleSaveEmployee = async (emp: Partial<Employee>): Promise<Employee> => {
    const saved = await DatabaseService.saveEmployee(emp, currentUserRole);
    setEmployees([...DatabaseService.getEmployees()]);
    return saved;
  };

  // Handler: Delete Employee
  const handleDeleteEmployee = async (id: string): Promise<void> => {
    await DatabaseService.deleteEmployee(id, currentUserRole);
    setEmployees([...DatabaseService.getEmployees()]);
  };

  // Handler: Save Biometric Device
  const handleSaveDevice = (device: Partial<FingerprintDevice>) => {
    DatabaseService.saveDevice(device, currentUserRole);
    setDevices(DatabaseService.getDevices());
  };

  // Handler: Delete Device
  const handleDeleteDevice = (id: string) => {
    DatabaseService.deleteDevice(id, currentUserRole);
    setDevices(DatabaseService.getDevices());
  };

  // Handler: Punches Downloaded from Biometric Device
  const handlePunchesDownloaded = (punches: RawAttendancePunch[]) => {
    DatabaseService.saveRawPunches(punches, currentUserRole);
    const updatedRawPunches = DatabaseService.getRawPunches();
    setRawPunches(updatedRawPunches);

    // Auto-process attendance for all distinct months present in downloaded punches
    const affectedMonths = Array.from(new Set(punches.map(p => p.punchDate ? p.punchDate.substring(0, 7) : ''))).filter(Boolean);
    if (affectedMonths.length > 0) {
      let currentAtt = DatabaseService.getProcessedAttendance();
      affectedMonths.forEach(m => {
        const result = AttendanceProcessor.processMonthAttendance(
          m,
          employees,
          updatedRawPunches,
          leaves,
          currentAtt,
          settings
        );
        DatabaseService.saveProcessedAttendanceBatch(result.records, currentUserRole);
        currentAtt = DatabaseService.getProcessedAttendance();
      });
      setAttendance(currentAtt);
    }
  };

  // Handler: Save Processed Attendance Batch
  const handleSaveAttendanceBatch = (records: ProcessedAttendance[]) => {
    DatabaseService.saveProcessedAttendanceBatch(records, currentUserRole);
    setAttendance(DatabaseService.getProcessedAttendance());
  };

  // Handler: Update Single Attendance Record (Manual Correction)
  const handleUpdateSingleAttendance = (id: string, updates: Partial<ProcessedAttendance>) => {
    DatabaseService.saveManualAttendance({ id, ...updates }, currentUserRole);
    setAttendance(DatabaseService.getProcessedAttendance());
  };

  // Handler: Save Leave
  const handleSaveLeave = async (leave: Omit<EmployeeLeave, 'id'> | EmployeeLeave) => {
    await DatabaseService.saveLeave(leave, currentUserRole);
    setLeaves([...DatabaseService.getLeaves()]);
  };

  // Handler: Delete Leave
  const handleDeleteLeave = async (id: string) => {
    await DatabaseService.deleteLeave(id, currentUserRole);
    setLeaves([...DatabaseService.getLeaves()]);
  };

  // Handler: Update Leave Status
  const handleUpdateLeaveStatus = (id: string, status: 'APPROVED' | 'PENDING' | 'REJECTED', approver: string) => {
    DatabaseService.updateLeaveStatus(id, status, approver, currentUserRole);
    setLeaves(DatabaseService.getLeaves());
  };

  // Handler: Save Incentive
  const handleSaveIncentive = (incentive: Partial<IncentiveRecord>) => {
    DatabaseService.saveIncentive(incentive, currentUserRole);
    setIncentives(DatabaseService.getIncentives());
  };

  // Handler: Delete Incentive
  const handleDeleteIncentive = (id: string) => {
    DatabaseService.deleteIncentive(id, currentUserRole);
    setIncentives(DatabaseService.getIncentives());
  };

  // Handler: Save Allowance Rule
  const handleSaveAllowanceRule = (rule: AllowanceDeductionRule) => {
    DatabaseService.saveAllowanceRule(rule, currentUserRole);
    setAllowanceRules(DatabaseService.getAllowanceRules());
  };

  // Handler: Save Payroll Period
  const handleSavePayrollPeriod = (period: PayrollPeriod) => {
    DatabaseService.savePayrollPeriod(period, currentUserRole);
    setPayrollPeriod(DatabaseService.getPayrollPeriod(currentMonth));
  };

  // Handler: Save Settings
  const handleSaveSettings = (newSettings: CompanySettings) => {
    DatabaseService.saveSettings(newSettings, currentUserRole);
    setSettings(newSettings);
  };

  // Handler: Save Department
  const handleSaveDepartment = (dept: Partial<Department>) => {
    DatabaseService.saveDepartment(dept, currentUserRole);
    setDepartments(DatabaseService.getDepartments());
  };

  // Handler: Delete Department
  const handleDeleteDepartment = (id: string): { success: boolean; message?: string } => {
    const res = DatabaseService.deleteDepartment(id, currentUserRole);
    if (res.success) {
      setDepartments(DatabaseService.getDepartments());
    }
    return res;
  };

  // Handler: Save Designation
  const handleSaveDesignation = (desig: Partial<Designation>) => {
    DatabaseService.saveDesignation(desig, currentUserRole);
    setDesignations(DatabaseService.getDesignations());
  };

  // Handler: Delete Designation
  const handleDeleteDesignation = (id: string): { success: boolean; message?: string } => {
    const res = DatabaseService.deleteDesignation(id, currentUserRole);
    if (res.success) {
      setDesignations(DatabaseService.getDesignations());
    }
    return res;
  };

  // Handler: Save Payroll Category
  const handleSavePayrollCategory = (cat: Partial<PayrollCategory>) => {
    DatabaseService.savePayrollCategory(cat, currentUserRole);
    setPayrollCategories(DatabaseService.getPayrollCategories());
  };

  // Handler: Delete Payroll Category
  const handleDeletePayrollCategory = (id: string): { success: boolean; message?: string } => {
    const res = DatabaseService.deletePayrollCategory(id, currentUserRole);
    if (res.success) {
      setPayrollCategories(DatabaseService.getPayrollCategories());
    }
    return res;
  };

  // Handler: Batch Import Hikvision Employees
  const handleBatchImportEmployees = async (items: {
    hikvisionPersonId: string;
    name?: string;
    action: 'CREATE_NEW' | 'UPDATE_MAPPING' | 'SKIP';
    targetEmployeeId?: string;
  }[]) => {
    const result = await DatabaseService.importHikvisionUsers(items, currentUserRole);
    setEmployees([...DatabaseService.getEmployees()]);
    setRawPunches([...DatabaseService.getRawPunches()]);
    setAttendance([...DatabaseService.getProcessedAttendance()]);
    return result;
  };

  return (
    <WindowFrame
      currentLanguage={currentLanguage}
      onLanguageChange={handleLanguageChange}
      currentUserRole={currentUserRole}
      onUserRoleChange={setCurrentUserRole}
      companyName={settings.companyName}
    >
      {/* Sidebar Navigation */}
      <SidebarNav
        activeTab={activeTab}
        onSelectTab={navigateTo}
        language={currentLanguage}
      />

      {/* Primary Dynamic Viewport */}
      <main className="flex-1 flex overflow-hidden bg-slate-950">
        {activeTab === 'dashboard' && (
          <DashboardView
            language={currentLanguage}
            onNavigate={navigateTo}
            employees={employees}
            attendance={attendance}
            currentMonth={currentMonth}
            payrollPeriod={payrollPeriod}
            devices={devices}
            onTriggerDownloadPunches={() => navigateTo('devices')}
            onTriggerGeneratePayroll={() => navigateTo('payroll')}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeMasterView
            language={currentLanguage}
            employees={employees}
            departments={departments}
            designations={designations}
            payrollCategories={payrollCategories}
            onSaveEmployee={handleSaveEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onBack={goBack}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceView
            language={currentLanguage}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            employees={employees}
            attendance={attendance}
            rawPunches={rawPunches}
            leaves={leaves}
            settings={settings}
            onSaveAttendanceBatch={handleSaveAttendanceBatch}
            onUpdateSingleAttendance={handleUpdateSingleAttendance}
            onBack={goBack}
          />
        )}

        {activeTab === 'devices' && (
          <AttendanceDeviceSettings
            language={currentLanguage}
            devices={devices}
            rawPunches={rawPunches}
            employees={employees}
            onSaveDevice={handleSaveDevice}
            onPunchesDownloaded={handlePunchesDownloaded}
            onUpdateEmployee={handleSaveEmployee}
            onBack={goBack}
          />
        )}

        {activeTab === 'leave' && (
          <LeaveManagementView
            language={currentLanguage}
            employees={employees}
            leaves={leaves}
            leaveTypes={leaveTypes}
            payrollPeriods={DatabaseService.getState().payrollPeriods || []}
            onSaveLeave={handleSaveLeave}
            onDeleteLeave={handleDeleteLeave}
            onUpdateLeaveStatus={handleUpdateLeaveStatus}
            onBack={goBack}
          />
        )}

        {activeTab === 'incentives' && (
          <IncentivesView
            language={currentLanguage}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            employees={employees}
            incentives={incentives}
            onSaveIncentive={handleSaveIncentive}
            onDeleteIncentive={handleDeleteIncentive}
            onBack={goBack}
          />
        )}

        {activeTab === 'payroll' && (
          <PayrollGenerationView
            language={currentLanguage}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            employees={employees}
            attendance={attendance}
            payrollPeriod={payrollPeriod}
            settings={settings}
            allowanceRules={allowanceRules}
            departments={departments}
            designations={designations}
            leaves={leaves}
            incentives={incentives}
            payrollCategories={payrollCategories}
            onSavePayrollPeriod={handleSavePayrollPeriod}
            onNavigate={navigateTo}
            onBack={goBack}
          />
        )}

        {activeTab === 'salary-sheet' && (
          <SalarySheetView
            language={currentLanguage}
            currentMonth={currentMonth}
            payrollPeriod={payrollPeriod}
            settings={settings}
            onBack={goBack}
          />
        )}

        {activeTab === 'payslips' && (
          <PayslipQuadView
            language={currentLanguage}
            currentMonth={currentMonth}
            payrollPeriod={payrollPeriod}
            settings={settings}
            employees={employees}
            onBack={goBack}
          />
        )}

        {activeTab === 'epf-etf' && (
          <EpfEtfManagementView
            language={currentLanguage}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            payrollPeriod={payrollPeriod}
            settings={settings}
            employees={employees}
            onSavePayrollPeriod={handleSavePayrollPeriod}
            onBack={goBack}
          />
        )}

        {activeTab === 'allowance-rules' && (
          <AllowanceRuleEditor
            language={currentLanguage}
            rules={allowanceRules}
            onSaveRule={handleSaveAllowanceRule}
            onBack={goBack}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            language={currentLanguage}
            currentMonth={currentMonth}
            employees={employees}
            attendance={attendance}
            payrollPeriod={payrollPeriod}
            departments={departments}
            settings={settings}
            onBack={goBack}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            language={currentLanguage}
            onLanguageChange={handleLanguageChange}
            currentUserRole={currentUserRole}
            onUserRoleChange={setCurrentUserRole}
            settings={settings}
            onSaveSettings={handleSaveSettings}
            devices={devices}
            rawPunches={rawPunches}
            employees={employees}
            departments={departments}
            designations={designations}
            payrollCategories={payrollCategories}
            allowanceRules={allowanceRules}
            onSaveDepartment={handleSaveDepartment}
            onDeleteDepartment={handleDeleteDepartment}
            onSaveDesignation={handleSaveDesignation}
            onDeleteDesignation={handleDeleteDesignation}
            onSavePayrollCategory={handleSavePayrollCategory}
            onDeletePayrollCategory={handleDeletePayrollCategory}
            onSaveDevice={handleSaveDevice}
            onPunchesDownloaded={handlePunchesDownloaded}
            onUpdateEmployee={handleSaveEmployee}
            onBatchImportEmployees={handleBatchImportEmployees}
            onBack={goBack}
          />
        )}

        {activeTab === 'backup' && (
          <BackupRestoreView
            language={currentLanguage}
            auditLogs={auditLogs}
            currentUserRole={currentUserRole}
            onRefreshAllData={loadAllData}
            onBack={goBack}
          />
        )}
      </main>
    </WindowFrame>
  );
}
