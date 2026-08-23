import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Clock,
  HardDrive,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { AuditLog, Language } from '../../types';
import { translations } from '../../i18n/translations';
import { DatabaseService } from '../../services/db';

interface BackupRestoreViewProps {
  language: Language;
  auditLogs: AuditLog[];
  onRefreshAllData: () => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  language,
  auditLogs,
  onRefreshAllData
}) => {
  const t = translations[language];

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const handleBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const backupJson = DatabaseService.backupDatabase();
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.href = url;
      link.download = `LankaHR_Backup_${timestamp}.db`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsBackingUp(false);
      alert('Local database backup file downloaded successfully!');
      onRefreshAllData();
    }, 400);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        'WARNING: Restoring a database file will overwrite current records in the application. Do you wish to continue?'
      )
    ) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const json = event.target?.result as string;
        const res = DatabaseService.restoreDatabase(json);
        if (res.success) {
          setRestoreMessage('Database successfully restored from backup file.');
          onRefreshAllData();
        } else {
          setRestoreMessage('Restore failed: ' + res.message);
        }
      } catch (err: any) {
        setRestoreMessage('Failed to parse backup file: ' + err.message);
      } finally {
        setIsRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleResetSampleData = () => {
    if (
      confirm(
        'Are you sure you want to reload the initial Sri Lankan demonstration dataset? Any custom additions will be refreshed.'
      )
    ) {
      localStorage.clear();
      onRefreshAllData();
      alert('Sample dataset loaded!');
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <Database className="w-5 h-5 text-[#005a9e]" />
            {t.backupRestore}
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Safeguard employee records, attendance punches, and salary calculations with 1-click database file backups.
          </p>
        </div>

        <button
          onClick={handleResetSampleData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f9fafb] text-[#374151] rounded-lg text-xs font-semibold border border-[#d1d5db] transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reload Demo Dataset
        </button>
      </div>

      {restoreMessage && (
        <div className="p-3.5 rounded-xl border bg-blue-50 border-blue-200 text-blue-900 flex items-center gap-2 text-xs shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#005a9e]" />
          <span>{restoreMessage}</span>
        </div>
      )}

      {/* Main Backup & Restore Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-[#005a9e] rounded-xl border border-blue-200">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">{t.backupDatabase}</h2>
              <p className="text-xs text-[#6b7280]">Save complete state to a standalone `.db` file</p>
            </div>
          </div>

          <p className="text-xs text-[#4b5563] leading-relaxed bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
            Exports all employee master profiles, department structures, raw biometric punch logs, attendance corrections, and calculated monthly salary sheets into an encrypted backup archive.
          </p>

          <button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#005a9e] hover:bg-[#004880] disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isBackingUp ? 'Generating Backup...' : t.backupDatabase}
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">{t.restoreDatabase}</h2>
              <p className="text-xs text-[#6b7280]">Restore application state from a `.db` backup file</p>
            </div>
          </div>

          <p className="text-xs text-[#4b5563] leading-relaxed bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
            Select a previously created `.db` or `.json` backup file from your local hard disk to restore all historical attendance and payroll calculation periods.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".db,.json"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            {isRestoring ? 'Restoring Database...' : t.restoreDatabase}
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#005a9e]" />
            Application Audit Trail & Activity Logs
          </h3>
          <span className="text-xs text-[#6b7280]">{auditLogs.length} audit entries</span>
        </div>

        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="sticky top-0 bg-[#f8fafc] text-[#475569] uppercase text-[10px] tracking-wider border-b border-[#e2e8f0]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">User Role</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] font-mono text-[11px]">
              {auditLogs.slice(0, 30).map(log => (
                <tr key={log.id} className="hover:bg-[#f8fafc]">
                  <td className="py-2 px-3 text-[#6b7280]">{new Date(log.timestamp).toLocaleString('en-GB')}</td>
                  <td className="py-2 px-3 font-bold text-[#005a9e] font-sans">{log.action}</td>
                  <td className="py-2 px-3 text-emerald-700 font-sans">{log.userRole}</td>
                  <td className="py-2 px-3 font-sans text-[#374151]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
