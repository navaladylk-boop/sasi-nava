import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Printer,
  CheckCircle,
  XCircle,
  Building,
  Phone,
  Mail,
  CreditCard,
  Fingerprint,
  DollarSign,
  Briefcase,
  Landmark,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Employee, Department, Designation, PayrollCategory, Language } from '../../types';
import { translations } from '../../i18n/translations';

interface EmployeeMasterViewProps {
  language: Language;
  employees: Employee[];
  departments: Department[];
  designations: Designation[];
  payrollCategories: PayrollCategory[];
  onSaveEmployee: (emp: Partial<Employee>) => Promise<Employee> | void;
  onDeleteEmployee: (id: string) => Promise<void> | void;
}

export const EmployeeMasterView: React.FC<EmployeeMasterViewProps> = ({
  language,
  employees,
  departments,
  designations,
  payrollCategories,
  onSaveEmployee,
  onDeleteEmployee
}) => {
  const t = translations[language];

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeModalTab, setActiveModalTab] = useState<'general' | 'salary' | 'device' | 'bank'>('general');

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch =
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.epfNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.nameSinhala && emp.nameSinhala.includes(searchTerm)) ||
        (emp.nameTamil && emp.nameTamil.includes(searchTerm));

      const matchesDept = selectedDept === 'ALL' || emp.departmentId === selectedDept;
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && emp.isActive) ||
        (selectedStatus === 'INACTIVE' && !emp.isActive);

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, selectedDept, selectedStatus]);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [saveErrorMsg, setSaveErrorMsg] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleOpenAddModal = () => {
    setSaveErrorMsg('');
    setEditingEmployee({
      employeeCode: `EMP00${employees.length + 1}`,
      fullName: '',
      nameSinhala: '',
      nameTamil: '',
      nic: '',
      dob: '1995-01-01',
      gender: 'MALE',
      address: '',
      telephone: '',
      email: '',
      departmentId: departments[0]?.id || '',
      designationId: designations[0]?.id || '',
      joinDate: new Date().toISOString().substring(0, 10),
      employmentStatus: 'PERMANENT',
      epfNumber: `${1040 + employees.length + 1}`,
      etfNumber: `${1040 + employees.length + 1}`,
      epfEnabled: true,
      etfEnabled: true,
      basicSalary: 30000,
      fixedAllowance: 5000,
      otherAllowance: 0,
      bankName: 'Commercial Bank of Ceylon',
      bankAccountNumber: '',
      branch: 'Colombo (001)',
      payrollCategoryId: payrollCategories[0]?.id || '',
      workingDaysPerMonth: 25,
      normalWorkingHours: 8,
      otRateType: '1.5X_STANDARD',
      fingerprintUserId: `${100 + employees.length + 1}`,
      isActive: true
    });
    setActiveModalTab('general');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setSaveErrorMsg('');
    setEditingEmployee({ ...emp });
    setActiveModalTab('general');
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || isSaving) return;

    setSaveErrorMsg('');
    setSaveSuccessMsg('');

    const code = editingEmployee.employeeCode?.trim();
    const name = editingEmployee.fullName?.trim();
    const nic = editingEmployee.nic?.trim();
    const basicSalary = Number(editingEmployee.basicSalary);
    const isEpfEnabled = editingEmployee.epfEnabled !== false;
    const epfNumber = editingEmployee.epfNumber?.trim();
    const fingerprintUserId = editingEmployee.fingerprintUserId?.trim();

    if (!code) {
      alert('Employee ID / Code is required.');
      setActiveModalTab('general');
      return;
    }

    if (!name) {
      alert('Employee Full Name is required.');
      setActiveModalTab('general');
      return;
    }

    if (!nic) {
      alert('NIC Number is required.');
      setActiveModalTab('general');
      return;
    }

    if (!basicSalary || isNaN(basicSalary) || basicSalary <= 0) {
      alert('Basic Salary is required and must be greater than 0.');
      setActiveModalTab('salary');
      return;
    }

    if (isEpfEnabled && !epfNumber) {
      alert('EPF Member Number is required when EPF is enabled.');
      setActiveModalTab('salary');
      return;
    }

    if (!fingerprintUserId) {
      alert('Fingerprint User ID is required.');
      setActiveModalTab('device');
      return;
    }

    const payload: Partial<Employee> = {
      ...editingEmployee,
      employeeCode: code,
      fullName: name,
      nic,
      basicSalary: basicSalary,
      fixedAllowance: Number(editingEmployee.fixedAllowance) || 0,
      otherAllowance: Number(editingEmployee.otherAllowance) || 0,
      workingDaysPerMonth: Number(editingEmployee.workingDaysPerMonth) || 25,
      normalWorkingHours: Number(editingEmployee.normalWorkingHours) || 8,
      epfNumber: isEpfEnabled ? epfNumber : (epfNumber || code),
      etfNumber: editingEmployee.etfNumber?.trim() || epfNumber || code,
      epfEnabled: isEpfEnabled,
      etfEnabled: editingEmployee.etfEnabled !== false,
      fingerprintUserId,
      departmentId: editingEmployee.departmentId || departments[0]?.id || '',
      designationId: editingEmployee.designationId || designations[0]?.id || '',
      isActive: editingEmployee.isActive !== false
    };

    setIsSaving(true);
    try {
      await onSaveEmployee(payload);
      // ONLY AFTER SQLite write completes & confirms success:
      setIsModalOpen(false);
      setEditingEmployee(null);
      setSaveSuccessMsg(`Employee "${name}" (${code}) saved successfully.`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      const errorText = err.message || 'Failed to save employee to SQLite database.';
      setSaveErrorMsg(`Failed to save employee: ${errorText}`);
      alert(`Failed to save employee: ${errorText}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintList = () => {
    window.print();
  };

  const getDeptName = (id: string) => {
    const d = departments.find(dept => dept.id === id);
    if (!d) return 'General';
    if (language === 'si' && d.nameSinhala) return d.nameSinhala;
    if (language === 'ta' && d.nameTamil) return d.nameTamil;
    return d.name;
  };

  const getDesigTitle = (id: string) => {
    return designations.find(des => des.id === id)?.title || 'Staff';
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-5 font-sans">
      {/* Header & Action Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#005a9e]" />
            {t.employeeMaster}
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Manage Sri Lankan employee profiles, EPF/ETF numbers, basic salary, allowances and biometric IDs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="print-emp-list-btn"
            onClick={handlePrintList}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#f9fafb] text-[#374151] rounded-lg text-xs font-semibold border border-[#d1d5db] transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            {t.printEmployeeList}
          </button>
          <button
            id="add-emp-btn"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {t.addNewEmployee}
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {saveSuccessMsg}
        </div>
      )}

      {saveErrorMsg && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {saveErrorMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#d1d5db] rounded-xl p-3.5 flex flex-wrap items-center gap-3 no-print shadow-xs">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-2.5" />
          <input
            id="emp-search-input"
            type="text"
            placeholder="Search by Name, Code, NIC, EPF No, Sinhala/Tamil name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#d1d5db] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#005a9e]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#6b7280]" />
          <select
            id="emp-dept-filter"
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="bg-white border border-[#d1d5db] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:outline-none focus:border-[#005a9e]"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            id="emp-status-filter"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-white border border-[#d1d5db] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:outline-none focus:border-[#005a9e]"
          >
            <option value="ACTIVE">Active Employees</option>
            <option value="INACTIVE">Inactive / Resigned</option>
            <option value="ALL">All Status</option>
          </select>
        </div>

        <div className="text-xs text-[#6b7280] ml-auto">
          Showing <span className="font-bold text-[#111827]">{filteredEmployees.length}</span> of {employees.length}
        </div>
      </div>

      {/* Printable Heading (for window.print) */}
      <div className="hidden print-only mb-4 text-black">
        <h2 className="text-lg font-bold">Employee Directory</h2>
        <p className="text-xs text-gray-600">Generated on {new Date().toLocaleDateString('en-GB')} | Total: {filteredEmployees.length}</p>
      </div>

      {/* Employee Master Table */}
      <div className="bg-white border border-[#d1d5db] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#475569] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Code</th>
                <th className="py-3 px-3">Full Name / Multilingual</th>
                <th className="py-3 px-3">NIC & EPF</th>
                <th className="py-3 px-3">Department & Role</th>
                <th className="py-3 px-3 text-right">Basic Salary</th>
                <th className="py-3 px-3 text-right">Allowances</th>
                <th className="py-3 px-3 text-center">Biometric ID</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-[#9ca3af] text-xs">
                    No matching employees found in database.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#005a9e]">
                      {emp.employeeCode}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#111827]">{emp.fullName}</div>
                      <div className="text-[11px] text-[#6b7280] flex items-center gap-2 mt-0.5">
                        {emp.nameSinhala && <span className="font-medium text-[#4b5563]">{emp.nameSinhala}</span>}
                        {emp.nameTamil && <span className="text-[#6b7280]">| {emp.nameTamil}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#374151]">
                      <div>NIC: <span className="font-mono text-[#111827]">{emp.nic}</span></div>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {emp.epfEnabled !== false ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title="EPF 8% + 12% Active">
                            EPF: {emp.epfNumber}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200" title="EPF Disabled">
                            EPF: Off
                          </span>
                        )}
                        {emp.etfEnabled !== false ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#005a9e] border border-blue-200" title="ETF 3% Employer Active">
                            ETF: 3%
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200" title="ETF Disabled">
                            ETF: Off
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#374151]">
                      <div className="font-medium text-[#111827]">{getDeptName(emp.departmentId)}</div>
                      <div className="text-[11px] text-[#6b7280]">{getDesigTitle(emp.designationId)}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-[#111827]">
                      Rs. {(emp.basicSalary ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#374151]">
                      Rs. {((emp.fixedAllowance ?? 0) + (emp.otherAllowance ?? 0)).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#005a9e] font-mono text-[11px] border border-blue-200">
                        <Fingerprint className="w-3 h-3 text-[#005a9e]" />
                        {emp.fingerprintUserId}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {emp.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-2.5 h-2.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-2.5 h-2.5" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`edit-emp-${emp.id}`}
                          onClick={() => handleOpenEditModal(emp)}
                          title="Edit Employee"
                          className="p-1.5 bg-white hover:bg-[#eff6ff] hover:text-[#005a9e] border border-[#d1d5db] text-[#374151] rounded shadow-xs transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`del-emp-${emp.id}`}
                          onClick={async () => {
                            if (confirm(`Are you sure you want to deactivate/delete ${emp.fullName} (${emp.employeeCode})?`)) {
                              setSaveErrorMsg('');
                              setSaveSuccessMsg('');
                              try {
                                await onDeleteEmployee(emp.id);
                                setSaveSuccessMsg(`Employee "${emp.fullName}" (${emp.employeeCode}) deleted successfully.`);
                                setTimeout(() => setSaveSuccessMsg(''), 4000);
                              } catch (err: any) {
                                const errorText = err.message || 'Failed to delete employee from database.';
                                setSaveErrorMsg(`Failed to delete employee: ${errorText}`);
                                alert(`Failed to delete employee: ${errorText}`);
                              }
                            }
                          }}
                          title="Delete / Deactivate"
                          className="p-1.5 bg-white hover:bg-red-50 hover:text-red-700 border border-[#d1d5db] text-[#374151] rounded shadow-xs transition-colors cursor-pointer"
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

      {/* Add / Edit Employee Modal Dialog */}
      {isModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#d1d5db] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#f9fafb] border-b border-[#e5e7eb] flex justify-between items-center">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#005a9e]" />
                {editingEmployee.id ? 'Edit Employee Details' : 'Add New Sri Lankan Employee'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9ca3af] hover:text-[#111827] text-lg font-bold px-2 py-0.5 rounded hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-[#e5e7eb] bg-[#f9fafb] px-6">
              <button
                type="button"
                onClick={() => setActiveModalTab('general')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition ${
                  activeModalTab === 'general'
                    ? 'border-[#005a9e] text-[#005a9e]'
                    : 'border-transparent text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                1. General & Multilingual
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('salary')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition ${
                  activeModalTab === 'salary'
                    ? 'border-[#005a9e] text-[#005a9e]'
                    : 'border-transparent text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                2. Salary & EPF/ETF
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('device')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition ${
                  activeModalTab === 'device'
                    ? 'border-[#005a9e] text-[#005a9e]'
                    : 'border-transparent text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                3. Biometric ID & Working Days
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('bank')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition ${
                  activeModalTab === 'bank'
                    ? 'border-[#005a9e] text-[#005a9e]'
                    : 'border-transparent text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                4. Bank Account
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveModal} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {activeModalTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.employeeCode} *</label>
                    <input
                      type="text"
                      required
                      value={editingEmployee.employeeCode || ''}
                      onChange={e => setEditingEmployee({ ...editingEmployee, employeeCode: e.target.value })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.fullName} *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kasun Chamara Perera"
                      value={editingEmployee.fullName || ''}
                      onChange={e => setEditingEmployee({ ...editingEmployee, fullName: e.target.value })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.nameSinhala}</label>
                    <input
                      type="text"
                      placeholder="e.g. කසුන් චාමර පෙරේරා"
                      value={editingEmployee.nameSinhala || ''}
                      onChange={e => setEditingEmployee({ ...editingEmployee, nameSinhala: e.target.value })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.nameTamil}</label>
                    <input
                      type="text"
                      placeholder="e.g. கசுன் சாமர பெரேரா"
                      value={editingEmployee.nameTamil || ''}
                      onChange={e => setEditingEmployee({ ...editingEmployee, nameTamil: e.target.value })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.nicNumber} *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 891240124V or 199412304561"
                      value={editingEmployee.nic || ''}
                      onChange={e => setEditingEmployee({ ...editingEmployee, nic: e.target.value })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.dateOfBirth}</label>
                    <input
                      type="date"
                      value={editingEmployee.dob || '1995-01-01'}
                      onChange={e => setEditingEmployee({ ...editingEmployee, dob: e.target.value })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.department}</label>
                    <select
                      value={editingEmployee.departmentId || ''}
                      onChange={e => setEditingEmployee({ ...editingEmployee, departmentId: e.target.value })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.designation}</label>
                    <select
                      value={editingEmployee.designationId || ''}
                      onChange={e => setEditingEmployee({ ...editingEmployee, designationId: e.target.value })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                    >
                      {designations.map(des => (
                        <option key={des.id} value={des.id}>
                          {des.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.telephone}</label>
                    <input
                      type="text"
                      placeholder="0771234567"
                      value={editingEmployee.telephone || ''}
                      onChange={e => setEditingEmployee({ ...editingEmployee, telephone: e.target.value })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.email}</label>
                    <input
                      type="email"
                      placeholder="employee@company.lk"
                      value={editingEmployee.email || ''}
                      onChange={e => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.address}</label>
                    <input
                      type="text"
                      placeholder="Street, City, Sri Lanka"
                      value={editingEmployee.address || ''}
                      onChange={e => setEditingEmployee({ ...editingEmployee, address: e.target.value })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {activeModalTab === 'salary' && (
                <div className="space-y-4">
                  {/* Basic & Allowances */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[#4b5563] mb-1 font-medium">{t.basicSalary} *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-[#9ca3af]">Rs.</span>
                        <input
                          type="number"
                          required
                          min="0"
                          value={editingEmployee.basicSalary || 0}
                          onChange={e => setEditingEmployee({ ...editingEmployee, basicSalary: Number(e.target.value) })}
                          className="w-full bg-white border border-[#d1d5db] rounded-lg pl-9 pr-3 py-2 text-[#111827] font-mono font-bold focus:border-[#005a9e] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#4b5563] mb-1 font-medium">{t.fixedAllowance} (Subject to Deduction)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-[#9ca3af]">Rs.</span>
                        <input
                          type="number"
                          min="0"
                          value={editingEmployee.fixedAllowance || 0}
                          onChange={e => setEditingEmployee({ ...editingEmployee, fixedAllowance: Number(e.target.value) })}
                          className="w-full bg-white border border-[#d1d5db] rounded-lg pl-9 pr-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#4b5563] mb-1 font-medium">{t.otherAllowance}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-[#9ca3af]">Rs.</span>
                        <input
                          type="number"
                          min="0"
                          value={editingEmployee.otherAllowance || 0}
                          onChange={e => setEditingEmployee({ ...editingEmployee, otherAllowance: Number(e.target.value) })}
                          className="w-full bg-white border border-[#d1d5db] rounded-lg pl-9 pr-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sri Lankan Statutory Contributions (EPF & ETF Enable / Disable) */}
                  <div className="border border-[#e2e8f0] rounded-xl p-4 bg-[#f8fafc] space-y-4">
                    <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
                      <h4 className="font-bold text-[#1e293b] text-xs flex items-center gap-1.5">
                        <Landmark className="w-4 h-4 text-[#005a9e]" />
                        Sri Lankan Statutory Contributions (EPF & ETF)
                      </h4>
                      <span className="text-[10px] text-[#64748b]">
                        Enable or disable EPF/ETF per employee profile
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* EPF Box */}
                      <div className={`p-3.5 rounded-lg border transition-colors ${
                        editingEmployee.epfEnabled !== false
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-gray-50 border-gray-200 opacity-75'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-[#0f172a] flex items-center gap-1.5">
                            Employees' Provident Fund (EPF)
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingEmployee.epfEnabled !== false}
                              onChange={e => setEditingEmployee({ ...editingEmployee, epfEnabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className="ml-2 text-[11px] font-semibold text-[#334155]">
                              {editingEmployee.epfEnabled !== false ? 'Enabled' : 'Disabled'}
                            </span>
                          </label>
                        </div>

                        <div>
                          <label className="block text-[#475569] text-[11px] mb-1 font-medium">EPF Member Number {editingEmployee.epfEnabled !== false && '*'}</label>
                          <input
                            type="text"
                            disabled={editingEmployee.epfEnabled === false}
                            required={editingEmployee.epfEnabled !== false}
                            placeholder="e.g. 1042"
                            value={editingEmployee.epfNumber || ''}
                            onChange={e => setEditingEmployee({ ...editingEmployee, epfNumber: e.target.value })}
                            className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3 py-1.5 text-xs text-[#111827] font-mono font-semibold focus:border-[#005a9e] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                          />
                          <p className="text-[10px] text-[#64748b] mt-1">
                            {editingEmployee.epfEnabled !== false
                              ? 'Deducts 8% Employee EPF and contributes 12% Employer EPF.'
                              : 'EPF deductions and employer contributions are disabled (0%).'}
                          </p>
                        </div>
                      </div>

                      {/* ETF Box */}
                      <div className={`p-3.5 rounded-lg border transition-colors ${
                        editingEmployee.etfEnabled !== false
                          ? 'bg-blue-50/60 border-blue-200'
                          : 'bg-gray-50 border-gray-200 opacity-75'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-[#0f172a] flex items-center gap-1.5">
                            Employees' Trust Fund (ETF)
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingEmployee.etfEnabled !== false}
                              onChange={e => setEditingEmployee({ ...editingEmployee, etfEnabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#005a9e]"></div>
                            <span className="ml-2 text-[11px] font-semibold text-[#334155]">
                              {editingEmployee.etfEnabled !== false ? 'Enabled' : 'Disabled'}
                            </span>
                          </label>
                        </div>

                        <div>
                          <label className="block text-[#475569] text-[11px] mb-1 font-medium">ETF Member Number</label>
                          <input
                            type="text"
                            disabled={editingEmployee.etfEnabled === false}
                            placeholder="e.g. 1042"
                            value={editingEmployee.etfNumber || editingEmployee.epfNumber || ''}
                            onChange={e => setEditingEmployee({ ...editingEmployee, etfNumber: e.target.value })}
                            className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3 py-1.5 text-xs text-[#111827] font-mono font-semibold focus:border-[#005a9e] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                          />
                          <p className="text-[10px] text-[#64748b] mt-1">
                            {editingEmployee.etfEnabled !== false
                              ? 'Contributes 3% Employer ETF on liable earnings.'
                              : 'Employer 3% ETF contribution is disabled (0%).'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payroll Category & OT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#4b5563] mb-1 font-medium">{t.payrollCategory}</label>
                      <select
                        value={editingEmployee.payrollCategoryId || ''}
                        onChange={e => setEditingEmployee({ ...editingEmployee, payrollCategoryId: e.target.value })}
                        className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                      >
                        {payrollCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.workingDaysDivisor} days divisor)
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-[#6b7280] mt-1">Defines divisor (25 days), default OT rates & deduction rules.</p>
                    </div>

                    <div>
                      <label className="block text-[#4b5563] mb-1 font-medium">{t.otRateConfig}</label>
                      <select
                        value={editingEmployee.otRateType || '1.5X_STANDARD'}
                        onChange={e => setEditingEmployee({ ...editingEmployee, otRateType: e.target.value as any })}
                        className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                      >
                        <option value="1.5X_STANDARD">Standard 1.5x Hourly Rate</option>
                        <option value="2.0X_HOLIDAY">Double Rate (2.0x)</option>
                        <option value="FIXED_HOURLY">Custom Fixed Hourly Rate</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'device' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.fingerprintUserId} *</label>
                    <div className="relative">
                      <Fingerprint className="w-4 h-4 text-[#005a9e] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 101"
                        value={editingEmployee.fingerprintUserId || ''}
                        onChange={e => setEditingEmployee({ ...editingEmployee, fingerprintUserId: e.target.value })}
                        className="w-full bg-white border border-[#d1d5db] rounded-lg pl-9 pr-3 py-2 text-[#111827] font-mono font-bold focus:border-[#005a9e] focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-[#6b7280] mt-1">Must match user ID registered on Hikvision attendance hardware.</p>
                  </div>

                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.workingDaysPerMonth} (Divisor)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={editingEmployee.workingDaysPerMonth || 25}
                      onChange={e => setEditingEmployee({ ...editingEmployee, workingDaysPerMonth: Number(e.target.value) })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                    />
                    <p className="text-[10px] text-[#6b7280] mt-1">Daily basic deduction = Basic Salary ÷ Working Days (Default 25).</p>
                  </div>

                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.normalWorkingHours}</label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={editingEmployee.normalWorkingHours || 8}
                      onChange={e => setEditingEmployee({ ...editingEmployee, normalWorkingHours: Number(e.target.value) })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingEmployee.isActive}
                        onChange={e => setEditingEmployee({ ...editingEmployee, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="ml-3 text-xs font-semibold text-[#111827]">
                        {editingEmployee.isActive ? 'Employee is Active' : 'Deactivated / Inactive'}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {activeModalTab === 'bank' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.bankName}</label>
                    <select
                      value={editingEmployee.bankName || 'Commercial Bank of Ceylon'}
                      onChange={e => setEditingEmployee({ ...editingEmployee, bankName: e.target.value })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                    >
                      <option value="Commercial Bank of Ceylon">Commercial Bank of Ceylon</option>
                      <option value="Bank of Ceylon">Bank of Ceylon (BOC)</option>
                      <option value="People's Bank">People's Bank</option>
                      <option value="Hatton National Bank">Hatton National Bank (HNB)</option>
                      <option value="Sampath Bank">Sampath Bank</option>
                      <option value="Seylan Bank">Seylan Bank</option>
                      <option value="National Development Bank">NDB Bank</option>
                      <option value="DFCC Bank">DFCC Bank</option>
                      <option value="Nations Trust Bank">Nations Trust Bank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.bankAccountNumber} *</label>
                    <input
                      type="text"
                      placeholder="e.g. 8004123901"
                      value={editingEmployee.bankAccountNumber || ''}
                      onChange={e => setEditingEmployee({ ...editingEmployee, bankAccountNumber: e.target.value })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono font-bold focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4b5563] mb-1 font-medium">{t.branch}</label>
                    <input
                      type="text"
                      placeholder="e.g. Maharagama (034)"
                      value={editingEmployee.branch || ''}
                      onChange={e => setEditingEmployee({ ...editingEmployee, branch: e.target.value })}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-[#e5e7eb] flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    if (!isSaving) {
                      setIsModalOpen(false);
                    }
                  }}
                  className="px-4 py-2 bg-white hover:bg-[#f9fafb] border border-[#d1d5db] text-[#374151] rounded-lg font-semibold shadow-xs disabled:opacity-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Saving...' : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
