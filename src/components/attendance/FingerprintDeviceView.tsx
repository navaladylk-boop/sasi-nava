import React, { useState } from 'react';
import {
  Fingerprint,
  Plus,
  Radio,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  HardDrive,
  Trash2,
  Edit2,
  Server,
  Zap
} from 'lucide-react';
import { FingerprintDevice, RawAttendancePunch, Language } from '../../types';
import { translations } from '../../i18n/translations';
import { BiometricDeviceFactory, DeviceConnectionResult, DeviceDownloadResult } from '../../services/deviceAdapter';

interface FingerprintDeviceViewProps {
  language: Language;
  devices: FingerprintDevice[];
  rawPunches: RawAttendancePunch[];
  onSaveDevice: (device: Partial<FingerprintDevice>) => void;
  onDeleteDevice: (id: string) => void;
  onPunchesDownloaded: (punches: RawAttendancePunch[]) => void;
}

export const FingerprintDeviceView: React.FC<FingerprintDeviceViewProps> = ({
  language,
  devices,
  rawPunches,
  onSaveDevice,
  onDeleteDevice,
  onPunchesDownloaded
}) => {
  const t = translations[language];

  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ deviceId: string; result: DeviceConnectionResult } | null>(null);
  const [downloadingDeviceId, setDownloadingDeviceId] = useState<string | null>(null);
  const [downloadResult, setDownloadResult] = useState<{ message: string; count: number } | null>(null);
  const [syncingDeviceId, setSyncingDeviceId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDevice, setEditingDevice] = useState<Partial<FingerprintDevice> | null>(null);

  const handleOpenAddModal = () => {
    setEditingDevice({
      name: 'Main Entrance Device',
      brand: 'ZKTeco',
      model: 'iClock 880',
      ipAddress: '192.168.1.201',
      port: 4370,
      communicationType: 'TCP_IP',
      status: 'UNTESTED'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dev: FingerprintDevice) => {
    setEditingDevice({ ...dev });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice || !editingDevice.name || !editingDevice.ipAddress) {
      alert('Please provide Device Name and IP Address.');
      return;
    }
    onSaveDevice(editingDevice);
    setIsModalOpen(false);
    setEditingDevice(null);
  };

  const handleTestConnection = async (device: FingerprintDevice) => {
    setTestingDeviceId(device.id);
    setTestResult(null);
    try {
      const adapter = BiometricDeviceFactory.getAdapter(device.brand);
      const res = await adapter.testConnection(device);
      setTestResult({ deviceId: device.id, result: res });
      onSaveDevice({ ...device, status: res.success ? 'ONLINE' : 'OFFLINE' });
    } catch (err: any) {
      setTestResult({
        deviceId: device.id,
        result: { success: false, message: err.message || 'Connection timeout', responseTimeMs: 0 }
      });
    } finally {
      setTestingDeviceId(null);
    }
  };

  const handleDownloadAttendance = async (device: FingerprintDevice) => {
    setDownloadingDeviceId(device.id);
    setDownloadResult(null);
    try {
      const adapter = BiometricDeviceFactory.getAdapter(device.brand);
      const res: DeviceDownloadResult = await adapter.downloadAttendance(device);
      if (res.success && res.punches.length > 0) {
        onPunchesDownloaded(res.punches);
      }
      setDownloadResult({ message: res.message, count: res.count });
      onSaveDevice({ ...device, lastSyncTime: new Date().toLocaleString() });
    } catch (err: any) {
      setDownloadResult({ message: 'Error downloading punch logs: ' + err.message, count: 0 });
    } finally {
      setDownloadingDeviceId(null);
    }
  };

  const handleSyncTime = async (device: FingerprintDevice) => {
    setSyncingDeviceId(device.id);
    setSyncMessage(null);
    try {
      const adapter = BiometricDeviceFactory.getAdapter(device.brand);
      const res = await adapter.syncDeviceTime(device);
      setSyncMessage(res.message);
    } catch (err: any) {
      setSyncMessage('Failed to sync time: ' + err.message);
    } finally {
      setSyncingDeviceId(null);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-[#005a9e]" />
            {t.deviceConfig}
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Connect TCP/IP Biometric Machines (ZKTeco, Hikvision, Suprema) to download attendance logs.
          </p>
        </div>

        <button
          id="add-device-btn"
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.addNewDevice}
        </button>
      </div>

      {/* Quick Status Message Bar if test or download occurred */}
      {testResult && (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs shadow-xs ${
            testResult.result.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {testResult.result.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold">
              {testResult.result.success ? t.connectionSuccess : t.connectionFailed}
            </div>
            <div className="text-[11px] opacity-90 mt-0.5">{testResult.result.message}</div>
            {testResult.result.firmwareVersion && (
              <div className="text-[10px] font-mono mt-1 opacity-75">
                Firmware: {testResult.result.firmwareVersion} | Serial: {testResult.result.serialNumber} | Latency: {testResult.result.responseTimeMs}ms
              </div>
            )}
          </div>
        </div>
      )}

      {downloadResult && (
        <div className="p-3.5 rounded-xl border bg-blue-50 border-blue-200 text-blue-900 flex items-start gap-3 text-xs shadow-xs">
          <DownloadCloud className="w-4 h-4 text-[#005a9e] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">{t.downloadComplete}</div>
            <div className="text-[11px] mt-0.5">{downloadResult.message}</div>
          </div>
        </div>
      )}

      {syncMessage && (
        <div className="p-3 rounded-xl border bg-white border-[#d1d5db] text-[#111827] flex items-center gap-2 text-xs shadow-xs">
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Registered Devices Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map(device => {
          const isTesting = testingDeviceId === device.id;
          const isDownloading = downloadingDeviceId === device.id;
          const isSyncing = syncingDeviceId === device.id;

          return (
            <div
              key={device.id}
              className="bg-white border border-[#d1d5db] rounded-xl p-4 shadow-xs space-y-4 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                    <Radio className="w-5 h-5 text-[#005a9e]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#111827]">{device.name}</h3>
                    <div className="text-xs text-[#6b7280]">
                      {device.brand} ({device.model})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      device.status === 'ONLINE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : device.status === 'OFFLINE'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-gray-100 text-[#4b5563] border-gray-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        device.status === 'ONLINE' ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'
                      }`}
                    ></span>
                    {device.status === 'ONLINE' ? t.online : device.status === 'OFFLINE' ? t.offline : t.untested}
                  </span>

                  <button
                    onClick={() => handleOpenEditModal(device)}
                    title="Edit Configuration"
                    className="p-1.5 text-[#6b7280] hover:text-[#005a9e] rounded hover:bg-[#eff6ff] transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove device ${device.name}?`)) onDeleteDevice(device.id);
                    }}
                    title="Delete Device"
                    className="p-1.5 text-[#6b7280] hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* IP / Port Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] font-mono">
                <div>
                  <span className="text-[#64748b] block text-[10px]">IP ADDRESS</span>
                  <span className="text-[#111827] font-semibold">{device.ipAddress}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[10px]">PORT</span>
                  <span className="text-[#111827] font-semibold">{device.port}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[10px]">PROTOCOL</span>
                  <span className="text-[#111827]">{device.communicationType}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[10px]">LAST SYNC</span>
                  <span className="text-[#4b5563] text-[11px] truncate block">{device.lastSyncTime || 'Never'}</span>
                </div>
              </div>

              {/* Action Buttons: Connect -> Test Connection -> Download */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  id={`test-dev-btn-${device.id}`}
                  disabled={isTesting}
                  onClick={() => handleTestConnection(device)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-[#f9fafb] disabled:opacity-50 text-[#374151] rounded-lg text-xs font-semibold border border-[#d1d5db] transition-colors shadow-xs cursor-pointer"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-600 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Testing IP...' : t.testConnection}
                </button>

                <button
                  id={`download-dev-btn-${device.id}`}
                  disabled={isDownloading}
                  onClick={() => handleDownloadAttendance(device)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#005a9e] hover:bg-[#004880] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <DownloadCloud className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                  {isDownloading ? 'Downloading...' : t.downloadAttendance}
                </button>

                <button
                  id={`sync-time-btn-${device.id}`}
                  disabled={isSyncing}
                  onClick={() => handleSyncTime(device)}
                  title="Synchronize hardware clock with PC"
                  className="p-2 bg-white hover:bg-[#f9fafb] text-[#4b5563] rounded-lg text-xs border border-[#d1d5db] transition-colors shadow-xs cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Raw Punches Audit Table */}
      <div className="bg-white border border-[#d1d5db] rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#005a9e]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
              {t.rawAttendanceLogs}
            </h2>
          </div>
          <span className="text-xs text-[#6b7280]">
            Total Logs: <span className="font-mono font-bold text-[#111827]">{rawPunches.length}</span> (Immutable)
          </span>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#f8fafc] text-[#475569] uppercase text-[10px] tracking-wider border-b border-[#e2e8f0]">
              <tr>
                <th className="py-2.5 px-3">Device User ID</th>
                <th className="py-2.5 px-3">Punch Date</th>
                <th className="py-2.5 px-3">Punch Time</th>
                <th className="py-2.5 px-3">Punch Type</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Device Origin</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] font-mono">
              {rawPunches.slice(-25).reverse().map(punch => (
                <tr key={punch.id} className="hover:bg-[#f8fafc]">
                  <td className="py-2 px-3 font-bold text-[#005a9e]">{punch.deviceUserId}</td>
                  <td className="py-2 px-3 text-[#374151]">{punch.punchDate}</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold">{punch.punchTime}</td>
                  <td className="py-2 px-3 font-sans">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        punch.punchType === 'IN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {punch.punchType}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[#6b7280] text-[11px]">{punch.verificationMode}</td>
                  <td className="py-2 px-3 text-[#6b7280] text-[11px] truncate max-w-[150px]">
                    {punch.deviceName}
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-[10px] text-emerald-700 font-sans font-semibold">Archived</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Device Modal */}
      {isModalOpen && editingDevice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#d1d5db] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden font-sans">
            <div className="px-6 py-4 bg-[#f9fafb] border-b border-[#e5e7eb] flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#005a9e]" />
                {editingDevice.id ? 'Edit Biometric Device' : 'Add IP Biometric Attendance Machine'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9ca3af] hover:text-[#111827] font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">{t.deviceName} *</label>
                <input
                  type="text"
                  required
                  value={editingDevice.name || ''}
                  onChange={e => setEditingDevice({ ...editingDevice, name: e.target.value })}
                  placeholder="e.g. Factory Floor ZKTeco"
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.deviceBrand} *</label>
                  <select
                    value={editingDevice.brand || 'ZKTeco'}
                    onChange={e => setEditingDevice({ ...editingDevice, brand: e.target.value as any })}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                  >
                    <option value="ZKTeco">ZKTeco (ZKEMKeeper / Standalone)</option>
                    <option value="Hikvision">Hikvision (ISAPI)</option>
                    <option value="Suprema">Suprema (BioStar 2)</option>
                    <option value="Generic_TCP">Generic TCP/IP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.deviceModel}</label>
                  <input
                    type="text"
                    value={editingDevice.model || ''}
                    onChange={e => setEditingDevice({ ...editingDevice, model: e.target.value })}
                    placeholder="e.g. iClock 880 / K1T804"
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.ipAddress} *</label>
                  <input
                    type="text"
                    required
                    value={editingDevice.ipAddress || ''}
                    onChange={e => setEditingDevice({ ...editingDevice, ipAddress: e.target.value })}
                    placeholder="192.168.1.201"
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">{t.port} *</label>
                  <input
                    type="number"
                    required
                    value={editingDevice.port || 4370}
                    onChange={e => setEditingDevice({ ...editingDevice, port: Number(e.target.value) })}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#e5e7eb] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#f9fafb] border border-[#d1d5db] text-[#374151] rounded-lg font-semibold shadow-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg font-semibold shadow-xs"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
