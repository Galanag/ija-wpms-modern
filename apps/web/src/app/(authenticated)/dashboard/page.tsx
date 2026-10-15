'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/api';
import { DashboardData } from '@/lib/dashboard-types';
import { ExecutiveKpiCards } from '@/components/dashboard/executive-kpi-cards';
import { KpiTrendChart } from '@/components/dashboard/kpi-trend-chart';
import { BudgetPerformanceChart } from '@/components/dashboard/budget-performance-chart';
import { ActivityStatusChart } from '@/components/dashboard/activity-status-chart';
import { formatCurrency as fmtAmount, getCurrencies, getCurrencyById, Currency } from '@/lib/currency';
import { RiskSeverityChart } from '@/components/dashboard/risk-severity-chart';
import { ComplianceChart } from '@/components/dashboard/compliance-chart';
import { StrategicGoalsChart } from '@/components/dashboard/strategic-goals-chart';
import { ProjectPortfolioChart } from '@/components/dashboard/project-portfolio-chart';
import { ExecutiveAlertsPanel } from '@/components/dashboard/executive-alerts-panel';

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-24 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-gray-200 rounded-xl" />
        <div className="h-80 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-16">
      <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to load dashboard data</h3>
      <p className="text-gray-500 mb-4">There was an error fetching the dashboard data. Please try again.</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

export default function ExecutiveDashboard() {
  const [selectedYearId, setSelectedYearId] = useState<number | undefined>(undefined);
  const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<number | undefined>(undefined);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState<Currency | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', selectedYearId, selectedOrgUnitId, selectedQuarter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedYearId) params.set('yearId', selectedYearId.toString());
      if (selectedOrgUnitId) params.set('orgUnitId', selectedOrgUnitId.toString());
      if (selectedQuarter) params.set('quarter', selectedQuarter);
      return await request<DashboardData>(`/dashboard?${params.toString()}`);
    },
  });

  useEffect(() => {
    if (data?.currentYear && !selectedYearId) {
      setSelectedYearId(data.currentYear.id);
    }
  }, [data, selectedYearId]);

  // Load the currency catalog (ETB default) for money formatting.
  useEffect(() => {
    (async () => {
      try {
        const list = await getCurrencies();
        setCurrencies(list);
        setDefaultCurrency(list.find((c) => c.isDefault) || list[0] || null);
      } catch {
        // ignore - fall back to ETB defaults in the formatter
      }
    })();
  }, []);

  const handleYearChange = (yearId: number) => setSelectedYearId(yearId);
  const handleOrgUnitChange = (orgUnitId: number) => setSelectedOrgUnitId(orgUnitId);
  const handleQuarterChange = (quarter: string) => setSelectedQuarter(quarter);

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">Executive overview</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Plans, Performance, Resources & Execution</h1>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">Executive overview</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Plans, Performance, Resources & Execution</h1>
        </div>
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const currentYear = data.currentYear;
  // Header reflects the year the user selected, falling back to the API's current year
  const headerYear = data.planningYears?.find((y: any) => y.id === selectedYearId) || currentYear;

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">Executive overview</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Plans, Performance, Resources & Execution</h1>
        {headerYear && (
          <p className="mt-2 text-sm text-gray-500">
            {headerYear.label || headerYear.year} fiscal year
            {selectedQuarter && ` • ${selectedQuarter}`}
          </p>
        )}
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <label htmlFor="dash-year" className="text-sm font-medium text-gray-600">Planning Year:</label>
          <select
            id="dash-year"
            value={selectedYearId || ''}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Years</option>
            {data.planningYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.label || year.year}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="dash-quarter" className="text-sm font-medium text-gray-600">Quarter:</label>
          <select
            id="dash-quarter"
            value={selectedQuarter}
            onChange={(e) => handleQuarterChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Quarters</option>
            {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <ExecutiveKpiCards data={data} currency={defaultCurrency} />

      {/* Executive Alerts */}
      {data.executiveAlerts.length > 0 && (
        <ExecutiveAlertsPanel alerts={data.executiveAlerts} />
      )}

      {/* Recent Activity */}
      {data.recentActivity?.length > 0 && (
        <section className="mb-6 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {data.recentActivity.slice(0, 8).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">{activity.user?.fullName || 'System'}</span>
                    {' '}{activity.action.toLowerCase()}{' '}
                    <span className="font-mono text-xs bg-gray-200 px-1 rounded">{activity.entity}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KPI Trend Chart */}
      {data.kpi.trend.length > 0 && (
        <section className="mb-6">
          <KpiTrendChart data={data.kpi.trend} />
        </section>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {data.budget.quarterly.length > 0 && (
          <BudgetPerformanceChart data={data.budget.quarterly} />
        )}

        {data.activities.total > 0 && (
          <ActivityStatusChart data={data.activities.byStatus} total={data.activities.total} />
        )}

        {data.risks.total > 0 && (
          <RiskSeverityChart data={data.risks.bySeverity} total={data.risks.total} highCount={data.risks.highCount} criticalCount={data.risks.criticalCount} />
        )}

        {data.compliance.total > 0 && (
          <ComplianceChart data={data.compliance.byStatus} total={data.compliance.total} complianceRate={data.compliance.complianceRate} />
        )}
      </div>

      {/* Strategic Goals Chart */}
      {data.goals.byTheme.length > 0 && (
        <section className="mb-6">
          <StrategicGoalsChart data={data.goals.byTheme} total={data.goals.total} achieved={data.goals.achieved} />
        </section>
      )}

      {/* Project Portfolio Chart */}
      {data.projects.total > 0 && (
        <section className="mb-6">
          <ProjectPortfolioChart 
            data={data.projects.projects.map(p => ({ type: p.name, count: 1, avgCompletion: p.progress }))}
            total={data.projects.total}
            avgCompletion={data.projects.avgCompletion}
          />
        </section>
      )}

      {/* Budget Summary */}
      <section className="mb-6 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Budget Summary</h2>
          <a href="/budget" className="text-sm text-emerald-600 hover:underline">View full budget</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Planned Budget</p>
            <p className="text-2xl font-bold text-gray-800">{fmtAmount(data.budget.totalPlanned, defaultCurrency, { explicitSymbol: true })}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Revised Budget</p>
            <p className="text-2xl font-bold text-gray-800">{fmtAmount(data.budget.totalRevised, defaultCurrency, { explicitSymbol: true })}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Actual Spent</p>
            <p className="text-2xl font-bold text-gray-800">{fmtAmount(data.budget.totalActual, defaultCurrency, { explicitSymbol: true })}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Utilization Rate</p>
            <p className="text-2xl font-bold text-gray-800">{data.budget.utilizationRate.toFixed(1)}%</p>
          </div>
        </div>
      </section>

      {/* KPI Performance Table */}
      {data.kpi.kpis.length > 0 && (
        <section className="mb-6 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">KPI Performance</h2>
            <a href="/kpi" className="text-sm text-emerald-600 hover:underline">View all KPIs</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4">KPI</th>
                  <th className="pb-3 pr-4">Target</th>
                  <th className="pb-3 pr-4">Actual</th>
                  <th className="pb-3 pr-4">Achievement</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.kpi.kpis.slice(0, 5).map((kpi) => (
                  <tr key={kpi.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <p className="text-sm font-medium text-gray-800">{kpi.name}</p>
                      <p className="text-xs text-gray-500">{kpi.code || kpi.category}</p>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600">
                      {kpi.target.toLocaleString()} {kpi.unit}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600">
                      {kpi.actual.toLocaleString()} {kpi.unit}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              kpi.achievement >= 100 ? 'bg-emerald-500' :
                              kpi.achievement >= 80 ? 'bg-blue-500' :
                              kpi.achievement >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, kpi.achievement)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {kpi.achievement.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        kpi.status === 'achieved' ? 'bg-emerald-100 text-emerald-700' :
                        kpi.status === 'on_track' ? 'bg-blue-100 text-blue-700' :
                        kpi.status === 'at_risk' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {kpi.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-8 border-t border-gray-200">
        <p>IJA-WPMS Executive Dashboard • Data updated: {new Date().toLocaleString()}</p>
        <p className="mt-1">Click on any card or chart to navigate to the relevant module for detailed information.</p>
      </footer>
    </div>
  );
}
