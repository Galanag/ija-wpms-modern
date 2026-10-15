'use client';
import { KpiCreateModal } from './components/kpi-create-modal';
import { KpiActualModal } from './components/kpi-actual-modal';

import { useState, useEffect } from 'react';
import { request } from '@/lib/api';

interface KpiDefinition {
  id: number;
  code: string;
  name: string;
  description?: string;
  area?: string;
  definition?: string;
  formula?: string;
  unit?: string;
  frequency: string;
  direction: string;
  category?: { id: number; name: string };
}

interface KpiPlan {
  id: number;
  yearId: number;
  kpiId: number;
  baselineValue?: number;
  annualTarget?: number;
  q1Target?: number;
  q2Target?: number;
  q3Target?: number;
  q4Target?: number;
  weight: number;
  approvalStatus: string;
  kpi: KpiDefinition;
  year: { id: number; year: number };
  orgUnit?: { id: number; name: string };
  actuals: KpiActual[];
}

interface KpiActual {
  id: number;
  kpiPlanId: number;
  periodType: string;
  periodKey: string;
  actualValue: number;
  comment?: string;
  evidence?: string;
  approvalStatus: string;
}

interface KpiMetrics {
  target: number | null;
  actual: number | null;
  achievementPercentage: number | null;
  variance: number | null;
  status: string;
  trend: string;
}

interface KpiActualDisplay {
  id: number;
  kpiPlanId: number;
  periodType: string;
  periodKey: string;
  actualValue: number;
  comment?: string;
  approvalStatus: string;
  submittedAt?: string;
  verifiedAt?: string;
}

interface DashboardStats {
  totalTarget: number;
  totalActual: number;
  weightedAchievement: number;
  count: number;
  onTrack: number;
  atRisk: number;
  belowTarget: number;
}

export default function KpiDashboard() {
    const [plans, setPlans] = useState<KpiPlan[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [kpiDefinitions, setKpiDefinitions] = useState<KpiDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<{ id: number; year: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showActualModal, setShowActualModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<KpiPlan | null>(null);
  const [metrics, setMetrics] = useState<Record<number, KpiMetrics>>({});
  const [actuals, setActuals] = useState<Record<number, KpiActualDisplay[]>>({});
  const [showActualsPanel, setShowActualsPanel] = useState(false);
  const [selectedPlanForActuals, setSelectedPlanForActuals] = useState<number | null>(null);

  // Fetch available years on mount
  useEffect(() => {
    fetchYears();
  }, []);

  // Fetch data when year changes
  useEffect(() => {
    if (selectedYear) {
      fetchData();
    }
  }, [selectedYear, selectedOrgUnit, selectedCategory]);

  const fetchYears = async () => {
    try {
      const res = await fetch('/api/planning/years');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setYears(data);
          // Select active year or first year
          const active = data.find((y: any) => y.status === 'active');
          setSelectedYear(active?.id || data[0]?.id || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch years:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ yearId: selectedYear.toString() });
      if (selectedOrgUnit) params.append('orgUnitId', selectedOrgUnit.toString());
      if (selectedCategory) params.append('categoryId', selectedCategory.toString());
      
      const [plansRes, catsRes, statsRes] = await Promise.all([
        fetch(`/api/kpi/plans?${params}`),
        fetch('/api/kpi/categories'),
        fetch(`/api/kpi/dashboard/metrics?${params}`),
      ]);
      
      // Check response status before parsing
      if (!plansRes.ok) {
        throw new Error(`Failed to fetch plans: ${plansRes.status}`);
      }
      
      const plansData = await plansRes.json();
      const catsData = await catsRes.json();
      const statsData = await statsRes.json();
      
      // Properly handle API response - ensure array
      if (Array.isArray(plansData)) {
        setPlans(plansData);
        // Fetch metrics for each plan
        const metricsMap: Record<number, KpiMetrics> = {};
        const actualsMap: Record<number, KpiActualDisplay[]> = {};
        for (const plan of plansData) {
          try {
            const metricsRes = await fetch(`/api/kpi/metrics/${plan.id}`);
            if (metricsRes.ok) {
              const metricsData = await metricsRes.json();
              metricsMap[plan.id] = metricsData;
            }
          } catch (e) {
            console.error(`Failed to fetch metrics for plan ${plan.id}:`, e);
          }
          try {
            const actualsRes = await fetch(`/api/kpi/actuals/${plan.id}`);
            if (actualsRes.ok) {
              const actualsData = await actualsRes.json();
              actualsMap[plan.id] = actualsData;
            }
          } catch (e) {
            console.error(`Failed to fetch actuals for plan ${plan.id}:`, e);
          }
        }
        setMetrics(metricsMap);
        setActuals(actualsMap);
      } else {
        // API returned error or non-array response
        console.warn('Plans API returned non-array:', plansData);
        setPlans([]);
      }
      
      setCategories(Array.isArray(catsData) ? catsData : []);
      setStats(statsData && !plansRes.ok ? statsData : null);
      
    } catch (err: any) {
      console.error('Failed to fetch KPI data:', err);
      setError(err.message || 'Failed to load data');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-green-100 text-green-800';
      case 'at_risk': return 'bg-yellow-100 text-yellow-800';
      case 'below_target': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && plans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading KPIs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-2">Error Loading KPIs</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchData()}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">KPI Management</h1>
            <p className="text-gray-600 mt-1">Track and manage key performance indicators</p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border rounded-lg px-3 py-2"
            >
              {years.map(y => (
                <option key={y.id} value={y.id}>Year {y.year}</option>
              ))}
            </select>
            <button
              onClick={() => setShowKpiModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              New KPI
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900">{stats.count}</div>
              <div className="text-sm text-gray-500">Total KPIs</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">{stats.weightedAchievement.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">Achievement</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.onTrack}</div>
              <div className="text-sm text-gray-500">On Track</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.atRisk + stats.belowTarget}</div>
              <div className="text-sm text-gray-500">Needs Attention</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedOrgUnit || ''}
              onChange={(e) => setSelectedOrgUnit(e.target.value ? parseInt(e.target.value) : null)}
              className="border rounded px-3 py-2"
            >
              <option value="">All Units</option>
            </select>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
              className="border rounded px-3 py-2"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Plans Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">KPI Plans</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">KPI</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Target</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Achievement</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No KPI plans found. Create a new KPI plan to get started.
                  </td>
                </tr>
              ) : (
                plans.map((plan) => {
                  const m = metrics[plan.id];
                  const status = m?.status || 'no_data';
                  const achievement = m?.achievementPercentage;
                  return (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{plan.kpi?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{plan.kpi?.code}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">{plan.annualTarget?.toLocaleString() || '-'}</td>
                      <td className="px-4 py-3 text-right text-sm">{m?.actual?.toLocaleString() || '-'}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        {achievement != null ? `${achievement.toFixed(1)}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {m?.variance != null ? (m.variance >= 0 ? '+' : '') + m.variance.toFixed(0) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { setSelectedPlan(plan); setShowActualModal(true); }}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Enter Actual
                        </button>
                        <button
                          onClick={() => { setSelectedPlanForActuals(plan.id); setShowActualsPanel(true); }}
                          className="text-blue-600 hover:text-blue-900 text-sm ml-2"
                        >
                          View Actuals
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Target Entry Table */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quarterly Targets</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">KPI</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Annual</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Q1</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Q2</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Q3</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Q4</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm">{plan.kpi?.name || 'Unknown'}</td>
                  <td className="px-3 py-2 text-right text-sm">{plan.annualTarget?.toLocaleString() || '-'}</td>
                  <td className="px-3 py-2 text-right text-sm">{plan.q1Target?.toLocaleString() || '-'}</td>
                  <td className="px-3 py-2 text-right text-sm">{plan.q2Target?.toLocaleString() || '-'}</td>
                  <td className="px-3 py-2 text-right text-sm">{plan.q3Target?.toLocaleString() || '-'}</td>
                  <td className="px-3 py-2 text-right text-sm">{plan.q4Target?.toLocaleString() || '-'}</td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                    No KPI plans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* KPI Definitions Section */}
        {plans.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">KPI Definitions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{plan.kpi?.name || 'Unknown'}</h3>
                  <p className="text-xs text-gray-500">{plan.kpi?.code}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="text-gray-500">Unit:</span> {plan.kpi?.unit || '-'}</p>
                    <p><span className="text-gray-500">Direction:</span> {plan.kpi?.direction?.replace('_', ' ') || '-'}</p>
                    <p><span className="text-gray-500">Frequency:</span> {plan.kpi?.frequency || '-'}</p>
                    {plan.kpi?.formula && <p><span className="text-gray-500">Formula:</span> {plan.kpi.formula}</p>}
                  </div>
                </div>
              ))}

            </div>
          </div>
        )}

        {/* Actuals Panel */}
        {showActualsPanel && selectedPlanForActuals && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">KPI Actuals - {selectedPlan?.kpi?.name || 'Unknown'}</h2>
              <button
                onClick={() => { setShowActualsPanel(false); setSelectedPlanForActuals(null); }}
                className="px-3 py-1 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            {actuals[selectedPlanForActuals]?.length === 0 ? (
              <p className="text-gray-500">No actuals recorded yet.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comment</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(actuals[selectedPlanForActuals] || []).map((actual) => (
                    <tr key={actual.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{actual.periodType}:{actual.periodKey}</td>
                      <td className="px-4 py-3 text-right text-sm">{actual.actualValue?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{actual.comment || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(actual.approvalStatus || 'draft')}`}>
                          {(actual.approvalStatus || 'draft').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {actual.approvalStatus === 'submitted' && (
                          <button
                            onClick={async () => {
                              try {
                                await request(`/kpi/actuals/${actual.id}/verify`, {
                                  method: 'POST',
                                  body: JSON.stringify({ userId: 1 }),
                                });
                                fetchData();
                              } catch (err: any) {
                                alert(err.message || 'Failed to verify');
                              }
                            }}
                            className="text-green-600 hover:text-green-900 text-sm"
                          >
                            Verify
                          </button>
                        )}
                        {(actual.approvalStatus === 'draft' || actual.approvalStatus === 'rejected') && (
                          <button
                            onClick={async () => {
                              try {
                                await request(`/kpi/actuals/${actual.id}`, {
                                  method: 'PUT',
                                  body: JSON.stringify({ actualValue: actual.actualValue }),
                                });
                                fetchData();
                              } catch (err: any) {
                                alert(err.message || 'Failed to edit');
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Create KPI Modal */}
        {showKpiModal && (
                    <KpiCreateModal
            open={showKpiModal}
            yearId={selectedYear}
            kpiDefinitions={kpiDefinitions}
            onClose={() => setShowKpiModal(false)}
            onSuccess={() => { setShowKpiModal(false); fetchData(); }}
          />
        )}

        {/* Enter Actual Modal */}
        {showActualModal && selectedPlan && (
                    <KpiActualModal
            open={showActualModal}
            planId={selectedPlan.id}
            kpiName={selectedPlan.kpi?.name || 'Unknown'}
            yearId={selectedYear}
            onClose={() => { setShowActualModal(false); setSelectedPlan(null); }}
            onSuccess={() => { setShowActualModal(false); setSelectedPlan(null); fetchData(); }}
          />
        )}
      </div>
    </div>
  );
}
