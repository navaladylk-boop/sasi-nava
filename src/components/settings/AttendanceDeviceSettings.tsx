import React, { useState, useEffect } from 'react';
import {
  Radio,
  Zap,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  Users,
  AlertTriangle,
  Link2,
  Lock
} from 'lucide-react';
import { FingerprintDevice, RawAttendancePunch, Employee, Language } from '../../types';
import { translations } from '../../i18n/translations';
import { HikvisionService, HikvisionSyncReport } from '../../services/hikvisionService';
import { HikvisionDeviceTestResult } from '../../types/electron';

interface AttendanceDeviceSettingsProps {
  language: Language;
  devices: FingerprintDevice[];
  rawPunches: RawAttendancePunch[];
  employees: Employee[];
  onSaveDevice: (device: Partial<FingerprintDevice>) => void;
  onPunchesDownloaded: (punches: RawAttendancePunch[]) => void;
  onUpdateEmployee: (emp: Partial<Employee>) => void;
}

export const AttendanceDeviceSettings: React.FC<AttendanceDeviceSettingsProps> = ({
  language,
  devices,
  rawPunches,
  employees,
  onSaveDevice,
  onPunchesDownloaded,
  onUpdateEmployee
}) => {
  const t = translations[language];

  // Find or initialize Hikvision device
  const defaultHikvision = devices.find(d => d.brand === 'Hikvision') || {
    id: 'dev-hikvision-01',
    name: 'Hikvision Attendance Device',
    brand: 'Hikvision' as const,
    model: 'DS-K1A8503MF',
    ipAddress: '192.168.1.201',
    port: 80,
    username: 'admin',
    password: '',
    communicationType: 'TCP_IP' as const,
    status: 'UNTESTED' as const,
    lastSyncTime: '',
    serialNumber: ''
  };

  const [deviceForm, setDeviceForm] = useState<FingerprintDevice>(defaultHikvision);
  const [deviceEnabled, setDeviceEnabled] = useState<boolean>(true);
  const [timeoutMs, setTimeoutMs] = useState<number>(5000);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Connection Test States
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<HikvisionDeviceTestResult | null>(null);

  // Attendance Download States
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' };
    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(d);
    return `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' };
    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(new Date());
    return `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
  });
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgressText, setDownloadProgressText] = useState<string>('');
  const [syncReport, setSyncReport] = useState<HikvisionSyncReport | null>(null);

  // Save feedback
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Helper for Sri Lanka date string (Asia/Colombo)
  const getSriLankaDateStr = (d = new Date()) => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(d);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  };

  const handlePresetDate = (preset: 'TODAY' | 'YESTERDAY' | 'CURRENT_MONTH' | 'ALL') => {
    const now = new Date();
    if (preset === 'TODAY') {
      const todayStr = getSriLankaDateStr(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'YESTERDAY') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = getSriLankaDateStr(yesterday);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === 'CURRENT_MONTH') {
      const todayStr = getSriLankaDateStr(now);
      const firstDayStr = `${todayStr.substring(0, 7)}-01`;
      setStartDate(firstDayStr);
      setEndDate(todayStr);
    } else if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Mapping state
  const [selectedUnmappedId, setSelectedUnmappedId] = useState<string>('');
  const [selectedTargetEmpId, setSelectedTargetEmpId] = useState<string>('');

  useEffect(() => {
    const existing = devices.find(d => d.brand === 'Hikvision');
    if (existing) {
      setDeviceForm(existing);
    }
  }, [devices]);

  // Test Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await HikvisionService.testConnection(deviceForm);
      setTestResult(res);
      const updatedStatus = res.success ? 'ONLINE' : 'OFFLINE';
      onSaveDevice({
        ...deviceForm,
        status: updatedStatus,
        model: res.model || deviceForm.model,
        serialNumber: res.serialNumber || deviceForm.serialNumber
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `CONNECTION FAILED: ${err.message || 'Connection error'}`,
        responseTimeMs: 0
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Save Device Settings
  const handleSaveDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceForm.ipAddress || !deviceForm.port) {
      alert('Please provide a valid IP address and Port.');
      return;
    }

    onSaveDevice({
      ...deviceForm,
      name: deviceForm.name || 'Hikvision Attendance Device',
      brand: 'Hikvision',
      model: deviceForm.model || 'DS-K1A8503MF'
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Download Attendance
  const handleDownloadAttendance = async () => {
    setIsDownloading(true);
    setSyncReport(null);
    setDownloadProgressText('Initiating Hikvision connection...');

    try {
      const report = await HikvisionService.downloadAttendance(
        deviceForm,
        rawPunches,
        employees,
        startDate,
        endDate,
        (progress) => {
          setDownloadProgressText(progress.statusText);
        }
      );
      setSyncReport(report);

      if (report.success && report.punches.length > 0) {
        onPunchesDownloaded(report.punches);
        onSaveDevice({
          ...deviceForm,
          lastSyncTime: new Date().toISOString().replace('T', ' ').substring(0, 16)
        });
      }
    } catch (err: any) {
      setSyncReport({
        success: false,
        message: `Failed to download logs: ${err.message}`,
        totalFetched: 0,
        newRecordsCount: 0,
        duplicateRecordsCount: 0,
        unmappedCount: 0,
        punches: []
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgressText('');
    }
  };

  // Unmapped Person IDs in Raw Punches
  const unmappedPersonIds = Array.from(
    new Set(rawPunches.filter(p => !p.employeeId).map(p => p.deviceUserId))
  );

  // Map unmapped Person ID to an Employee
  const handleMapEmployee = () => {
    if (!selectedUnmappedId || !selectedTargetEmpId) {
      alert('Please select both the Device Person ID and the HRM Employee to link.');
      return;
    }

    const targetEmp = employees.find(e => e.id === selectedTargetEmpId);
    if (!targetEmp) return;

    // Update employee with fingerprintUserId
    onUpdateEmployee({
      ...targetEmp,
      fingerprintUserId: selectedUnmappedId
    });

    // Re-link existing raw punches with this employee ID
    const updatedPunches = rawPunches.map(p => {
      if (p.deviceUserId === selectedUnmappedId) {
        return { ...p, employeeId: targetEmp.id };
      }
      return p;
    });
    onPunchesDownloaded(updatedPunches);

    alert(`Successfully mapped Hikvision Person ID "${selectedUnmappedId}" to ${targetEmp.employeeCode} (${targetEmp.fullName}).`);
    setSelectedUnmappedId('');
    setSelectedTargetEmpId('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          Hikvision Device configuration saved successfully!
        </div>
      )}

      {/* 1. Device Configuration Card */}
      <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#e5e7eb] pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#005a9e]" />
            <h2 className="text-sm font-bold text-[#111827]">Attendance Device Configuration</h2>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                deviceForm.status === 'ONLINE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : deviceForm.status === 'OFFLINE'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-gray-100 text-[#4b5563] border-gray-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  deviceForm.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                }`}
              ></span>
              {deviceForm.status === 'ONLINE'
                ? 'CONNECTED'
                : deviceForm.status === 'OFFLINE'
                ? 'CONNECTION FAILED / OFFLINE'
                : 'UNTESTED'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveDevice} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">Device Name *</label>
              <input
                type="text"
                required
                value={deviceForm.name}
                onChange={e => setDeviceForm({ ...deviceForm, name: e.target.value })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">Brand *</label>
              <input
                type="text"
                readOnly
                value="Hikvision"
                className="w-full bg-[#f8fafc] border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-semibold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">Model *</label>
              <input
                type="text"
                required
                value={deviceForm.model}
                onChange={e => setDeviceForm({ ...deviceForm, model: e.target.value })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">IP Address *</label>
              <input
                type="text"
                required
                placeholder="192.168.1.201"
                value={deviceForm.ipAddress}
                onChange={e => setDeviceForm({ ...deviceForm, ipAddress: e.target.value })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 font-mono text-[#111827] font-bold focus:border-[#005a9e] focus:outline-none"
              />
              <span className="text-[10px] text-[#6b7280]">Default: 192.168.1.201</span>
            </div>

            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">Port *</label>
              <input
                type="number"
                required
                min="1"
                max="65535"
                value={deviceForm.port}
                onChange={e => setDeviceForm({ ...deviceForm, port: Number(e.target.value) })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 font-mono text-[#111827] font-bold focus:border-[#005a9e] focus:outline-none"
              />
              <span className="text-[10px] text-[#6b7280]">Default: Port 80 (or 8000)</span>
            </div>

            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">Username *</label>
              <input
                type="text"
                required
                placeholder="admin"
                value={deviceForm.username || 'admin'}
                onChange={e => setDeviceForm({ ...deviceForm, username: e.target.value })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#4b5563] mb-1 font-medium flex items-center justify-between">
                <span>Device Password *</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-[#005a9e] hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={deviceForm.password || ''}
                onChange={e => setDeviceForm({ ...deviceForm, password: e.target.value })}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
              />
              <span className="text-[10px] text-[#6b7280]">Entered by admin. Stored locally.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[#4b5563] mb-1 font-medium">Connection Timeout (ms)</label>
              <input
                type="number"
                min="1000"
                max="30000"
                step="500"
                value={timeoutMs}
                onChange={e => setTimeoutMs(Number(e.target.value))}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
              />
              <span className="text-[10px] text-[#6b7280]">Default: 5000 ms</span>
            </div>

            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deviceEnabled}
                  onChange={e => setDeviceEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#005a9e] rounded border-[#d1d5db]"
                />
                <span className="font-semibold text-[#111827]">Device Enabled</span>
              </label>
            </div>
          </div>

          {/* Action Buttons: Test Connection & Save */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e5e7eb]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="test-connection-btn"
                disabled={isTesting}
                onClick={handleTestConnection}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#f9fafb] border border-[#d1d5db] text-[#374151] rounded-lg font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 text-amber-600 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Testing Hardware...' : 'TEST CONNECTION'}
              </button>
            </div>

            <button
              type="submit"
              id="save-device-btn"
              className="flex items-center gap-2 px-6 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              SAVE CONFIGURATION
            </button>
          </div>
        </form>

        {/* Real Test Connection Diagnostic Box */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-xs shadow-xs ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold text-sm">
                {testResult.success ? 'CONNECTED' : 'CONNECTION FAILED'}
              </div>
              <div className="text-xs opacity-95">{testResult.message}</div>
              {testResult.success && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-[11px] font-mono bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                  <div>
                    <span className="text-[#64748b] block text-[10px]">MODEL</span>
                    <span className="font-bold text-[#111827]">{testResult.model || deviceForm.model}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[10px]">SERIAL NUMBER</span>
                    <span className="font-bold text-[#111827]">{testResult.serialNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[10px]">FIRMWARE</span>
                    <span className="font-bold text-[#111827]">{testResult.firmwareVersion || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[10px]">LATENCY</span>
                    <span className="font-bold text-emerald-700">{testResult.responseTimeMs} ms</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Attendance Download Section */}
      <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#e5e7eb] pb-3">
          <div className="flex items-center gap-2">
            <DownloadCloud className="w-5 h-5 text-[#005a9e]" />
            <h2 className="text-sm font-bold text-[#111827]">Download Attendance Records</h2>
          </div>
          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#64748b] font-medium mr-1 text-[11px]">Presets:</span>
            <button
              type="button"
              onClick={() => handlePresetDate('TODAY')}
              className="px-2 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] rounded font-medium border border-[#cbd5e1] text-[11px] cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePresetDate('YESTERDAY')}
              className="px-2 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] rounded font-medium border border-[#cbd5e1] text-[11px] cursor-pointer"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handlePresetDate('CURRENT_MONTH')}
              className="px-2 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] rounded font-medium border border-[#cbd5e1] text-[11px] cursor-pointer"
            >
              Current Month
            </button>
            <button
              type="button"
              onClick={() => handlePresetDate('ALL')}
              className="px-2 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] rounded font-medium border border-[#cbd5e1] text-[11px] cursor-pointer"
            >
              All Available Records
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs items-end">
          <div>
            <label className="block text-[#4b5563] mb-1 font-medium">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#4b5563] mb-1 font-medium">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
            />
          </div>

          <div>
            <button
              type="button"
              id="download-attendance-btn"
              disabled={isDownloading}
              onClick={handleDownloadAttendance}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <DownloadCloud className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
              {isDownloading ? 'Downloading Logs...' : 'DOWNLOAD ATTENDANCE'}
            </button>
          </div>
        </div>

        {/* Live Progress Banner */}
        {isDownloading && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-xs text-blue-900 animate-pulse">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            <div className="whitespace-pre-line font-medium">
              {downloadProgressText || 'Downloading Hikvision attendance...'}
            </div>
          </div>
        )}

        {/* Sync Metric Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase font-bold">Last Sync</span>
            <span className="font-mono font-semibold text-[#111827]">
              {deviceForm.lastSyncTime || 'Not yet synced'}
            </span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase font-bold">New Records</span>
            <span className="font-mono font-bold text-emerald-700 text-sm">
              {syncReport ? syncReport.newRecordsCount : 0}
            </span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase font-bold">Duplicate Records</span>
            <span className="font-mono font-bold text-blue-700 text-sm">
              {syncReport ? syncReport.duplicateRecordsCount : 0}
            </span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase font-bold">Failed / Unmapped</span>
            <span className="font-mono font-bold text-amber-700 text-sm">
              {syncReport ? syncReport.unmappedCount : 0}
            </span>
          </div>
        </div>

        {syncReport && (
          <div
            className={`p-4 rounded-lg border text-xs whitespace-pre-line font-mono ${
              syncReport.success
                ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            {syncReport.message}
          </div>
        )}
      </div>

      {/* 3. Employee ID Mapping & Unmapped Person Resolution */}
      <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#e5e7eb] pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#005a9e]" />
            <h2 className="text-sm font-bold text-[#111827]">Hikvision Person ID ↔ HRM Employee Mapping</h2>
          </div>
          {unmappedPersonIds.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              {unmappedPersonIds.length} Unknown Person ID(s) detected
            </span>
          )}
        </div>

        {/* Unmapped Resolution Tool */}
        {unmappedPersonIds.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Resolve Unknown Employee Attendance Punches:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs items-end">
              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Unknown Device Person ID</label>
                <select
                  value={selectedUnmappedId}
                  onChange={e => setSelectedUnmappedId(e.target.value)}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono font-bold focus:border-[#005a9e] focus:outline-none"
                >
                  <option value="">-- Select Person ID --</option>
                  {unmappedPersonIds.map(pid => (
                    <option key={pid} value={pid}>
                      Person ID: {pid} (Unknown)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Map to HRM Employee</label>
                <select
                  value={selectedTargetEmpId}
                  onChange={e => setSelectedTargetEmpId(e.target.value)}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeCode} - {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleMapEmployee}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Link2 className="w-4 h-4" />
                  LINK & ASSIGN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Mapping Table */}
        <div className="overflow-x-auto max-h-60 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#f8fafc] text-[#475569] uppercase text-[10px] tracking-wider border-b border-[#e2e8f0]">
              <tr>
                <th className="py-2.5 px-3">Hikvision Person ID</th>
                <th className="py-2.5 px-3">HRM Employee Code</th>
                <th className="py-2.5 px-3">Employee Full Name</th>
                <th className="py-2.5 px-3">EPF Number</th>
                <th className="py-2.5 px-3">Mapping Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] font-mono">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-[#f8fafc]">
                  <td className="py-2 px-3 font-bold text-[#005a9e]">
                    {emp.fingerprintUserId || emp.employeeCode.replace('EMP-', '')}
                  </td>
                  <td className="py-2 px-3 text-[#111827] font-semibold">{emp.employeeCode}</td>
                  <td className="py-2 px-3 font-sans text-[#374151]">{emp.fullName}</td>
                  <td className="py-2 px-3 text-[#64748b]">{emp.epfNumber}</td>
                  <td className="py-2 px-3 font-sans">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      MAPPED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
