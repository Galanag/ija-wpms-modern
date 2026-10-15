'use client';

import { useState, useEffect } from 'react';

function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const c of cookies) {
    const parts = c.trim().split('=');
    if (parts[0] === 'ija_csrf') return decodeURIComponent(parts[1] || '');
  }
  return null;
}

interface OrgUnit {
  id: number;
  name: string;
  code?: string;
  unitType: string;
  parentId?: number;
  parent?: { id: number; name: string };
  manager?: { id: number; fullName: string };
  active: boolean;
  children?: OrgUnit[];
  employeesCount?: number;
}

interface Employee {
  id: number;
  employeeNo?: string;
  fullName: string;
  jobTitle?: string;
  position?: string;
  email?: string;
  phone?: string;
  orgUnitId?: number;
  orgUnit?: { id: number; name: string; unitType: string };
  manager?: { id: number; fullName: string };
  active: boolean;
  subordinates?: Employee[];
}

interface Statistics {
  organization: {
    totalUnits: number;
    byType: Record<string, number>;
  };
  employees: {
    total: number;
    active: number;
    inactive: number;
  };
}

const UNIT_TYPES = [
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'directorate', label: 'Directorate' },
  { value: 'division', label: 'Division' },
  { value: 'department', label: 'Department' },
  { value: 'unit', label: 'Unit' },
  { value: 'branch', label: 'Branch' },
  { value: 'location', label: 'Location' },
  { value: 'team', label: 'Team' },
];

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<'units' | 'employees' | 'tree'>('units');
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  const [orgModalMode, setOrgModalMode] = useState<'create' | 'edit'>('create');
  const [savingUnit, setSavingUnit] = useState(false);
  const [unitError, setUnitError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeModalMode, setEmployeeModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [orgUnitFilter, setOrgUnitFilter] = useState('');

  // Tab state is mirrored in the URL (?tab=employees) so a reload or a shared
  // link keeps the user on the tab they were viewing.
  const changeTab = (tab: 'units' | 'employees' | 'tree') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (tab === 'units') url.searchParams.delete('tab');
      else url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'employees' || tab === 'tree' || tab === 'units') {
        setActiveTab(tab);
      }
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [treeRes, employeesRes, statsRes] = await Promise.all([
        fetch('/api/organization/tree'),
        fetch('/api/organization/employees?includeInactive=1'),
        fetch('/api/organization/statistics'),
      ]);

      const treeData = await treeRes.json();
      const employeesData = await employeesRes.json();
      const statsData = await statsRes.json();

      // Tree is a nested structure; flatten for the units tab
      const flatUnits: OrgUnit[] = [];
      const flatten = (nodes: any[]) => {
        for (const node of nodes) {
          flatUnits.push({
            id: node.id,
            name: node.name,
            code: node.code,
            unitType: node.unitType,
            active: true,
          });
          if (node.children) flatten(node.children);
        }
      };
      if (Array.isArray(treeData)) flatten(treeData);

      setOrgUnits(flatUnits);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setStatistics(statsData);
    } catch (error) {
      console.error('Failed to fetch organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgTree = async () => {
    try {
      const res = await fetch('/api/organization/units/tree');
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch org tree:', error);
      return [];
    }
  };

  const getUnitTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      enterprise: 'bg-purple-100 text-purple-800',
      directorate: 'bg-blue-100 text-blue-800',
      division: 'bg-indigo-100 text-indigo-800',
      department: 'bg-green-100 text-green-800',
      unit: 'bg-teal-100 text-teal-800',
      branch: 'bg-orange-100 text-orange-800',
      location: 'bg-gray-100 text-gray-800',
      team: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredUnits = orgUnits.filter(unit => {
    if (typeFilter && unit.unitType !== typeFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return unit.name.toLowerCase().includes(query) || 
             (unit.code && unit.code.toLowerCase().includes(query));
    }
    return true;
  });

  const filteredEmployees = employees.filter(emp => {
    if (orgUnitFilter && String(emp.orgUnitId ?? emp.orgUnit?.id ?? '') !== orgUnitFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return emp.fullName.toLowerCase().includes(query) ||
             (emp.employeeNo && emp.employeeNo.toLowerCase().includes(query)) ||
             (emp.jobTitle && emp.jobTitle.toLowerCase().includes(query));
    }
    return true;
  });

  const openCreateUnit = () => {
    setSelectedUnit(null);
    setOrgModalMode('create');
    setUnitError(null);
    setShowOrgModal(true);
  };

  const openEditUnit = (unit: OrgUnit) => {
    setSelectedUnit(unit);
    setOrgModalMode('edit');
    setUnitError(null);
    setShowOrgModal(true);
  };

  const handleSaveUnit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name') || '').trim(),
      code: String(fd.get('code') || '') || undefined,
      unitType: String(fd.get('unitType') || ''),
      parentId: fd.get('parentId') ? parseInt(String(fd.get('parentId'))) : undefined,
      description: String(fd.get('description') || '') || undefined,
      active: fd.get('active') === 'on',
    };
    if (!payload.name) { setUnitError('Name is required'); return; }
    if (!payload.unitType) { setUnitError('Unit type is required'); return; }
    setSavingUnit(true);
    setUnitError(null);
    try {
      const editing = orgModalMode === 'edit' && selectedUnit;
      const res = await fetch(editing ? `/api/organization/units/${selectedUnit!.id}` : '/api/organization/units', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setUnitError(data?.message || 'Save failed');
        return;
      }
      setShowOrgModal(false);
      fetchData();
    } catch (err: any) {
      setUnitError(err?.message || 'Save failed');
    } finally {
      setSavingUnit(false);
    }
  };

  const openCreateEmployee = () => {
    setSelectedEmployee(null);
    setEmployeeModalMode('create');
    setEmployeeError(null);
    setShowEmployeeModal(true);
  };

  const openViewEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEmployeeModalMode('view');
    setEmployeeError(null);
    setShowEmployeeModal(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEmployeeModalMode('edit');
    setEmployeeError(null);
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      employeeNo: String(fd.get('employeeNo') || '') || undefined,
      fullName: String(fd.get('fullName') || '').trim(),
      jobTitle: String(fd.get('jobTitle') || '') || undefined,
      orgUnitId: fd.get('orgUnitId') ? parseInt(String(fd.get('orgUnitId'))) : undefined,
      email: String(fd.get('email') || '') || undefined,
      phone: String(fd.get('phone') || '') || undefined,
      active: fd.get('active') === 'on',
    };
    if (!payload.fullName) { setEmployeeError('Full name is required'); return; }
    setSavingEmployee(true);
    setEmployeeError(null);
    try {
      const editing = employeeModalMode === 'edit' && selectedEmployee;
      const csrf = (document.cookie.match(/ija_csrf=([^;]+)/)?.[1] || '');
      const res = await fetch(editing ? `/api/organization/employees/employee/${selectedEmployee!.id}` : '/api/organization/employees', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setEmployeeError(data?.message || 'Save failed');
        return;
      }
      setShowEmployeeModal(false);
      // Switch to the Employees tab so the freshly saved record is visible
      // (the create button lives in the header, which is shown on every tab).
      changeTab('employees');
      await fetchData();
    } catch (err: any) {
      setEmployeeError(err?.message || 'Save failed');
    } finally {
      setSavingEmployee(false);
    }
  };

  const handleToggleEmployeeActive = async (emp: Employee) => {
    try {
      const csrf = getCsrfToken();
      await fetch(`/api/organization/employees/employee/${emp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify({ active: !emp.active }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update employee status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organization Management</h1>
            <p className="text-gray-600 mt-1">Manage organizational hierarchy and employees</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={openCreateUnit}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              + New Unit
            </button>
            <button
              onClick={openCreateEmployee}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              + New Employee
            </button>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Org Units</h3>
              <p className="text-2xl font-bold text-gray-900">{statistics.organization.totalUnits}</p>
            </div>
            {Object.entries(statistics.organization.byType).map(([type, count]) => (
              <div key={type} className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500 capitalize">{type}</h3>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Employees</h3>
              <p className="text-2xl font-bold text-gray-900">{statistics.employees.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Active</h3>
              <p className="text-2xl font-bold text-green-600">{statistics.employees.active}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Inactive</h3>
              <p className="text-2xl font-bold text-red-600">{statistics.employees.inactive}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => changeTab('units')}
            className={`px-4 py-2 font-medium ${activeTab === 'units' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Organization Units
          </button>
          <button
            onClick={() => changeTab('employees')}
            className={`px-4 py-2 font-medium ${activeTab === 'employees' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Employees
          </button>
          <button
            onClick={() => changeTab('tree')}
            className={`px-4 py-2 font-medium ${activeTab === 'tree' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Organization Tree
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            {activeTab === 'units' && (
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="">All Types</option>
                  {UNIT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            )}
            {activeTab === 'employees' && (
              <div>
                <select
                  value={orgUnitFilter}
                  onChange={(e) => setOrgUnitFilter(e.target.value)}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="">All Organization Units</option>
                  {orgUnits.map(unit => (
                    <option key={unit.id} value={String(unit.id)}>{unit.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Units Tab */}
        {activeTab === 'units' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center">Loading...</td></tr>
                ) : filteredUnits.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center">No organization units found</td></tr>
                ) : (
                  filteredUnits.map((unit) => (
                    <tr key={unit.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{unit.code || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{unit.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getUnitTypeColor(unit.unitType)}`}>
                          {unit.unitType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{unit.parent?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{unit.manager?.fullName || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${unit.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {unit.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { setSelectedUnit(unit); setShowOrgModal(true); }}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center">Loading...</td></tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center">No employees found</td></tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openViewEmployee(employee)}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{employee.employeeNo || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{employee.fullName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{employee.jobTitle || employee.position || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUnitTypeColor(employee.orgUnit?.unitType || '')}`}>
                          {employee.orgUnit?.name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${employee.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {employee.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditEmployee(employee)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleEmployeeActive(employee)}
                          className={`text-sm ${employee.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {employee.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tree Tab */}
        {activeTab === 'tree' && (
          <div className="bg-white rounded-lg shadow p-6">
            <OrgTreeView orgUnits={orgUnits} />
          </div>
        )}
      </div>

      {/* Org Unit Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {orgModalMode === 'edit' ? `Edit Unit: ${selectedUnit?.name}` : 'New Organization Unit'}
            </h2>
            <form onSubmit={handleSaveUnit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="unit-name">Name *</label>
                  <input id="unit-name" type="text" name="name" required defaultValue={selectedUnit?.name || ''} className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="unit-code">Code</label>
                  <input id="unit-code" type="text" name="code" defaultValue={selectedUnit?.code || ''} className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="unit-type">Unit Type *</label>
                  <select id="unit-type" name="unitType" required defaultValue={selectedUnit?.unitType || ''} className="mt-1 block w-full border rounded-md px-3 py-2">
                    <option value="">Select type…</option>
                    {UNIT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="unit-parent">Parent Unit</label>
                  <select id="unit-parent" name="parentId" defaultValue={selectedUnit?.parentId || ''} className="mt-1 block w-full border rounded-md px-3 py-2">
                    <option value="">No parent (top level)</option>
                    {orgUnits.filter(u => !selectedUnit || u.id !== selectedUnit.id).map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="unit-desc">Description</label>
                  <textarea id="unit-desc" name="description" rows={2} className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                {orgModalMode === 'edit' && (
                  <div className="col-span-2 flex items-center gap-2">
                    <input id="unit-active" type="checkbox" name="active" defaultChecked={selectedUnit?.active ?? true} className="h-4 w-4" />
                    <label className="text-sm text-gray-700">Active</label>
                  </div>
                )}
              </div>
              {unitError && <p className="mt-3 text-sm text-red-600">{unitError}</p>}
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowOrgModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" disabled={savingUnit} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
                  {savingUnit ? 'Saving…' : 'Save Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Modal (view / create / edit) */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {employeeModalMode === 'view' && selectedEmployee ? (
              <>
                <h2 className="text-xl font-semibold mb-1">{selectedEmployee.fullName}</h2>
                <p className="text-sm text-gray-500 mb-4">
                  {selectedEmployee.employeeNo || 'No employee number'} • {selectedEmployee.active ? 'Active' : 'Inactive'}
                </p>
                <dl className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Job Title</dt>
                    <dd className="text-sm text-gray-900">{selectedEmployee.jobTitle || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Organization Unit</dt>
                    <dd className="text-sm text-gray-900">{selectedEmployee.orgUnit?.name || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{selectedEmployee.email || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900">{selectedEmployee.phone || '-'}</dd>
                  </div>
                </dl>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowEmployeeModal(false)} className="px-4 py-2 border rounded-md">Close</button>
                  <button type="button" onClick={() => setEmployeeModalMode('edit')} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Edit</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">
                  {employeeModalMode === 'edit' ? `Edit Employee: ${selectedEmployee?.fullName}` : 'New Employee'}
                </h2>
                <form onSubmit={handleSaveEmployee}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700" htmlFor="emp-no">Employee No.</label>
                      <input id="emp-no" type="text" name="employeeNo" defaultValue={selectedEmployee?.employeeNo || ''} className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="Auto if blank" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700" htmlFor="emp-name">Full Name *</label>
                      <input id="emp-name" type="text" name="fullName" required defaultValue={selectedEmployee?.fullName || ''} className="mt-1 block w-full border rounded-md px-3 py-2" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="emp-title">Job Title</label>
                      <input id="emp-title" type="text" name="jobTitle" defaultValue={selectedEmployee?.jobTitle || ''} className="mt-1 block w-full border rounded-md px-3 py-2" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="emp-unit">Organization Unit</label>
                      <select id="emp-unit" name="orgUnitId" defaultValue={selectedEmployee?.orgUnitId ?? selectedEmployee?.orgUnit?.id ?? ''} className="mt-1 block w-full border rounded-md px-3 py-2">
                        <option value="">Unassigned</option>
                        {orgUnits.map(unit => (
                          <option key={unit.id} value={unit.id}>{unit.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700" htmlFor="emp-email">Email</label>
                      <input id="emp-email" type="email" name="email" defaultValue={selectedEmployee?.email || ''} className="mt-1 block w-full border rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700" htmlFor="emp-phone">Phone</label>
                      <input id="emp-phone" type="tel" name="phone" defaultValue={selectedEmployee?.phone || ''} className="mt-1 block w-full border rounded-md px-3 py-2" />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <input id="emp-active" type="checkbox" name="active" defaultChecked={selectedEmployee?.active ?? true} className="h-4 w-4" />
                      <label className="text-sm text-gray-700">Active</label>
                    </div>
                  </div>
                  {employeeError && <p className="mt-3 text-sm text-red-600">{employeeError}</p>}
                  <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setShowEmployeeModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={savingEmployee} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50">
                      {savingEmployee ? 'Saving…' : 'Save Employee'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple tree component
function OrgTreeView({ orgUnits }: { orgUnits: OrgUnit[] }) {
  const roots = orgUnits.filter(u => !u.parentId);
  
  const renderUnit = (unit: OrgUnit, level: number = 0) => {
    const children = orgUnits.filter(u => u.parentId === unit.id);
    
    return (
      <div key={unit.id} style={{ marginLeft: level * 24 }}>
        <div className="flex items-center gap-2 py-2 border-b border-gray-100">
          <span className="text-gray-400">{level > 0 && '└─'}</span>
          <span className="font-medium text-gray-900">{unit.name}</span>
          <span className={`px-2 py-0.5 rounded text-xs capitalize ${getUnitTypeColorStatic(unit.unitType)}`}>
            {unit.unitType}
          </span>
          {unit.manager && (
            <span className="text-sm text-gray-500">• {unit.manager.fullName}</span>
          )}
        </div>
        {children.map(child => renderUnit(child, level + 1))}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Organization Hierarchy</h2>
      {roots.length === 0 ? (
        <p className="text-gray-500 italic">No organization units defined</p>
      ) : (
        roots.map(root => renderUnit(root))
      )}
    </div>
  );
}

function getUnitTypeColorStatic(type: string) {
  const colors: Record<string, string> = {
    enterprise: 'bg-purple-100 text-purple-800',
    directorate: 'bg-blue-100 text-blue-800',
    division: 'bg-indigo-100 text-indigo-800',
    department: 'bg-green-100 text-green-800',
    unit: 'bg-teal-100 text-teal-800',
    branch: 'bg-orange-100 text-orange-800',
    location: 'bg-gray-100 text-gray-800',
    team: 'bg-pink-100 text-pink-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}
