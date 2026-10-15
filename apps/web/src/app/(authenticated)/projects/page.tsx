'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardData } from '../../../lib/dashboard-types';
import { formatCurrency as fmtCurrency, getDefaultCurrency, Currency } from '@/lib/currency';

interface PlanningYear {
  id: number;
  year: number;
  label: string;
  status: string;
}



interface ProjectSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalSpend: number;
  budgetUtilization: number;
  avgCompletion: number;
  byStatus: Record<string, number>;
  highRisks: number;
}

interface Project {
  id: number;
  code: string;
  name: string;
  description?: string;
  status: string;
  physicalProgress: number;
  financialProgress: number;
  plannedBudget: number;
  actualSpend: number;
  startDate?: string;
  endDate?: string;
  orgUnit?: { name: string };
  employee?: { firstName: string; lastName: string };
  planningYear?: { year: number };
  _count?: { Activity: number };
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  planned: { bg: 'bg-blue-100', text: 'text-blue-800' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  on_hold: { bg: 'bg-orange-100', text: 'text-orange-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
};

const DEFAULT_SUMMARY: ProjectSummary = {
  totalProjects: 0,
  activeProjects: 0,
  completedProjects: 0,
  totalBudget: 0,
  totalSpend: 0,
  budgetUtilization: 0,
  avgCompletion: 0,
  byStatus: {},
  highRisks: 0,
};

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'list' | 'gantt' | 'risks'>('overview');
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [planningYears, setPlanningYears] = useState<PlanningYear[]>([]);
  const [summary, setSummary] = useState<ProjectSummary>(DEFAULT_SUMMARY);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    status: '',
    search: '',
  });
  const [currency, setCurrency] = useState<Currency | null>(null);

  useEffect(() => {
    getDefaultCurrency().then(setCurrency);
  }, []);

  useEffect(() => {
    // Use fetch with the proxy endpoint instead of request() to avoid double 'dashboard' in path
    fetch('/api/dashboard')
      .then(res => res.json())
      .then((data: DashboardData) => {
        const years = data?.planningYears || [];
        setPlanningYears(years);
        const active = years.find((y: PlanningYear) => y.status === 'active');
        if (active) {
          setSelectedYearId(active.id);
        } else if (years.length > 0) {
          setSelectedYearId(years[0]!.id);
        }
      })
      .catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedYearId) return;

    setLoading(true);
    setError(null);

    try {
      const [summaryRes, projectsRes] = await Promise.all([
        fetch(`/api/project/projects/summary?yearId=${selectedYearId}`),
        fetch(`/api/project/projects?yearId=${selectedYearId}&take=100`),
      ]);
      const summaryData = await summaryRes.json();
      const projectsData = await projectsRes.json();
      setSummary(summaryData || DEFAULT_SUMMARY);
      setProjects(projectsData?.projects || []);
    } catch (err: any) {
      console.error('Failed to fetch project data:', err);
      setError(err.message || 'Failed to load projects');
      setSummary(DEFAULT_SUMMARY);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYearId]);

  useEffect(() => {
    if (selectedYearId) {
      fetchData();
    }
  }, [selectedYearId, fetchData]);

  const formatMoney = (amount: number | undefined | null) =>
    fmtCurrency(amount, currency, { explicitSymbol: true });

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  const safeToFixed = (value: number | undefined | null, decimals: number = 1) => {
    return ((value ?? 0).toFixed(decimals));
  };

  const filteredProjects = projects.filter(p => {
    if (filter.status && p.status !== filter.status) return false;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(search) ||
        p.code?.toLowerCase().includes(search) ||
        (p.description?.toLowerCase().includes(search) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a18]">Projects</h1>
          <p className="text-[#5b584e] mt-1">Manage and track project portfolio</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYearId ?? ''}
            onChange={(e) => setSelectedYearId(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 rounded-lg border border-[#ddd8ca] bg-white text-[#1a1a18] text-sm focus:outline-none focus:ring-2 focus:ring-[#123a28]/20 focus:border-[#123a28]"
          >
            <option value="">All Years</option>
            {planningYears.map(year => (
              <option key={year.id} value={year.id}>
                {year.year} {year.status === 'active' ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-b border-[#ddd8ca]">
        <nav className="flex gap-6">
          {(['overview', 'list', 'gantt', 'risks'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-[#123a28] text-[#123a28]'
                  : 'border-transparent text-[#5b584e] hover:text-[#1a1a18]'
              }`}
            >
              {tab === 'gantt' ? 'Timeline' : tab}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#123a28] border-t-transparent"></div>
            <p className="text-[#5b584e]">Loading projects...</p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="text-sm text-[#5b584e] mb-1">Total Projects</div>
                  <div className="text-3xl font-bold text-[#1a1a18]">{summary.totalProjects}</div>
                  <div className="text-xs text-[#8a8578] mt-1">{summary.activeProjects} active</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="text-sm text-[#5b584e] mb-1">Total Budget</div>
                  <div className="text-3xl font-bold text-[#1a1a18]">{formatMoney(summary.totalBudget)}</div>
                  <div className="text-xs text-[#8a8578] mt-1">Spent: {formatMoney(summary.totalSpend)}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="text-sm text-[#5b584e] mb-1">Budget Utilization</div>
                  <div className="text-3xl font-bold text-[#123a28]">{safeToFixed(summary.budgetUtilization)}%</div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-[#123a28] h-1.5 rounded-full" style={{ width: `${Math.min(summary.budgetUtilization, 100)}%` }} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="text-sm text-[#5b584e] mb-1">Avg Completion</div>
                  <div className="text-3xl font-bold text-[#1a1a18]">{safeToFixed(summary.avgCompletion)}%</div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${Math.min(summary.avgCompletion, 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5">
                <h2 className="text-lg font-semibold text-[#1a1a18] mb-4">Status Overview</h2>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(summary.byStatus || {}).map(([status, count]) => {
                    const colors = STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
                    return (
                      <div key={status} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} ${colors.text}`}>
                        <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
                        <span className="text-xs opacity-75">{String(count)}</span>
                      </div>
                    );
                  })}
                  {Object.keys(summary.byStatus || {}).length === 0 && (
                    <p className="text-sm text-[#8a8578]">No projects yet</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5">
                <h2 className="text-lg font-semibold text-[#1a1a18] mb-4">Recent Projects</h2>
                {filteredProjects.length > 0 ? (
                  <div className="space-y-3">
                    {filteredProjects.slice(0, 5).map(project => {
                      const colors = STATUS_COLORS[project.status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
                      return (
                        <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-[#f5f3ed] hover:bg-[#ebe8e0] transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-[#8a8578]">{project.code}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {project.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-[#1a1a18] truncate mt-1">{project.name}</p>
                            <p className="text-xs text-[#5b584e]">{project.orgUnit?.name || 'No unit'}</p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm font-semibold">{safeToFixed(project.physicalProgress, 0)}%</div>
                            <div className="text-xs text-[#8a8578]">Progress</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-[#ddd8ca] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-[#5b584e]">No projects have been defined for this planning year.</p>
                    <button onClick={() => setActiveTab('list')} className="mt-3 text-sm text-[#123a28] font-medium hover:underline">
                      Create first project
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[#ddd8ca] text-sm focus:outline-none focus:ring-2 focus:ring-[#123a28]/20 focus:border-[#123a28]"
                  />
                </div>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-[#ddd8ca] text-sm focus:outline-none focus:ring-2 focus:ring-[#123a28]/20 focus:border-[#123a28]"
                >
                  <option value="">All Status</option>
                  {Object.keys(STATUS_COLORS).map(status => (
                    <option key={status} value={status}>{status.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f5f3ed] text-left text-xs font-semibold uppercase tracking-wider text-[#5b584e]">
                        <th className="px-4 py-3">Project</th>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Budget</th>
                        <th className="px-4 py-3">Progress</th>
                        <th className="px-4 py-3">Timeline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f5f3ed]">
                      {filteredProjects.map(project => {
                        const colors = STATUS_COLORS[project.status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
                        return (
                          <tr key={project.id} className="hover:bg-[#f5f3ed]/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-[#1a1a18]">{project.name}</div>
                              <div className="text-xs text-[#5b584e]">{project.orgUnit?.name || '-'}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-mono text-[#8a8578]">{project.code}</span>
                            </td>
                            <td className="px-4 py-3 text-sm">-</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {project.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium">{formatMoney(project.plannedBudget)}</div>
                              <div className="text-xs text-[#8a8578]">Spent: {formatMoney(project.actualSpend)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-indigo-600 h-2 rounded-full"
                                    style={{ width: `${Math.min(project.physicalProgress || 0, 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-10">{safeToFixed(project.physicalProgress, 0)}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#5b584e]">
                              {formatDate(project.startDate)} - {formatDate(project.endDate)}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredProjects.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-[#5b584e]">
                            No projects found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'gantt' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Project Timeline</h2>
              {filteredProjects.length > 0 ? (
                <div className="space-y-4">
                  {filteredProjects.map(project => (
                    <div key={project.id} className="flex items-center gap-4">
                      <div className="w-48 flex-shrink-0">
                        <p className="text-sm font-medium text-[#1a1a18] truncate">{project.name}</p>
                        <p className="text-xs text-[#8a8578]">{project.code}</p>
                      </div>
                      <div className="flex-1 h-8 bg-gray-100 rounded relative">
                        <div 
                          className="absolute top-0 bottom-0 bg-indigo-600/20 rounded"
                          style={{
                            left: project.startDate ? '10%' : '0',
                            right: project.endDate ? '10%' : '0',
                          }}
                        />
                        <div 
                          className="absolute top-1 bottom-1 bg-indigo-600 rounded"
                          style={{
                            left: '15%',
                            width: `${Math.max(5, project.physicalProgress || 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#5b584e]">
                  <p>No projects to display on timeline.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'risks' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Project Risks</h2>
              {summary.highRisks > 0 ? (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-800 font-medium">
                    {summary.highRisks} high-impact risks require attention
                  </p>
                </div>
              ) : (
                <p className="text-[#5b584e]">No high-impact risks identified.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
