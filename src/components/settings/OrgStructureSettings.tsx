import React, { useState } from 'react';
import {
  Briefcase,
  Building,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Department, Designation, Language } from '../../types';
import { translations } from '../../i18n/translations';

interface OrgStructureSettingsProps {
  language: Language;
  departments: Department[];
  designations: Designation[];
  onSaveDepartment: (dept: Partial<Department>) => void;
  onDeleteDepartment: (id: string) => { success: boolean; message?: string };
  onSaveDesignation: (desig: Partial<Designation>) => void;
  onDeleteDesignation: (id: string) => { success: boolean; message?: string };
}

export const OrgStructureSettings: React.FC<OrgStructureSettingsProps> = ({
  language,
  departments,
  designations,
  onSaveDepartment,
  onDeleteDepartment,
  onSaveDesignation,
  onDeleteDesignation
}) => {
  const t = translations[language];

  // Department Modal State
  const [editingDept, setEditingDept] = useState<Partial<Department> | null>(null);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState<boolean>(false);

  // Designation Modal State
  const [editingDesig, setEditingDesig] = useState<Partial<Designation> | null>(null);
  const [isDesigModalOpen, setIsDesigModalOpen] = useState<boolean>(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  // Handle Dept Save
  const handleSaveDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editingDept.name) {
      showMsg('Department Name is required.', 'error');
      return;
    }
    onSaveDepartment(editingDept);
    setIsDeptModalOpen(false);
    setEditingDept(null);
    showMsg('Department saved successfully.');
  };

  // Handle Dept Delete
  const handleDeleteDept = (id: string) => {
    if (confirm('Are you sure you want to delete this department?')) {
      const res = onDeleteDepartment(id);
      if (res.success) {
        showMsg('Department removed.');
      } else {
        showMsg(res.message || 'Cannot delete department.', 'error');
      }
    }
  };

  // Handle Designation Save
  const handleSaveDesigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDesig || !editingDesig.title) {
      showMsg('Designation Title is required.', 'error');
      return;
    }
    onSaveDesignation(editingDesig);
    setIsDesigModalOpen(false);
    setEditingDesig(null);
    showMsg('Designation saved successfully.');
  };

  // Handle Designation Delete
  const handleDeleteDesig = (id: string) => {
    if (confirm('Are you sure you want to delete this designation?')) {
      const res = onDeleteDesignation(id);
      if (res.success) {
        showMsg('Designation removed.');
      } else {
        showMsg(res.message || 'Cannot delete designation.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-xs font-semibold shadow-xs animate-fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Departments Section */}
      <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-[#e5e7eb] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Building className="w-4 h-4 text-[#005a9e]" />
              Departments Management
            </h2>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Manage company departments with multi-language name support (Sinhala & Tamil).
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingDept({
                code: `DEP-0${departments.length + 1}`,
                name: '',
                nameSinhala: '',
                nameTamil: ''
              });
              setIsDeptModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Department
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[#4b5563] font-bold">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Name (English)</th>
                <th className="py-2.5 px-3">Sinhala</th>
                <th className="py-2.5 px-3">Tamil</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-[#6b7280]">
                    No departments created yet.
                  </td>
                </tr>
              ) : (
                departments.map(dept => (
                  <tr key={dept.id} className="hover:bg-[#f9fafb]">
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#005a9e]">{dept.code}</td>
                    <td className="py-2.5 px-3 font-medium text-[#111827]">{dept.name}</td>
                    <td className="py-2.5 px-3 text-[#4b5563]">{dept.nameSinhala || '-'}</td>
                    <td className="py-2.5 px-3 text-[#4b5563]">{dept.nameTamil || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDept({ ...dept });
                            setIsDeptModalOpen(true);
                          }}
                          className="p-1 text-[#005a9e] hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDept(dept.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Designations Section */}
      <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-[#e5e7eb] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#005a9e]" />
              Designations & Job Titles
            </h2>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Configure job designations and map them to their parent department.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingDesig({
                code: `DES-0${designations.length + 1}`,
                title: '',
                departmentId: departments[0]?.id || ''
              });
              setIsDesigModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Designation
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[#4b5563] font-bold">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Designation / Title</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {designations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-[#6b7280]">
                    No designations configured.
                  </td>
                </tr>
              ) : (
                designations.map(desig => {
                  const dept = departments.find(d => d.id === desig.departmentId);
                  return (
                    <tr key={desig.id} className="hover:bg-[#f9fafb]">
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#005a9e]">{desig.code}</td>
                      <td className="py-2.5 px-3 font-medium text-[#111827]">{desig.title}</td>
                      <td className="py-2.5 px-3 text-[#4b5563]">{dept ? dept.name : 'Unassigned'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDesig({ ...desig });
                              setIsDesigModalOpen(true);
                            }}
                            className="p-1 text-[#005a9e] hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDesig(desig.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Dept Modal */}
      {isDeptModalOpen && editingDept && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full border border-[#d1d5db] shadow-xl overflow-hidden">
            <div className="p-4 bg-[#f9fafb] border-b border-[#e5e7eb] flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#111827]">
                {editingDept.id ? 'Edit Department' : 'Add Department'}
              </h2>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="text-[#6b7280] hover:text-[#111827] font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveDeptSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Department Code</label>
                <input
                  type="text"
                  required
                  value={editingDept.code || ''}
                  onChange={e => setEditingDept({ ...editingDept, code: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Department Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finance & Accounts"
                  value={editingDept.name || ''}
                  onChange={e => setEditingDept({ ...editingDept, name: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Sinhala Name</label>
                <input
                  type="text"
                  placeholder="e.g. මුදල් හා ගිණුම් අංශය"
                  value={editingDept.nameSinhala || ''}
                  onChange={e => setEditingDept({ ...editingDept, nameSinhala: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Tamil Name</label>
                <input
                  type="text"
                  placeholder="e.g. நிதி மற்றும் கணக்குகள்"
                  value={editingDept.nameTamil || ''}
                  onChange={e => setEditingDept({ ...editingDept, nameTamil: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                />
              </div>
              <div className="pt-3 border-t border-[#e5e7eb] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#f9fafb] border border-[#d1d5db] text-[#374151] rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Designation Modal */}
      {isDesigModalOpen && editingDesig && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full border border-[#d1d5db] shadow-xl overflow-hidden">
            <div className="p-4 bg-[#f9fafb] border-b border-[#e5e7eb] flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#111827]">
                {editingDesig.id ? 'Edit Designation' : 'Add Designation'}
              </h2>
              <button
                onClick={() => setIsDesigModalOpen(false)}
                className="text-[#6b7280] hover:text-[#111827] font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveDesigSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Designation Code</label>
                <input
                  type="text"
                  required
                  value={editingDesig.code || ''}
                  onChange={e => setEditingDesig({ ...editingDesig, code: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Designation Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Accounts Executive"
                  value={editingDesig.title || ''}
                  onChange={e => setEditingDesig({ ...editingDesig, title: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Department *</label>
                <select
                  required
                  value={editingDesig.departmentId || ''}
                  onChange={e => setEditingDesig({ ...editingDesig, departmentId: e.target.value })}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                >
                  <option value="">Select Department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-3 border-t border-[#e5e7eb] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDesigModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#f9fafb] border border-[#d1d5db] text-[#374151] rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Designation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
