'use client';

import { useState, useEffect, Fragment } from 'react';
import { request } from '@/lib/api';

interface Role {
  id: number;
  name: string;
  code: string;
  description?: string;
  isSystem?: boolean;
  active?: boolean;
  rolePermissions: { id: number; resource: string; actions: string[] }[];
  _count: { users: number };
}

interface AuditEntry {
  id: number;
  userId: number;
  action: string;
  entity: string;
  recordId: string;
  oldValue: any;
  newValue: any;
  createdAt: string;
  user?: { username: string; fullName: string };
}

type TabType = 'roles' | 'permissions' | 'audit' | 'monitoring';

const MONITORING_STATS = {
  totalPeriods: 0,
  activePeriods: 0,
  totalReports: 0,
  pendingReports: 0,
  totalVisits: 0,
  completedVisits: 0,
};

const ALL_ACTIONS = ['view', 'create', 'edit', 'delete', 'submit', 'approve', 'reject', 'close', 'archive', 'export', 'manage'] as const;

const RESOURCE_GROUPS = [
  { category: 'Planning', resources: ['planning_year', 'strategic_plan', 'theme', 'goal', 'objective'] },
  { category: 'KPI', resources: ['kpi', 'kpi_plan', 'kpi_actual', 'kpi_category'] },
  { category: 'Activities', resources: ['activity', 'deliverable', 'sub_task', 'task_update'] },
  { category: 'Projects', resources: ['project', 'project_milestone', 'project_phase', 'project_risk', 'project_document'] },
  { category: 'Budget & Finance', resources: ['budget', 'budget_line', 'budget_request', 'finance_entry', 'finance_category'] },
  { category: 'Risk & Compliance', resources: ['risk', 'risk_mitigation', 'compliance_requirement', 'compliance_finding', 'corrective_action', 'audit'] },
  { category: 'Organization', resources: ['org_unit', 'employee', 'role', 'user'] },
  { category: 'Reports', resources: ['report', 'reporting_period', 'report_correction'] },
  { category: 'Other', resources: ['training', 'procurement', 'asset', 'dashboard', 'setting'] },
];

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState<TabType>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [auditLog, setAuditLog] = useState<{ data: AuditEntry[]; total: number }>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [auditFilters, setAuditFilters] = useState({
    entity: '',
    action: '',
    startDate: '',
    endDate: '',
  });

  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', code: '', description: '', permissions: [] as { resource: string; actions: string[] }[] });
  const [roleFormError, setRoleFormError] = useState<string | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);
  const [monitoringStats, setMonitoringStats] = useState(MONITORING_STATS);
  const [monitoringPeriods, setMonitoringPeriods] = useState<any[]>([]);
  const [monitoringReports, setMonitoringReports] = useState<any[]>([]);

  const fetchRoles = async () => {
    try {
      const data = await request<Role[]>('/governance/roles');
      setRoles(data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchAuditLog = async () => {
    try {
      const params = new URLSearchParams();
      if (auditFilters.entity) params.append('entity', auditFilters.entity);
      if (auditFilters.action) params.append('action', auditFilters.action);
      if (auditFilters.startDate) params.append('startDate', auditFilters.startDate);
      if (auditFilters.endDate) params.append('endDate', auditFilters.endDate);
      params.append('limit', '50');

      const data = await request<{ data: AuditEntry[]; total: number }>(`/governance/audit?${params.toString()}`);
      setAuditLog(data);
    } catch (error) {
      console.error('Failed to fetch audit log:', error);
    }
  };

  const fetchMonitoring = async () => {
    try {
      const dashRes = await request<any>('/api/monitoring/dashboard');
      setMonitoringStats(dashRes || MONITORING_STATS);
    } catch { /* ignore */ }
    try {
      const periodRes = await request<any[]>('/api/monitoring/periods');
      setMonitoringPeriods(Array.isArray(periodRes) ? periodRes : []);
    } catch { /* ignore */ }
    try {
      const reportRes = await request<any[]>('/api/monitoring/reports');
      setMonitoringReports(Array.isArray(reportRes) ? reportRes : []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (activeTab === 'monitoring') fetchMonitoring();
  }, [activeTab]);

  const initializeRoles = async () => {
    try {
      await request('/governance/initialize', { method: 'POST' });
      await fetchRoles();
    } catch (error) {
      console.error('Failed to initialize roles:', error);
    }
  };

  const openCreateRoleModal = () => {
    setEditingRole(null);
    setRoleForm({ name: '', code: '', description: '', permissions: [] });
    setRoleFormError(null);
    setShowCreateRoleModal(true);
  };

  const openEditRoleModal = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      code: role.code,
      description: role.description || '',
      permissions: role.rolePermissions.map(p => ({ resource: p.resource, actions: [...p.actions] })),
    });
    setRoleFormError(null);
    setShowEditRoleModal(true);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleFormError(null);
    if (!roleForm.name || !roleForm.code) {
      setRoleFormError('Name and code are required');
      return;
    }
    setRoleSaving(true);
    try {
      await request('/governance/roles', {
        method: 'POST',
        body: JSON.stringify({
          name: roleForm.name,
          code: roleForm.code,
          description: roleForm.description,
          permissions: roleForm.permissions,
        }),
      });
      setShowCreateRoleModal(false);
      await fetchRoles();
    } catch (err: any) {
      setRoleFormError(err.message || 'Failed to create role');
    } finally {
      setRoleSaving(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    setRoleFormError(null);
    setRoleSaving(true);
    try {
      await request(`/governance/roles/${editingRole.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissions,
        }),
      });
      setShowEditRoleModal(false);
      setEditingRole(null);
      await fetchRoles();
    } catch (err: any) {
      setRoleFormError(err.message || 'Failed to update role');
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    try {
      await request(`/governance/roles/${role.id}`, { method: 'DELETE' });
      if (selectedRole?.id === role.id) setSelectedRole(null);
      await fetchRoles();
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  const togglePermission = (resource: string, action: string) => {
    setRoleForm((prev) => {
      const permissions = [...prev.permissions];
      const existing = permissions.find((p) => p.resource === resource);
      if (existing) {
        if (existing.actions.includes(action)) {
          existing.actions = existing.actions.filter((a) => a !== action);
          if (existing.actions.length === 0) {
            return { ...prev, permissions: permissions.filter((p) => p.resource !== resource) };
          }
        } else {
          existing.actions = [...existing.actions, action];
        }
      } else {
        permissions.push({ resource, actions: [action] });
      }
      return { ...prev, permissions };
    });
  };

  const hasPermission = (resource: string, action: string) => {
    return roleForm.permissions.some((p) => p.resource === resource && p.actions.includes(action));
  };

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'roles') {
      fetchRoles().finally(() => setLoading(false));
    } else if (activeTab === 'audit') {
      fetchAuditLog().finally(() => setLoading(false));
    }
  }, [activeTab]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getActionColor = (action: string) => {
    if (action.startsWith('CREATE') || action === 'approve') return 'text-green-600 bg-green-50';
    if (action.startsWith('UPDATE') || action === 'edit') return 'text-blue-600 bg-blue-50';
    if (action.startsWith('DELETE') || action === 'reject') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Governance & Permissions</h1>
              <p className="text-gray-500">Manage roles, permissions, and audit trails</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openCreateRoleModal}
                className="px-4 py-2 bg-[#123a28] text-white rounded-lg hover:bg-[#0f2e20] transition-colors"
              >
                Create Role
              </button>
              <button
                onClick={initializeRoles}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Initialize Default Roles
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Roles & Permissions
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Permission Reference
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Audit Log
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'monitoring'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Monitoring
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="mt-6">
            {/* ROLES TAB */}
            {activeTab === 'roles' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Role List */}
                <div className="lg:col-span-1 bg-white rounded-lg shadow">
                  <div className="p-4 border-b">
                    <h2 className="font-semibold text-gray-900">Roles</h2>
                  </div>
                  <div className="divide-y">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          selectedRole?.id === role.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setSelectedRole(role)}
                            className="flex-1 text-left"
                          >
                            <div className="font-medium text-gray-900">{role.name}</div>
                            <div className="text-sm text-gray-500">{role.code}</div>
                          </button>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => openEditRoleModal(role)}
                              className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              Edit
                            </button>
                            {!role.isSystem && (
                              <button
                                onClick={() => handleDeleteRole(role)}
                                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          {role._count?.users ?? 0} users • {role.rolePermissions.length} permissions
                        </div>
                      </div>
                    ))}
                    {roles.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        No roles defined. Click "Initialize Default Roles" to create them.
                      </div>
                    )}
                  </div>
                </div>

                {/* Role Details / Permission Matrix */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow">
                  {selectedRole ? (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{selectedRole.name}</h2>
                          <p className="text-gray-500">{selectedRole.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditRoleModal(selectedRole)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Edit Permissions
                          </button>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Permission Matrix</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                                {ALL_ACTIONS.map((action) => (
                                  <th key={action} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                    {action}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {RESOURCE_GROUPS.map((group) => (
                                <Fragment key={group.category}>
                                  <tr className="bg-gray-50/50">
                                    <td colSpan={ALL_ACTIONS.length + 1} className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                                      {group.category}
                                    </td>
                                  </tr>
                                  {group.resources.map((resource) => {
                                    const perm = selectedRole.rolePermissions.find((p) => p.resource === resource);
                                    return (
                                      <tr key={resource} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 font-mono text-xs text-gray-700">{resource}</td>
                                        {ALL_ACTIONS.map((action) => (
                                          <td key={action} className="px-2 py-2 text-center">
                                            {perm?.actions.includes(action) ? (
                                              <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded">✓</span>
                                            ) : (
                                              <span className="inline-block px-2 py-1 text-gray-300">-</span>
                                            )}
                                          </td>
                                        ))}
                                      </tr>
                                    );
                                  })}
                                </Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-gray-500">
                      Select a role to view its permissions
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PERMISSIONS REFERENCE TAB */}
            {activeTab === 'permissions' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Permission Actions</h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  {ALL_ACTIONS.map((action) => (
                    <div key={action} className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="font-semibold text-gray-900 capitalize">{action}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {action === 'view' && 'Read access'}
                        {action === 'create' && 'Add new records'}
                        {action === 'edit' && 'Modify records'}
                        {action === 'delete' && 'Remove records'}
                        {action === 'submit' && 'Submit for approval'}
                        {action === 'approve' && 'Approve records'}
                        {action === 'reject' && 'Reject records'}
                        {action === 'close' && 'Close records'}
                        {action === 'archive' && 'Archive records'}
                        {action === 'export' && 'Export data'}
                        {action === 'manage' && 'Full management'}
                      </div>
                    </div>
                  ))}
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-6">Resource Types</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {RESOURCE_GROUPS.map((group) => (
                    <div key={group.category} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">{group.category}</h3>
                      <div className="space-y-1">
                        {group.resources.map((resource) => (
                          <div key={resource} className="text-sm font-mono text-gray-600">
                            {resource}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AUDIT LOG TAB */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Entity</label>
                      <input
                        type="text"
                        value={auditFilters.entity}
                        onChange={(e) => setAuditFilters({ ...auditFilters, entity: e.target.value })}
                        placeholder="e.g., Activity"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                      <input
                        type="text"
                        value={auditFilters.action}
                        onChange={(e) => setAuditFilters({ ...auditFilters, action: e.target.value })}
                        placeholder="e.g., CREATE"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={auditFilters.startDate}
                        onChange={(e) => setAuditFilters({ ...auditFilters, startDate: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={auditFilters.endDate}
                        onChange={(e) => setAuditFilters({ ...auditFilters, endDate: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={fetchAuditLog}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Filter
                      </button>
                    </div>
                  </div>
                </div>

                {/* Audit Entries */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b">
                    <h2 className="font-semibold text-gray-900">
                      Audit Log ({auditLog.total} entries)
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Changes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {auditLog.data.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(entry.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium text-gray-900">{entry.user?.fullName || 'System'}</div>
                              <div className="text-gray-500 text-xs">{entry.user?.username}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded ${getActionColor(entry.action)}`}>
                                {entry.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-700">
                              {entry.entity}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              #{entry.recordId}
                            </td>
                            <td className="px-4 py-3">
                              {entry.oldValue || entry.newValue ? (
                                <details className="text-sm">
                                  <summary className="text-blue-600 cursor-pointer">View Changes</summary>
                                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                    {entry.oldValue && (
                                      <div className="mb-2">
                                        <div className="text-gray-500">Old:</div>
                                        <pre className="text-red-600">{JSON.stringify(entry.oldValue, null, 2)}</pre>
                                      </div>
                                    )}
                                    {entry.newValue && (
                                      <div>
                                        <div className="text-gray-500">New:</div>
                                        <pre className="text-green-600">{JSON.stringify(entry.newValue, null, 2)}</pre>
                                      </div>
                                    )}
                                  </div>
                                </details>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {auditLog.data.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              No audit entries found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* MONITORING TAB */}
            {activeTab === 'monitoring' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Periods</div>
                    <div className="text-2xl font-bold text-gray-900">{monitoringStats.totalPeriods}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Active Periods</div>
                    <div className="text-2xl font-bold text-green-600">{monitoringStats.activePeriods}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Reports</div>
                    <div className="text-2xl font-bold text-gray-900">{monitoringStats.totalReports}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Pending Reports</div>
                    <div className="text-2xl font-bold text-orange-600">{monitoringStats.pendingReports}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Visits</div>
                    <div className="text-2xl font-bold text-gray-900">{monitoringStats.totalVisits}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Completed Visits</div>
                    <div className="text-2xl font-bold text-blue-600">{monitoringStats.completedVisits}</div>
                  </div>
                </div>

                {/* Periods */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b">
                    <h2 className="font-semibold text-gray-900">Period Definitions</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {monitoringPeriods.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{p.label || '-'}</td>
                            <td className="px-4 py-3 text-sm font-mono">{p.periodType}</td>
                            <td className="px-4 py-3 text-sm font-mono">{p.periodKey}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{new Date(p.startDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{new Date(p.endDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {p.active ? 'active' : 'inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {monitoringPeriods.length === 0 && (
                          <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No periods found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Reports */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b">
                    <h2 className="font-semibold text-gray-900">Reports</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {monitoringReports.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{r.title || '-'}</td>
                            <td className="px-4 py-3 text-sm font-mono">{r.reportType}</td>
                            <td className="px-4 py-3 text-sm">{r.periodKey || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded ${
                                r.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                                r.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                              }`}>{r.status}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</td>
                          </tr>
                        ))}
                        {monitoringReports.length === 0 && (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No reports found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Role Modal */}
      {(showCreateRoleModal || showEditRoleModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
            {roleFormError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{roleFormError}</p>}
            <form onSubmit={editingRole ? handleUpdateRole : handleCreateRole}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    id="role-name"
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="role-code" className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    id="role-code"
                    type="text"
                    value={roleForm.code}
                    onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value.toUpperCase() })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                    disabled={!!editingRole}
                  />
                </div>
                <div>
                  <label htmlFor="role-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id="role-description"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                          {ALL_ACTIONS.map((action) => (
                            <th key={action} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                              {action}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {RESOURCE_GROUPS.map((group) => (
                          <Fragment key={group.category}>
                            <tr className="bg-gray-50/50">
                              <td colSpan={ALL_ACTIONS.length + 1} className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                                {group.category}
                              </td>
                            </tr>
                            {group.resources.map((resource) => (
                              <tr key={resource} className="hover:bg-gray-50">
                                <td className="px-3 py-2 font-mono text-xs text-gray-700">{resource}</td>
                                {ALL_ACTIONS.map((action) => (
                                  <td key={action} className="px-2 py-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={hasPermission(resource, action)}
                                      onChange={() => togglePermission(resource, action)}
                                      className="rounded border-gray-300 text-[#123a28]"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowCreateRoleModal(false); setShowEditRoleModal(false); setEditingRole(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleSaving}
                  className="px-4 py-2 bg-[#123a28] text-white rounded-lg hover:bg-[#0f2e20] disabled:opacity-50"
                >
                  {roleSaving ? 'Saving...' : (editingRole ? 'Save Changes' : 'Create Role')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
