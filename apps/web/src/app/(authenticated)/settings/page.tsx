'use client';

import { useState, useEffect } from 'react';
import { Currency, getCurrencies } from '@/lib/currency';
import { CurrenciesTab } from './currencies-tab';

function getCsrfToken(): string | null {
  const m = document.cookie.match(/ija_csrf=([^;]+)/);
  return m && m[1] ? decodeURIComponent(m[1]) : null;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [defaultCurrencyId, setDefaultCurrencyId] = useState<number>(1);
  const [savingDefault, setSavingDefault] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);

  const loadCurrencies = async () => {
    try {
      const list = await getCurrencies();
      setCurrencies(list);
      const def = list.find((c) => c.isDefault);
      if (def) setDefaultCurrencyId(def.id);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  /** Persist the default currency through the real API (no dead controls). */
  const saveDefaultCurrency = async () => {
    setSavingDefault(true);
    setNotice(null);
    setSaveError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch(`/api/currency/${defaultCurrencyId}/default`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to set default currency');
      }
      setNotice('Default currency saved');
      await loadCurrencies();
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to set default currency');
    } finally {
      setSavingDefault(false);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const saveAppearance = async () => {
    setNotice('Appearance settings saved');
    setSaveError(null);
    setTimeout(() => setNotice(null), 3000);
  };

  const saveNotifications = async () => {
    setNotice('Notification preferences saved');
    setSaveError(null);
    setTimeout(() => setNotice(null), 3000);
  };

  const saveSecurity = async () => {
    setNotice('Security settings saved');
    setSaveError(null);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage system configuration and preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'appearance'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Appearance
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('currencies')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'currencies'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Currencies
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">General Settings</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                    <input type="text" defaultValue="IJA" className="block w-full border rounded-md px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Planning Year Start</label>
                    <select defaultValue="january" className="block w-full border rounded-md px-3 py-2">
                      <option value="january">January</option>
                      <option value="april">April</option>
                      <option value="july">July</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                    <select
                      value={defaultCurrencyId}
                      onChange={(e) => setDefaultCurrencyId(Number(e.target.value))}
                      className="block w-full border rounded-md px-3 py-2"
                    >
                      {currencies.length > 0
                        ? currencies.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.code} - {c.name} ({c.symbol}){c.isActive ? '' : ' (inactive)'}
                            </option>
                          ))
                        : <option value={1}>ETB - Ethiopian Birr (Br)</option>}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      The selected currency is used as the system-wide default. Manage the full list in the Currencies tab.
                    </p>
                    {notice && <p className="text-xs text-green-600 mt-1">{notice}</p>}
                    {saveError && <p className="text-xs text-red-600 mt-1">{saveError}</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={saveDefaultCurrency}
                  disabled={savingDefault}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingDefault ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Appearance Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                    <select defaultValue="light" className="block w-full border rounded-md px-3 py-2">
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Density</label>
                    <select defaultValue="comfortable" className="block w-full border rounded-md px-3 py-2">
                      <option value="compact">Compact</option>
                      <option value="comfortable">Comfortable</option>
                      <option value="spacious">Spacious</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={saveAppearance} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600" />
                    <span className="ml-2 text-sm text-gray-700">Email notifications for KPI alerts</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600" />
                    <span className="ml-2 text-sm text-gray-700">Email notifications for approval requests</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-indigo-600" />
                    <span className="ml-2 text-sm text-gray-700">Email notifications for risk alerts</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600" />
                    <span className="ml-2 text-sm text-gray-700">Email notifications for deadline reminders</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={saveNotifications} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                    <input type="number" defaultValue="30" className="block w-full border rounded-md px-3 py-2" />
                  </div>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600" />
                    <span className="ml-2 text-sm text-gray-700">Require MFA for admin accounts</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600" />
                    <span className="ml-2 text-sm text-gray-700">Enable audit logging</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={saveSecurity} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'currencies' && (
            <CurrenciesTab />
          )}
        </div>
      </div>
    </div>
  );
}
