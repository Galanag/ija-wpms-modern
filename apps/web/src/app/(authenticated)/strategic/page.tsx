'use client';

import { useState, useEffect } from 'react';
import { request } from '@/lib/api';

interface Theme { id: number; name: string; code?: string; description?: string; color?: string; orderIndex: number; active: boolean; results: Result[]; }
interface Result { id: number; name: string; code?: string; description?: string; expectedOutcome?: string; orderIndex: number; active: boolean; goals: Goal[]; }
interface Goal { id: number; name: string; code?: string; description?: string; strategicObjective?: string; status: string; orderIndex: number; yearId: number; objectives: Objective[]; }
interface Objective { id: number; name: string; code?: string; description?: string; measurableOutcome?: string; targetValue?: number; baselineValue?: number; unit?: string; status: string; orderIndex: number; kpiPlans: any[]; }
interface Plan { id: number; name: string; description?: string; vision?: string; mission?: string; status: string; isActive: boolean; themes: Theme[]; }

export default function StrategicManagementPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [years, setYears] = useState<{ id: number; year: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedThemes, setExpandedThemes] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchYears();
    fetchPlans();
  }, []);

  const fetchYears = async () => {
    try {
      const res = await fetch('/api/planning/years');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setYears(data);
          const active = data.find((y: any) => y.status === 'active');
          setSelectedYear(active?.id || data[0]?.id || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch years:', err);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/strategic/plans');
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
      const active = data.find((p: Plan) => p.isActive);
      if (active) setActivePlan(active);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch plans:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = (themeId: number) => {
    setExpandedThemes(prev => {
      const next = new Set(prev);
      if (next.has(themeId)) next.delete(themeId);
      else next.add(themeId);
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'achieved': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreatePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    
    try {
      await request('/strategic/plans', {
        method: 'POST',
        body: JSON.stringify({
          name: data.get('name'),
          description: data.get('description'),
          vision: data.get('vision'),
          mission: data.get('mission'),
        }),
      });
      setShowCreateModal(false);
      fetchPlans();
    } catch (err: any) {
      console.error('Failed to create plan:', err);
      setCreateError(err?.message || 'Failed to create plan. Please try again.');
    }
  };

  const stats = {
    themes: activePlan?.themes?.length ?? 0,
    results: activePlan?.themes?.reduce((acc, t) => acc + t.results.length, 0) ?? 0,
    goals: activePlan?.themes?.reduce((acc, t) => acc + t.results.reduce((a, r) => a + r.goals.length, 0), 0) ?? 0,
    objectives: activePlan?.themes?.reduce((acc, t) => acc + t.results.reduce((a, r) => a + r.goals.reduce((g, goal) => g + goal.objectives.length, 0), 0), 0) ?? 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchPlans} className="bg-indigo-600 text-white px-4 py-2 rounded">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Strategic Management</h1>
          <p className="mt-2 text-gray-600">Manage strategic plans, themes, results, goals, and objectives</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.themes}</div>
            <div className="text-sm text-gray-500">Themes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.results}</div>
            <div className="text-sm text-gray-500">Results</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.goals}</div>
            <div className="text-sm text-gray-500">Goals</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.objectives}</div>
            <div className="text-sm text-gray-500">Objectives</div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {years.map(y => (
              <button
                key={y.id}
                onClick={() => setSelectedYear(y.year)}
                className={`px-4 py-2 rounded ${selectedYear === y.year ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {y.year}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            New Strategic Plan
          </button>
        </div>

        {/* Strategic Plan Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Strategic Plans</h2>
          <div className="flex gap-3 flex-wrap">
            {plans.map(plan => (
              <button
                key={plan.id}
                onClick={() => setActivePlan(plan)}
                className={`px-4 py-2 rounded-lg border ${activePlan?.id === plan.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <span className="font-medium">{plan.name}</span>
                {plan.isActive && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Active</span>}
              </button>
            ))}
            {plans.length === 0 && (
              <p className="text-gray-500 italic">No strategic plans created yet.</p>
            )}
          </div>
        </div>

        {/* Strategic Hierarchy */}
        {activePlan && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{activePlan.name}</h2>
                {activePlan.description && <p className="text-gray-600 mt-1">{activePlan.description}</p>}
                {activePlan.vision && <p className="text-sm text-gray-500 mt-2"><strong>Vision:</strong> {activePlan.vision}</p>}
                {activePlan.mission && <p className="text-sm text-gray-500"><strong>Mission:</strong> {activePlan.mission}</p>}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${activePlan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {activePlan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Themes */}
            <div className="space-y-4">
              {activePlan.themes?.map(theme => (
                <div key={theme.id} className="border rounded-lg">
                  <button
                    onClick={() => toggleTheme(theme.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-4 h-4 rounded-full ${theme.color || 'bg-blue-500'}`}></span>
                      <span className="font-semibold text-lg">{theme.name}</span>
                      {theme.code && <span className="text-gray-400 text-sm">{theme.code}</span>}
                    </div>
                    <span className="text-gray-400">{expandedThemes.has(theme.id) ? '−' : '+'}</span>
                  </button>

                  {expandedThemes.has(theme.id) && theme.results?.length > 0 && (
                    <div className="border-t p-4 bg-gray-50">
                      {/* Strategic Results */}
                      {theme.results.map(result => (
                        <div key={result.id} className="ml-6 mt-4 first:mt-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-800">{result.name}</span>
                            {result.code && <span className="text-gray-400 text-xs">{result.code}</span>}
                          </div>
                          {result.description && <p className="text-sm text-gray-600 mb-3">{result.description}</p>}

                          {/* Goals */}
                          <div className="ml-6 space-y-2">
                            {result.goals?.map(goal => (
                              <div key={goal.id} className="bg-white rounded p-3 border">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-700">{goal.name}</span>
                                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(goal.status)}`}>{goal.status}</span>
                                </div>
                                {goal.description && <p className="text-sm text-gray-500 mb-2">{goal.description}</p>}

                                {/* Objectives */}
                                <div className="ml-4 space-y-1">
                                  {goal.objectives?.map(obj => (
                                    <div key={obj.id} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                                      <span className="text-gray-600">{obj.name}</span>
                                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(obj.status)}`}>{obj.status}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!activePlan && plans.length > 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">Select a strategic plan to view its details.</p>
          </div>
        )}

        {plans.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No strategic plans found. Create your first plan to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Create Strategic Plan
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Create New Strategic Plan</h2>
            {createError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{createError}</p>}
            <form onSubmit={handleCreatePlan}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan Name *</label>
                  <input type="text" name="name" required className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea name="description" rows={3} className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vision</label>
                  <textarea name="vision" rows={2} className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mission</label>
                  <textarea name="mission" rows={2} className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Create Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
