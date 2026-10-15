'use client';

import { useState, useEffect, useMemo } from 'react';
import { request } from '@/lib/api';

interface User {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  active: boolean;
  roleId: number;
  primaryOrgUnitId?: number;
  createdAt: string;
  Role: { id: number; code: string; name: string };
  OrgUnit?: { id: number; name: string };
  Employee?: { id: number; fullName: string };
}

interface Role {
  id: number;
  code: string;
  name: string;
}

interface OrgUnit {
  id: number;
  name: string;
}

interface ModuleAccess {
  module: string;
}

const AVAILABLE_MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'planning', label: 'Planning' },
  { key: 'strategic', label: 'Strategic' },
  { key: 'kpi', label: 'KPIs' },
  { key: 'workplan', label: 'Workplan' },
  { key: 'projects', label: 'Projects' },
  { key: 'budget', label: 'Budget' },
  { key: 'risk', label: 'Risk' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'monitoring', label: 'Monitoring' },
  { key: 'reporting', label: 'Reporting' },
  { key: 'organization', label: 'Organization' },
  { key: 'employees', label: 'Employees' },
  { key: 'governance', label: 'Governance' },
  { key: 'settings', label: 'Settings' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showModulesModal, setShowModulesModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    roleId: 0,
    primaryOrgUnitId: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [passwordData, setPasswordData] = useState({ password: '', confirm: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [modules, setModules] = useState<string[]>([]);
  const [modulesSaving, setModulesSaving] = useState(false);
  const [modulesError, setModulesError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request<User[]>('/admin/users');
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await request<Role[]>('/governance/roles');
      setRoles(data);
    } catch {
      // ignore
    }
  };

  const fetchOrgUnits = async () => {
    try {
      const data = await request<{ items: OrgUnit[] }>('/crud/org-units');
      setOrgUnits(Array.isArray(data) ? data : data.items || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchOrgUnits();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !u.username.toLowerCase().includes(q) &&
          !u.fullName.toLowerCase().includes(q) &&
          !(u.email || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (roleFilter && u.Role.code !== roleFilter) return false;
      if (orgFilter && u.primaryOrgUnitId !== Number(orgFilter)) return false;
      if (statusFilter === 'active' && !u.active) return false;
      if (statusFilter === 'inactive' && u.active) return false;
      return true;
    });
  }, [users, search, roleFilter, orgFilter, statusFilter]);

  const openCreateModal = () => {
    setForm({ username: '', fullName: '', email: '', phone: '', password: '', roleId: 0, primaryOrgUnitId: '' });
    setFormError(null);
    setShowCreateModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setForm({
      username: user.username,
      fullName: user.fullName,
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      roleId: user.roleId,
      primaryOrgUnitId: user.primaryOrgUnitId?.toString() || '',
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setPasswordData({ password: '', confirm: '' });
    setPasswordError(null);
    setShowPasswordModal(true);
  };

  const openModulesModal = async (user: User) => {
    setSelectedUser(user);
    setModulesError(null);
    try {
      const data = await request<{ data: ModuleAccess[] }>(`/admin/users/${user.id}/modules/list`);
      setModules(data.data.map((m) => m.module));
    } catch (err: any) {
      setModulesError(err.message || 'Failed to load module access');
      setModules([]);
    }
    setShowModulesModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.username || !form.fullName || !form.password || !form.roleId) {
      setFormError('Username, full name, password, and role are required');
      return;
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await request('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: form.username,
          fullName: form.fullName,
          password: form.password,
          email: form.email || undefined,
          phone: form.phone || undefined,
          roleId: form.roleId,
          primaryOrgUnitId: form.primaryOrgUnitId ? Number(form.primaryOrgUnitId) : undefined,
        }),
      });
      setShowCreateModal(false);
      setSuccess('User created successfully');
      setTimeout(() => setSuccess(null), 3000);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError(null);
    setSaving(true);
    try {
      await request(`/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          roleId: form.roleId,
          primaryOrgUnitId: form.primaryOrgUnitId ? Number(form.primaryOrgUnitId) : undefined,
          active: undefined,
        }),
      });
      setShowEditModal(false);
      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setPasswordError(null);
    if (!passwordData.password || passwordData.password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (passwordData.password !== passwordData.confirm) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      await request(`/admin/users/${selectedUser.id}/password`, {
        method: 'POST',
        body: JSON.stringify({ password: passwordData.password }),
      });
      setShowPasswordModal(false);
      setSuccess('Password reset successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to reset password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveModules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setModulesError(null);
    setModulesSaving(true);
    try {
      await request(`/admin/users/${selectedUser.id}/modules`, {
        method: 'POST',
        body: JSON.stringify({ modules }),
      });
      setShowModulesModal(false);
      setSuccess('Module access updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setModulesError(err.message || 'Failed to update module access');
    } finally {
      setModulesSaving(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    const action = user.active ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${user.username}?`)) return;
    try {
      if (user.active) {
        await request(`/admin/users/${user.id}`, { method: 'DELETE' });
      } else {
        await request(`/admin/users/${user.id}/reactivate`, { method: 'PATCH' });
      }
      setSuccess(`User ${action}d successfully`);
      setTimeout(() => setSuccess(null), 3000);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || `Failed to ${action} user`);
    }
  };

  const selectedRole = roles.find((r) => r.id === form.roleId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Administration</h1>
            <p className="text-gray-600 mt-1">Manage users, roles, and module access</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#123a28] text-white rounded-lg hover:bg-[#0f2e20] transition-colors"
          >
            Create User
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>
        )}

        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by username, name, or email..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.code}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Organizations</option>
                {orgUnits.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">Loading users...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">No users found</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{user.fullName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">{user.Role.name}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.OrgUnit?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="text-orange-600 hover:text-orange-800"
                            title="Reset Password"
                          >
                            Password
                          </button>
                          <button
                            onClick={() => openModulesModal(user)}
                            className="text-purple-600 hover:text-purple-800"
                            title="Module Access"
                          >
                            Modules
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={user.active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                            title={user.active ? 'Deactivate' : 'Activate'}
                          >
                            {user.active ? 'Deactivate' : 'Activate'}
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
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create User</h2>
            {formError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{formError}</p>}
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="create-username" className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input
                    id="create-username"
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="create-fullname" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    id="create-fullname"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="create-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    id="create-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="create-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    id="create-phone"
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="create-password" className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    id="create-password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label htmlFor="create-role" className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    id="create-role"
                    value={form.roleId}
                    onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="create-org" className="block text-sm font-medium text-gray-700 mb-1">Organization Unit</label>
                  <select
                    id="create-org"
                    value={form.primaryOrgUnitId}
                    onChange={(e) => setForm({ ...form, primaryOrgUnitId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">None</option>
                    {orgUnits.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#123a28] text-white rounded-lg hover:bg-[#0f2e20] disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit User</h2>
            {formError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{formError}</p>}
            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    id="edit-username"
                    type="text"
                    value={form.username}
                    disabled
                    className="w-full border border-gray-200 bg-gray-100 rounded-lg px-3 py-2 text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-fullname" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    id="edit-fullname"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    id="edit-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    id="edit-phone"
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    id="edit-role"
                    value={form.roleId}
                    onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-org" className="block text-sm font-medium text-gray-700 mb-1">Organization Unit</label>
                  <select
                    id="edit-org"
                    value={form.primaryOrgUnitId}
                    onChange={(e) => setForm({ ...form, primaryOrgUnitId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">None</option>
                    {orgUnits.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#123a28] text-white rounded-lg hover:bg-[#0f2e20] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Reset Password for {selectedUser.username}</h2>
            {passwordError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{passwordError}</p>}
            <form onSubmit={handlePasswordReset}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                  <input
                    id="reset-password"
                    type="password"
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label htmlFor="reset-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    id="reset-confirm"
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-4 py-2 bg-[#123a28] text-white rounded-lg hover:bg-[#0f2e20] disabled:opacity-50"
                >
                  {passwordSaving ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Access Modal */}
      {showModulesModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Module Access - {selectedUser.username}</h2>
            {modulesError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{modulesError}</p>}
            <form onSubmit={handleSaveModules}>
              <div className="space-y-2">
                {AVAILABLE_MODULES.map((mod) => (
                  <label key={mod.key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={modules.includes(mod.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setModules([...modules, mod.key]);
                        } else {
                          setModules(modules.filter((m) => m !== mod.key));
                        }
                      }}
                      className="rounded border-gray-300 text-[#123a28]"
                    />
                    <span className="text-sm text-gray-700">{mod.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModulesModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modulesSaving}
                  className="px-4 py-2 bg-[#123a28] text-white rounded-lg hover:bg-[#0f2e20] disabled:opacity-50"
                >
                  {modulesSaving ? 'Saving...' : 'Save Module Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
