'use client';

import { useState, useEffect } from 'react';
import { Currency, getCurrencies } from '@/lib/currency';

function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const c of cookies) {
    const parts = c.trim().split('=');
    if (parts[0] === 'ija_csrf') return decodeURIComponent(parts[1] || '');
  }
  return null;
}

export function CurrenciesTab() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Edit form state
  const [editId, setEditId] = useState<number | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editSymbol, setEditSymbol] = useState('');
  const [editDecPlaces, setEditDecPlaces] = useState(2);
  const [editLocale, setEditLocale] = useState('en-US');
  const [editActive, setEditActive] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getCurrencies();
      setCurrencies(list);
    } catch {
      setError('Failed to load currencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setEditCode('');
    setEditName('');
    setEditSymbol('');
    setEditDecPlaces(2);
    setEditLocale('en-US');
    setEditActive(true);
    setShowCreate(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    const csrf = getCsrfToken();
    try {
      const payload = {
        code: editCode,
        name: editName,
        symbol: editSymbol,
        decimalPlaces: editDecPlaces,
        locale: editLocale,
        isActive: editActive,
      };
      const url = editId ? `/api/currency/${editId}` : '/api/currency';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to save currency');
      }
      setNotice(editId ? 'Currency updated' : 'Currency created');
      resetForm();
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    const csrf = getCsrfToken();
    try {
      const res = await fetch(`/api/currency/${id}/default`, {
        method: 'PUT',
        headers: { ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to set default');
      }
      setNotice('Default currency updated');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: number, currentlyActive: boolean) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    const csrf = getCsrfToken();
    try {
      const url = `/api/currency/${id}`;
      const res = await fetch(currentlyActive ? url : `${url}/reactivate`, {
        method: currentlyActive ? 'DELETE' : 'PATCH',
        headers: { ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to update currency');
      }
      setNotice(currentlyActive ? 'Currency deactivated' : 'Currency reactivated');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c: Currency) => {
    setEditId(c.id);
    setEditCode(c.code);
    setEditName(c.name || '');
    setEditSymbol(c.symbol || '');
    setEditDecPlaces(c.decimalPlaces ?? 2);
    setEditLocale(c.locale || 'en-US');
    setEditActive(c.isActive ?? true);
    setShowCreate(true);
  };
return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">Currencies</h2>
          <p className="text-sm text-gray-500">
            Ethiopian Birr (ETB) is the default. Add or manage additional currencies.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add Currency
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
      )}
      {notice && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">{notice}</div>
      )}

      {showCreate && (
        <form onSubmit={handleCreateOrUpdate} className="bg-gray-50 border rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900">{editId ? 'Edit Currency' : 'New Currency'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code (3 letters) *</label>
              <input
                type="text"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                required
                maxLength={3}
                placeholder="e.g. KES"
                className="block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                placeholder="e.g. Kenyan Shilling"
                className="block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
              <input
                type="text"
                value={editSymbol}
                onChange={(e) => setEditSymbol(e.target.value)}
                placeholder="e.g. Sh, $"
                className="block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Decimal Places</label>
              <input
                type="number"
                min="0" max="6"
                value={editDecPlaces}
                onChange={(e) => setEditDecPlaces(Number(e.target.value))}
                className="block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Locale</label>
              <input
                type="text"
                value={editLocale}
                onChange={(e) => setEditLocale(e.target.value)}
                placeholder="en-US"
                className="block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600"
                />
                Active
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-md">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Currency'}
            </button>
          </div>
        </form>
      )}
{loading ? (
        <div className="text-center py-8 text-gray-500">Loading currencies...</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Symbol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Decimals</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currencies.map(c => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-sm font-medium">
                  {c.code}
                  {c.isDefault && (
                    <span className="ml-2 inline-flex px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">Default</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{c.name}</td>
                <td className="px-4 py-3 text-sm">{c.symbol || '-'}</td>
                <td className="px-4 py-3 text-sm">{c.decimalPlaces ?? 2}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                    c.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  {!c.isDefault && c.isActive && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(c.id)}
                      disabled={saving}
                      className="text-indigo-600 hover:underline"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleEdit(c)}
                    className="text-indigo-600 hover:underline ml-3"
                  >
                    Edit
                  </button>
                  {c.isActive ? (
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c.id, true)}
                      disabled={saving || c.isDefault}
                      className="text-red-600 hover:underline ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c.id, false)}
                      disabled={saving}
                      className="text-green-600 hover:underline ml-3"
                    >
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}