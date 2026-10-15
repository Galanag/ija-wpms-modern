'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { request } from '@/lib/api';

interface KpiDetail {
  id: number;
  name: string;
  code: string;
  description?: string;
  unit?: string;
  category?: string;
  direction?: string;
  active?: boolean;
  createdAt?: string;
  plans?: Array<{
    id: number;
    yearId: number;
    annualTarget: number;
    approvalStatus: string;
    PlanningYear?: { id: number; year: number; label: string };
  }>;
}

interface KpiMetrics {
  planId: number;
  target: number;
  actual: number;
  achievementPercentage: number | null;
  variance: number;
  status: string;
  trend: string;
}

interface TrendPoint {
  period: string;
  value: number;
  date: string;
}

export default function KpiDetailPage() {
  const params = useParams();
  const kpiId = Number(params.id);
  const [kpi, setKpi] = useState<KpiDetail | null>(null);
  const [metrics, setMetrics] = useState<KpiMetrics | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [kpiData, plansData] = await Promise.all([
          request<KpiDetail>(`/kpi/definitions/${kpiId}`),
          request<{ data: any[] }>(`/kpi/plans?kpiId=${kpiId}&limit=10`).catch(() => ({ data: [] })),
        ]);
        setKpi(kpiData);
        if (plansData.data && plansData.data.length > 0) {
          setSelectedPlanId(plansData.data[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load KPI');
      } finally {
        setLoading(false);
      }
    };
    if (kpiId) fetchData();
  }, [kpiId]);

  useEffect(() => {
    const fetchPlanData = async () => {
      if (!selectedPlanId) return;
      try {
        const [metricsData, trendData] = await Promise.all([
          request<KpiMetrics>(`/kpi/metrics/${selectedPlanId}`),
          request<TrendPoint[]>(`/kpi/trend/${selectedPlanId}`).catch(() => []),
        ]);
        setMetrics(metricsData);
        setTrend(Array.isArray(trendData) ? trendData : []);
      } catch {
        // ignore plan data errors
      }
    };
    if (selectedPlanId) fetchPlanData();
  }, [selectedPlanId]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !kpi) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error || 'KPI not found'}</p>
        </div>
      </div>
    );
  }

  const currentPlan = kpi.plans?.find(p => p.id === selectedPlanId);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">KPI Detail</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">{kpi.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Code: {kpi.code} {kpi.category && `• ${kpi.category}`}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Target</p>
          <p className="text-2xl font-bold text-gray-900">{metrics?.target?.toLocaleString() || '-'} {kpi.unit || ''}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Actual</p>
          <p className="text-2xl font-bold text-gray-900">{metrics?.actual?.toLocaleString() || '-'} {kpi.unit || ''}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Achievement</p>
          <p className="text-2xl font-bold text-gray-900">{metrics?.achievementPercentage !== null && metrics?.achievementPercentage !== undefined ? `${metrics.achievementPercentage.toFixed(1)}%` : '-'}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Variance</p>
          <p className="text-2xl font-bold text-gray-900">{metrics?.variance?.toLocaleString() || '-'}</p>
        </div>
      </div>

      {kpi.description && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Description</h2>
          <p className="text-sm text-gray-700">{kpi.description}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Planning History</h2>
        {kpi.plans && kpi.plans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {kpi.plans.map((plan) => (
                  <tr key={plan.id} className={selectedPlanId === plan.id ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-2 text-sm">{plan.PlanningYear?.label || plan.PlanningYear?.year || plan.yearId}</td>
                    <td className="px-4 py-2 text-sm">{plan.annualTarget?.toLocaleString()} {kpi.unit || ''}</td>
                    <td className="px-4 py-2 text-sm capitalize">{plan.approvalStatus?.replace('_', ' ')}</td>
                    <td className="px-4 py-2 text-sm">
                      <button
                        onClick={() => setSelectedPlanId(plan.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No planning history available</p>
        )}
      </div>

      {trend.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance Trend</h2>
          <div className="space-y-2">
            {trend.map((point, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{point.period}</span>
                <span className="font-medium">{point.value?.toLocaleString()} {kpi.unit || ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
