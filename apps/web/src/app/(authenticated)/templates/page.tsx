'use client';
import { useState, useEffect, useCallback } from 'react';
import { request } from '@/lib/api';

interface TemplateType {
  key: string;
  label: string;
}

const TEMPLATE_TYPES: TemplateType[] = [
  { key: 'kpi_template', label: 'KPI Definitions' },
  { key: 'activity_template', label: 'Activities' },
  { key: 'project_template', label: 'Projects' },
  { key: 'risk_template', label: 'Risks' },
  { key: 'compliance_template', label: 'Compliance Requirements' },
  { key: 'report_template', label: 'Reporting Formats' },
  { key: 'workplan_template', label: 'Work-Plan Structures' },
  { key: 'org_structure_template', label: 'Organizational Structures' },
];

const IMPORTABLE = [
  { key: 'kpi_template', label: 'KPI Templates' },
  { key: 'activity_template', label: 'Activity Templates' },
  { key: 'project_template', label: 'Project Templates' },
  { key: 'risk_template', label: 'Risk Templates' },
  { key: 'compliance_template', label: 'Compliance Templates' },
  { key: 'budget_category', label: 'Budget Categories' },
  { key: 'funding_source', label: 'Funding Sources' },
  { key: 'kpi_category', label: 'KPI Categories' },
  { key: 'risk_category', label: 'Risk Categories' },
  { key: 'org_unit', label: 'Organization Units' },
];

const DATA_TIERS = [
  { tier: 'master', label: 'Master Data', desc: 'Reusable templates and definitions — no year scope. Never holds actuals.' },
  { tier: 'year', label: 'Year-Specific Data', desc: 'Linked to a planning year via yearId. References a master template.' },
  { tier: 'actual', label: 'Actual Performance Data', desc: 'Actual results, progress, financials. Never copied or templated.' },
];

export default function TemplatesPage() {
  const [tab, setTab] = useState<'templates' | 'import' | 'tiers'>('templates');
  const [selectedType, setSelectedType] = useState('kpi_template');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [importEntity, setImportEntity] = useState('kpi_template');
  const [csvContent, setCsvContent] = useState('');
  const [importResult, setImportResult] = useState<any>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates/${selectedType}`);
      if (res.ok) setTemplates(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [selectedType]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handleCreate = async () => {
    setError(null);
    try {
      await request(`/templates/${selectedType}`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({});
      loadTemplates();
    } catch (e: any) { setError(e.message); }
  };

  const handleDelete = async (id: number) => {
    await request(`/templates/${selectedType}/${id}`, { method: 'DELETE' });
    loadTemplates();
  };

  const handleImport = async () => {
    setError(null);
    setImportResult(null);
    try {
      const data = await request(`/import-export/${importEntity}/import`, {
        method: 'POST',
        body: JSON.stringify({ csv: csvContent, fileName: 'import.csv' }),
      });
      setImportResult(data);
    } catch (e: any) { setError(e.message); }
  };

  const handleExport = async (entity: string) => {
    const res = await fetch(`/api/import-export/${entity}/export`);
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entity}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Templates & Master Data</h1>
          <p className="text-gray-500">Reusable definitions — separate master data from year-specific and performance data</p>
          <div className="flex mt-4 space-x-2">
            {(['templates', 'import', 'tiers'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t === 'templates' ? 'Templates' : t === 'import' ? 'Import / Export' : 'Data Tiers'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

        {tab === 'templates' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_TYPES.map(t => (
                <button key={t.key} onClick={() => setSelectedType(t.key)}
                  className={`px-3 py-1 rounded text-sm ${selectedType === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Create {TEMPLATE_TYPES.find(t => t.key === selectedType)?.label}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input placeholder="Code *" className="px-3 py-2 border rounded" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} />
                <input placeholder="Name *" className="px-3 py-2 border rounded" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                <input placeholder="Description" className="px-3 py-2 border rounded" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <button onClick={handleCreate} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Template</button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr><th className="text-left p-3">Code</th><th className="text-left p-3">Name</th><th className="text-left p-3">Description</th><th className="text-center p-3">Active</th><th className="p-3"></th></tr></thead>
                <tbody>
                  {templates.map(t => (
                    <tr key={t.id} className="border-t">
                      <td className="p-3 font-mono">{t.code}</td>
                      <td className="p-3">{t.name}</td>
                      <td className="p-3 text-gray-500">{t.description || '—'}</td>
                      <td className="p-3 text-center">{t.active ? '✓' : '—'}</td>
                      <td className="p-3 text-right"><button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline text-xs">Deactivate</button></td>
                    </tr>
                  ))}
                  {!loading && templates.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400">No templates yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'import' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold">Import CSV</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity type</label>
                  <select className="w-full px-3 py-2 border rounded" value={importEntity} onChange={e => setImportEntity(e.target.value)}>
                    {IMPORTABLE.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={() => handleExport(importEntity)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">Download current CSV</button>
                </div>
              </div>
              <textarea className="w-full px-3 py-2 border rounded font-mono text-xs" rows={8} placeholder="code,name,description&#10;EX-01,Example,Description here" value={csvContent} onChange={e => setCsvContent(e.target.value)} />
              <button onClick={handleImport} disabled={!csvContent} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40">Import</button>
            </div>

            {importResult && (
              <div className="bg-white rounded-lg shadow p-6 space-y-3">
                <h3 className="font-semibold">Import Result</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded"><div className="text-gray-500">Total rows</div><div className="text-lg font-bold">{importResult.totalRows}</div></div>
                  <div className="p-3 bg-green-50 rounded"><div className="text-green-600">Success</div><div className="text-lg font-bold text-green-700">{importResult.successRows}</div></div>
                  <div className="p-3 bg-red-50 rounded"><div className="text-red-600">Failed</div><div className="text-lg font-bold text-red-700">{importResult.failedRows}</div></div>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="border rounded overflow-hidden">
                    <table className="w-full text-xs"><thead className="bg-red-50"><tr><th className="text-left p-2">Row</th><th className="text-left p-2">Field</th><th className="text-left p-2">Error</th></tr></thead>
                      <tbody>{importResult.errors.map((err: any, i: number) => (
                        <tr key={i} className="border-t"><td className="p-2">{err.row}</td><td className="p-2">{err.field}</td><td className="p-2">{err.message}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Quick Export</h2>
              <div className="flex flex-wrap gap-2">
                {IMPORTABLE.map(e => (
                  <button key={e.key} onClick={() => handleExport(e.key)} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">{e.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'tiers' && (
          <div className="space-y-4">
            {DATA_TIERS.map(t => (
              <div key={t.tier} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${t.tier === 'master' ? 'bg-purple-100 text-purple-700' : t.tier === 'year' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{t.tier}</span>
                  <h3 className="text-lg font-semibold">{t.label}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-2">{t.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
