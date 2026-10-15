'use client';

import { useState, useEffect, useCallback } from 'react';

// ==================== TYPES ====================

interface PlanningYear {
  id: number;
  year: number;
  label: string;
  status: string;
}

interface StructureItem {
  key: string;
  label: string;
  description: string;
}

interface WizardMeta {
  structureItems: StructureItem[];
  neverCopied: { key: string; label: string; reason: string }[];
  modes: string[];
}

interface PreviewItem {
  key: string;
  label: string;
  sourceCount: number;
  copied: boolean;
}

interface Preview {
  sourceYear: { id: number; year: number; label: string };
  targetYear: { id: number; year: number; label: string };
  mode: string;
  items: PreviewItem[];
  performanceNotCopied: { key: string; label: string; reason: string }[];
  protection: { sourceClosed: boolean; targetClosed: boolean; targetNotDraft: boolean };
}

interface ExecuteResult {
  jobId: number;
  sourceYear: number;
  targetYear: number;
  summary: {
    copied: Record<string, { copied: number; skipped: number; failed: number }>;
  };
}

type Step = 1 | 2 | 3 | 4 | 5;

const MODE_LABELS: Record<string, string> = {
  all: 'Copy everything',
  selected: 'Copy selected items only',
  org_unit: 'Copy by organization unit',
  goal: 'Copy by goal',
  module: 'Copy by module',
};

const MODULE_OPTIONS = [
  { key: 'strategic', label: 'Strategic (themes, goals, objectives)' },
  { key: 'kpi', label: 'KPIs' },
  { key: 'workplan', label: 'Workplan (activities)' },
  { key: 'project', label: 'Projects' },
  { key: 'risk', label: 'Risks' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'budget', label: 'Budget (categories, funding sources)' },
  { key: 'organization', label: 'Organization structure' },
];

export default function RolloverPage() {
  const [step, setStep] = useState<Step>(1);
  const [meta, setMeta] = useState<WizardMeta | null>(null);
  const [years, setYears] = useState<PlanningYear[]>([]);
  const [orgUnits, setOrgUnits] = useState<{ id: number; name: string }[]>([]);
  const [goals, setGoals] = useState<{ id: number; name: string }[]>([]);

  const getCsrfToken = (): string | null => {
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const parts = c.trim().split('=');
      if (parts[0] === 'ija_csrf') return decodeURIComponent(parts[1] || '');
    }
    return null;
  };

  const [sourceYearId, setSourceYearId] = useState<number | null>(null);
  const [targetYearId, setTargetYearId] = useState<number | null>(null);
  const [mode, setMode] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedOrgUnits, setSelectedOrgUnits] = useState<Set<number>>(new Set());
  const [selectedGoals, setSelectedGoals] = useState<Set<number>>(new Set());
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());

  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // ==================== DATA LOADING ====================
  const loadInitial = useCallback(async () => {
    try {
      const [metaRes, yearsRes] = await Promise.all([
        fetch('/api/rollover/items'),
        fetch('/api/planning/years'),
      ]);
      if (metaRes.ok) setMeta(await metaRes.json());
      if (yearsRes.ok) {
        const data = await yearsRes.json();
        const list: PlanningYear[] = Array.isArray(data) ? data : data.data || [];
        setYears(list);
        const active = list.find(y => y.status === 'active' || y.status === 'closed');
        if (active) setSourceYearId(active.id);
      }
      const [orgRes, goalRes] = await Promise.all([
        fetch('/api/crud/org-units'),
        fetch('/api/crud/goals'),
      ]);
      if (orgRes.ok) {
        const d = await orgRes.json();
        // CRUD returns { items: [...] } format
        setOrgUnits(Array.isArray(d) ? d : d.items || d.data || []);
      }
      if (goalRes.ok) {
        const d = await goalRes.json();
        // CRUD returns { items: [...] } format
        setGoals(Array.isArray(d) ? d : d.items || d.data || []);
      }
    } catch {
      setError('Failed to load wizard data');
    }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  // ==================== NAVIGATION ====================
  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<any>>>, v: any) => {
    setter(prev => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  };

  const selectAllItems = () => {
    if (!meta) return;
    setSelectedItems(new Set(meta.structureItems.map(i => i.key)));
  };

  const buildRequest = () => {
    const req: any = { sourceYearId, targetYearId, mode };
    if (mode === 'selected') req.items = Array.from(selectedItems);
    if (mode === 'org_unit') req.orgUnitIds = Array.from(selectedOrgUnits);
    if (mode === 'goal') req.goalIds = Array.from(selectedGoals);
    if (mode === 'module') req.modules = Array.from(selectedModules);
    return req;
  };

  const runPreview = async () => {
    setBusy(true); setError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch('/api/rollover/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify(buildRequest()),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || `Preview failed (${res.status})`);
      }
      setPreview(await res.json());
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  const runExecute = async () => {
    setBusy(true); setError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch('/api/rollover/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify(buildRequest()),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || `Execution failed (${res.status})`);
      }
      setResult(await res.json());
      setStep(5);
    } catch (e: any) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  const canAdvanceFrom1 =
    !!sourceYearId && !!targetYearId && sourceYearId !== targetYearId;

  const canLeaveStep2 = canAdvanceFrom1 && (
    mode === 'all' ||
    (mode === 'selected' && selectedItems.size > 0) ||
    (mode === 'org_unit' && selectedOrgUnits.size > 0) ||
    (mode === 'goal' && selectedGoals.size > 0) ||
    (mode === 'module' && selectedModules.size > 0)
  );

  const sourceYear = years.find(y => y.id === sourceYearId);
  const targetYear = years.find(y => y.id === targetYearId);
  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Plan Rollover Wizard</h1>
          <p className="text-gray-500">Carry forward structure — never performance data</p>
          <div className="flex mt-4 space-x-2">
            {['Years', 'Select', 'Preview', 'Approve', 'Execute'].map((label, idx) => {
              const n = (idx + 1) as Step;
              return (
                <div key={label} className={`flex-1 text-center py-2 rounded text-sm font-medium ${
                  step === n ? 'bg-blue-600 text-white' : step > n ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {n}. {label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* STEP 1: YEARS */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-lg font-semibold">Select source and target years</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source year (copy from)</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={sourceYearId ?? ''}
                  onChange={e => setSourceYearId(Number(e.target.value))}
                >
                  <option value="">Select source…</option>
                  {years.map(y => (
                    <option key={y.id} value={y.id}>{y.year} — {y.label} ({y.status})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target year (copy to)</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={targetYearId ?? ''}
                  onChange={e => setTargetYearId(Number(e.target.value))}
                >
                  <option value="">Select target…</option>
                  {years.filter(y => y.id !== sourceYearId).map(y => (
                    <option key={y.id} value={y.id}>{y.year} — {y.label} ({y.status})</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Missing a year? Create it under Planning — the rollover works with any year, no setup needed.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                disabled={!sourceYearId || !targetYearId || sourceYearId === targetYearId}
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
              >
                Next: Select items
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-lg font-semibold">What should be carried forward?</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rollover mode</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {meta?.modes.map(m => (
                  <label key={m} className={`flex items-center p-3 border rounded-lg cursor-pointer ${mode === m ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="mr-2" />
                    <span className="text-sm">{MODE_LABELS[m] || m}</span>
                  </label>
                ))}
              </div>
            </div>
            {mode === 'selected' && meta && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Select items to copy</label>
                  <button onClick={selectAllItems} className="text-xs text-blue-600 hover:underline">Select all</button>
                </div>
                <div className="space-y-2">
                  {meta.structureItems.map(item => (
                    <label key={item.key} className={`flex items-start p-3 border rounded-lg cursor-pointer ${selectedItems.has(item.key) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <input type="checkbox" checked={selectedItems.has(item.key)} onChange={() => toggle(setSelectedItems, item.key)} className="mt-0.5 mr-3" />
                      <div>
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {mode === 'org_unit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select organization units</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {orgUnits.map(u => (
                    <label key={u.id} className={`flex items-center p-2 border rounded cursor-pointer ${selectedOrgUnits.has(u.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <input type="checkbox" checked={selectedOrgUnits.has(u.id)} onChange={() => toggle(setSelectedOrgUnits, u.id)} className="mr-2" />
                      <span className="text-sm">{u.name}</span>
                    </label>
                  ))}
                  {orgUnits.length === 0 && <p className="text-sm text-gray-500">No organization units available.</p>}
                </div>
              </div>
            )}
            {mode === 'goal' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select goals</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {goals.map(g => (
                    <label key={g.id} className={`flex items-center p-2 border rounded cursor-pointer ${selectedGoals.has(g.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <input type="checkbox" checked={selectedGoals.has(g.id)} onChange={() => toggle(setSelectedGoals, g.id)} className="mr-2" />
                      <span className="text-sm">{g.name}</span>
                    </label>
                  ))}
                  {goals.length === 0 && <p className="text-sm text-gray-500">No goals available for the source year.</p>}
                </div>
              </div>
            )}
            {mode === 'module' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select modules</label>
                <div className="space-y-2">
                  {MODULE_OPTIONS.map(m => (
                    <label key={m.key} className={`flex items-center p-3 border rounded-lg cursor-pointer ${selectedModules.has(m.key) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <input type="checkbox" checked={selectedModules.has(m.key)} onChange={() => toggle(setSelectedModules, m.key)} className="mr-3" />
                      <span className="text-sm">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {meta?.neverCopied && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="text-sm font-semibold text-amber-800 mb-2">Performance data that is NEVER copied</h3>
                <ul className="text-xs text-amber-700 space-y-1">
                  {meta.neverCopied.map(nc => (
                    <li key={nc.key}>• {nc.label} — {nc.reason}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={runPreview} disabled={busy} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
                {busy ? 'Analyzing…' : 'Next: Preview'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW */}
        {step === 3 && preview && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-lg font-semibold">Preview rollover</h2>
            <p className="text-sm text-gray-600">
              Copying from <strong>{preview.sourceYear.year} ({preview.sourceYear.label})</strong> to{' '}
              <strong>{preview.targetYear.year} ({preview.targetYear.label})</strong> using <em>{MODE_LABELS[preview.mode] || preview.mode}</em>.
            </p>
            {preview.protection.targetClosed && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                ⚠ Target year is closed — rollover will be blocked.
              </div>
            )}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Item</th>
                    <th className="text-right p-3">Source count</th>
                    <th className="text-center p-3">Will copy</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.items.map(item => (
                    <tr key={item.key} className="border-t">
                      <td className="p-3">{item.label}</td>
                      <td className="p-3 text-right">{item.sourceCount}</td>
                      <td className="p-3 text-center">
                        {item.copied ? (<span className="text-green-600 font-medium">✓</span>) : (<span className="text-gray-400">—</span>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">Never copied (performance data)</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                {preview.performanceNotCopied.map(nc => (
                  <li key={nc.key}>• {nc.label} — {nc.reason}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={() => setStep(4)} disabled={preview.protection.targetClosed} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
                Next: Approve
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: APPROVE */}
        {step === 4 && preview && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-lg font-semibold">Review and approve</h2>
            <p className="text-sm text-gray-600">
              Confirm the rollover. After execution, copied items will be in <strong>draft</strong> status and targets/dates will need review.
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">What happens on execution</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Structure items are copied with source-year reference preserved</li>
                <li>• Targets, baselines, and progress are reset for the new year</li>
                <li>• Approval status is reset to <strong>draft</strong></li>
                <li>• Performance data (actuals, history) is never copied</li>
                <li>• The operation is idempotent — re-running will not duplicate</li>
              </ul>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={runExecute} disabled={busy} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 font-medium">
                {busy ? 'Executing…' : 'Execute rollover'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: RESULT */}
        {step === 5 && result && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-lg font-semibold text-green-700">Rollover complete</h2>
            <p className="text-sm text-gray-600">
              Rolled over from <strong>{result.sourceYear}</strong> to <strong>{result.targetYear}</strong>. Job ID: {result.jobId}.
            </p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Item</th>
                    <th className="text-right p-3">Copied</th>
                    <th className="text-right p-3">Skipped</th>
                    <th className="text-right p-3">Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.summary.copied).map(([key, val]) => (
                    <tr key={key} className="border-t">
                      <td className="p-3 capitalize">{key.replace(/_/g, ' ')}</td>
                      <td className="p-3 text-right text-green-600 font-medium">{val.copied}</td>
                      <td className="p-3 text-right text-gray-500">{val.skipped}</td>
                      <td className="p-3 text-right text-red-600">{val.failed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between">
              <button onClick={() => { setStep(1); setPreview(null); setResult(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Start new rollover</button>
              <a href="/planning" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Go to planning</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}