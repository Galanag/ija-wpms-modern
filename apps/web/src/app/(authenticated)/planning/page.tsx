'use client';

import { useState, useEffect } from 'react';
import { request } from '@/lib/api';

interface PlanningYear {
  id: number;
  year: number;
  label: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

interface Plan {
  id: number;
  name: string;
  description?: string;
  version: number;
  isCurrent: boolean;
  planningType: string;
  workflowState: {
    code: string;
    name: string;
  };
  year: {
    id: number;
    year: number;
  };
  owner?: {
    fullName: string;
  };
}

interface WorkflowTransition {
  action: string;
  toState: string;
  requiresRole?: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  active: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-orange-100 text-orange-800',
  archived: 'bg-red-100 text-red-800',
};

export default function PlanningPage() {
  const [years, setYears] = useState<PlanningYear[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateYear, setShowCreateYear] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showCopyPlan, setShowCopyPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newYear, setNewYear] = useState({ year: '', label: '' });
  const [newPlan, setNewPlan] = useState({ name: '', description: '', planningType: 'annual' });

  // Planning years are DATA, not code. Derive the placeholder hint from the
  // loaded years (latest + 1) instead of hardcoding a stale year token.
  const suggestedYear = years.length
    ? Math.max(...years.map(y => y.year)) + 1
    : new Date().getFullYear() + 1;
  const [copyOptions, setCopyOptions] = useState({
    sourcePlanId: 0,
    targetYearId: 0,
    copyGoals: true,
    copyObjectives: true,
    copyActivities: true,
    copyKpis: true,
    copyBudgets: false,
    resetTargets: true,
    resetProgress: true,
  });

  useEffect(() => {
    fetchYears();
    fetchPlans();
  }, []);

  const fetchYears = async () => {
    try {
      const data = await request<any[]>('/planning/years');
      setYears(data);
      if (data.length > 0 && !selectedYear) {
        setSelectedYear(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch years:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const data = await request<any[]>('/planning/plans');
      setPlans(data);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    }
  };

  const createYear = async () => {
    if (!newYear.year) return;
    try {
      await request('/planning/years', {
        method: 'POST',
        body: JSON.stringify({
          year: parseInt(newYear.year),
          label: newYear.label || `${newYear.year} Planning Year`
        })
      });
      setShowCreateYear(false);
      setNewYear({ year: '', label: '' });
      fetchYears();
    } catch (err: any) {
      setError(err.message || 'Failed to create year');
    }
  };

  const createPlan = async () => {
    if (!selectedYear || !newPlan.name) return;
    try {
      await request('/planning/plans', {
        method: 'POST',
        body: JSON.stringify({
          yearId: selectedYear,
          name: newPlan.name,
          description: newPlan.description,
          planningType: newPlan.planningType
        })
      });
      setShowCreatePlan(false);
      setNewPlan({ name: '', description: '', planningType: 'annual' });
      fetchPlans();
    } catch (err: any) {
      setError(err.message || 'Failed to create plan');
    }
  };

  const copyPlan = async () => {
    if (!copyOptions.sourcePlanId || !copyOptions.targetYearId) return;
    try {
      await request('/planning/plans/copy', {
        method: 'POST',
        body: JSON.stringify(copyOptions),
      });
      setShowCopyPlan(false);
      fetchPlans();
    } catch (err: any) {
      setError(err.message || 'Failed to copy plan');
    }
  };

  const performTransition = async (planId: number, action: string) => {
    try {
      await request(`/planning/plans/${planId}/transition`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      fetchPlans();
    } catch (err: any) {
      setError(err.message || 'Failed to perform transition');
    }
  };

  const getTransitions = async (planId: number): Promise<WorkflowTransition[]> => {
    try {
      const res = await fetch(`/api/planning/plans/${planId}/transitions`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Failed to get transitions');
    }
    return [];
  };

  const filteredPlans = selectedYear
    ? plans.filter(p => p.year.id === selectedYear)
    : plans;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading planning data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Planning Management</h1>
          <p className="text-gray-600 mt-2">Year-Independent Planning Engine</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">
            {error}
            <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
          </div>
        )}

        {/* Year Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            {years.map(year => (
              <button
                key={year.id}
                onClick={() => setSelectedYear(year.id)}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  selectedYear === year.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {year.year} - {year.status}
              </button>
            ))}
            <button
              onClick={() => setShowCreateYear(true)}
              className="px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              + New Year
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowCreatePlan(true)}
            disabled={!selectedYear}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Create Plan
          </button>
          <button
            onClick={() => {
              if (filteredPlans.length > 0) {
                setCopyOptions({
                  ...copyOptions,
                  sourcePlanId: filteredPlans[0]?.id ?? 0,
                  targetYearId: selectedYear || 0
                });
                setShowCopyPlan(true);
              }
            }}
            disabled={filteredPlans.length === 0 || !selectedYear}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Copy Previous Year
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onTransition={performTransition}
            />
          ))}
          {filteredPlans.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No plans found. Create one to get started.
            </div>
          )}
        </div>
      </div>

      {/* Create Year Modal */}
      {showCreateYear && (
        <Modal onClose={() => setShowCreateYear(false)} title="Create Planning Year">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <input
                type="number"
                value={newYear.year}
                onChange={e => setNewYear({ ...newYear, year: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder={String(suggestedYear)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Label (optional)</label>
              <input
                type="text"
                value={newYear.label}
                onChange={e => setNewYear({ ...newYear, label: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder={`${suggestedYear} Planning Year`}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateYear(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createYear}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Plan Modal */}
      {showCreatePlan && (
        <Modal onClose={() => setShowCreatePlan(false)} title="Create Plan">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Plan Name</label>
              <input
                type="text"
                value={newPlan.name}
                onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Annual Plan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newPlan.description}
                onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Planning Type</label>
              <select
                value={newPlan.planningType}
                onChange={e => setNewPlan({ ...newPlan, planningType: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="annual">Annual</option>
                <option value="quarterly">Quarterly</option>
                <option value="mid_year">Mid-Year</option>
                <option value="strategic">Strategic</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreatePlan(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createPlan}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Copy Plan Modal */}
      {showCopyPlan && (
        <Modal onClose={() => setShowCopyPlan(false)} title="Copy Plan to New Year">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Source Plan</label>
              <select
                value={copyOptions.sourcePlanId}
                onChange={e => setCopyOptions({ ...copyOptions, sourcePlanId: parseInt(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select a plan</option>
                {filteredPlans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (v{p.version})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Year</label>
              <select
                value={copyOptions.targetYearId}
                onChange={e => setCopyOptions({ ...copyOptions, targetYearId: parseInt(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select a year</option>
                {years.map(y => (
                  <option key={y.id} value={y.id}>{y.year} - {y.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">What to Copy</label>
              {[
                { key: 'copyGoals', label: 'Goals' },
                { key: 'copyObjectives', label: 'Objectives' },
                { key: 'copyActivities', label: 'Activities' },
                { key: 'copyKpis', label: 'KPIs' },
              ].map(item => (
                <label key={item.key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={copyOptions[item.key as keyof typeof copyOptions] as boolean}
                    onChange={e => setCopyOptions({ ...copyOptions, [item.key]: e.target.checked })}
                    className="mr-2"
                  />
                  {item.label}
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Options</label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={copyOptions.resetTargets}
                  onChange={e => setCopyOptions({ ...copyOptions, resetTargets: e.target.checked })}
                  className="mr-2"
                />
                Reset target values (require review)
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={copyOptions.resetProgress}
                  onChange={e => setCopyOptions({ ...copyOptions, resetProgress: e.target.checked })}
                  className="mr-2"
                />
                Reset progress (start fresh)
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCopyPlan(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={copyPlan}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Copy Plan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Plan Card Component
function PlanCard({ plan, onTransition }: { plan: Plan; onTransition: (id: number, action: string) => void }) {
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [loadingTransitions, setLoadingTransitions] = useState(false);

  const loadTransitions = async () => {
    if (transitions.length > 0) return;
    setLoadingTransitions(true);
    try {
      const res = await fetch(`/api/planning/plans/${plan.id}/transitions`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setTransitions(await res.json());
      }
    } catch (err) {
      console.error('Failed to load transitions');
    } finally {
      setLoadingTransitions(false);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow p-6"
      onMouseEnter={loadTransitions}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
          <p className="text-sm text-gray-500">Version {plan.version}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[plan.workflowState.code] || 'bg-gray-100'}`}>
          {plan.workflowState.name}
        </span>
      </div>

      {plan.description && (
        <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
      )}

      <div className="text-sm text-gray-500 mb-4">
        {plan.owner && <p>Owner: {plan.owner?.fullName}</p>}
        <p>Type: {plan.planningType}</p>
      </div>

      {transitions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {transitions.map(t => (
            <button
              key={t.action}
              onClick={() => onTransition(plan.id, t.action)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              {t.action.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}
      {loadingTransitions && (
        <p className="text-sm text-gray-400">Loading actions...</p>
      )}
    </div>
  );
}

// Modal Component
function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
