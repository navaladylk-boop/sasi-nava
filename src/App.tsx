import React, { useState, useEffect, useCallback } from 'react';
import { WindowFrame } from './components/layout/WindowFrame';
import { SidebarNav, ActiveTab } from './components/layout/SidebarNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { EmployeeMasterView } from './components/employees/EmployeeMasterView';
import { FingerprintDeviceView } from './components/attendance/FingerprintDeviceView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { LeaveManagementView } from './components/leave/LeaveManagementView';
import { PayrollGenerationView } from './components/payroll/PayrollGenerationView';
import { SalarySheetView } from './components/payroll/SalarySheetView';
import { PayslipQuadView } from './components/payroll/PayslipQuadView';
import { EpfEtfManagementView } from './components/epf/EpfEtfManagementView';
import { AllowanceRuleEditor } from './components/rules/AllowanceRuleEditor';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { BackupRestoreView } from './components/backup/BackupRestoreView';

import { DatabaseService } from './services/db';
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
  AuditLog
} from './types';

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Admin');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentMonth, setCurrentMonth] = useState<string>('2026-01');

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
    const currentSettings = DatabaseService.getSettings();
    setSettings(currentSettings);
    setCurrentLanguage(currentSettings.defaultLanguage || 'en');
    setAllowanceRules(DatabaseService.getAllowanceRules());
    setPayrollPeriod(DatabaseService.getPayrollPeriod(currentMonth));
    setAuditLogs(DatabaseService.getAuditLogs());
  }, [currentMonth]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handler: Language Change
  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
    const updated = { ...settings, defaultLanguage: lang };
    DatabaseService.saveSettings(updated, currentUserRole);
    setSettings(updated);
  };

  // Handler: Save Employee
  const handleSaveEmployee = (emp: Partial<Employee>) => {
    DatabaseService.saveEmployee(emp, currentUserRole);
    setEmployees(DatabaseService.getEmployees());
  };

  // Handler: Delete Employee
  const handleDeleteEmployee = (id: string) => {
    DatabaseService.deleteEmployee(id, currentUserRole);
    setEmployees(DatabaseService.getEmployees());
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
    setRawPunches(DatabaseService.getRawPunches());
  };

  // Handler: Save Processed Attendance Batch
  const handleSaveAttendanceBatch = (records: ProcessedAttendance[]) => {
    DatabaseService.saveProcessedAttendanceBatch(records, currentUserRole);
    setAttendance(DatabaseService.getProcessedAttendance());
  };

  // Handler: Update Single Attendance Record (Manual Correction)
  const handleUpdateSingleAttendance = (id: string, updates: Partial<ProcessedAttendance>) => {
    DatabaseService.updateAttendanceRecord(id, updates, currentUserRole);
    setAttendance(DatabaseService.getProcessedAttendance());
  };

  // Handler: Apply Leave
  const handleApplyLeave = (leave: Omit<EmployeeLeave, 'id'>) => {
    DatabaseService.saveLeave(leave, currentUserRole);
    setLeaves(DatabaseService.getLeaves());
  };

  // Handler: Update Leave Status
  const handleUpdateLeaveStatus = (id: string, status: 'APPROVED' | 'REJECTED', approver: string) => {
    DatabaseService.updateLeaveStatus(id, status, approver, currentUserRole);
    setLeaves(DatabaseService.getLeaves());
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
        onSelectTab={setActiveTab}
        language={currentLanguage}
      />

      {/* Primary Dynamic Viewport */}
      <main className="flex-1 flex overflow-hidden bg-slate-950">
        {activeTab === 'dashboard' && (
          <DashboardView
            language={currentLanguage}
            onNavigate={setActiveTab}
            employees={employees}
            attendance={attendance}
            currentMonth={currentMonth}
            payrollPeriod={payrollPeriod}
            devices={devices}
            onTriggerDownloadPunches={() => setActiveTab('devices')}
            onTriggerGeneratePayroll={() => setActiveTab('payroll')}
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
          />
        )}

        {activeTab === 'devices' && (
          <FingerprintDeviceView
            language={currentLanguage}
            devices={devices}
            rawPunches={rawPunches}
            onSaveDevice={handleSaveDevice}
            onDeleteDevice={handleDeleteDevice}
            onPunchesDownloaded={handlePunchesDownloaded}
          />
        )}

        {activeTab === 'leave' && (
          <LeaveManagementView
            language={currentLanguage}
            employees={employees}
            leaves={leaves}
            leaveTypes={leaveTypes}
            onApplyLeave={handleApplyLeave}
            onUpdateLeaveStatus={handleUpdateLeaveStatus}
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
            onSavePayrollPeriod={handleSavePayrollPeriod}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'salary-sheet' && (
          <SalarySheetView
            language={currentLanguage}
            currentMonth={currentMonth}
            payrollPeriod={payrollPeriod}
            settings={settings}
          />
        )}

        {activeTab === 'payslips' && (
          <PayslipQuadView
            language={currentLanguage}
            currentMonth={currentMonth}
            payrollPeriod={payrollPeriod}
            settings={settings}
            employees={employees}
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
          />
        )}

        {activeTab === 'allowance-rules' && (
          <AllowanceRuleEditor
            language={currentLanguage}
            rules={allowanceRules}
            onSaveRule={handleSaveAllowanceRule}
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
            onSaveDevice={handleSaveDevice}
            onPunchesDownloaded={handlePunchesDownloaded}
            onUpdateEmployee={handleSaveEmployee}
          />
        )}

        {activeTab === 'backup' && (
          <BackupRestoreView
            language={currentLanguage}
            auditLogs={auditLogs}
            onRefreshAllData={loadAllData}
          />
        )}
      </main>
    </WindowFrame>
  );
}
