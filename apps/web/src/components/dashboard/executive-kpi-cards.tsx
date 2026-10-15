'use client';
import Link from 'next/link';
import { DashboardData } from '@/lib/dashboard-types';
import { Currency, DEFAULT_CURRENCY } from '@/lib/currency';

interface Props {
  data: DashboardData;
  yearId?: number;
  currency?: Currency | null;
}

/**
 * Compact money formatter for KPI cards, e.g. "Br 1.5M" / "$ 8.0K".
 * The symbol is derived from the supplied currency (falls back to the system
 * default, ETB) so non-default currencies render correctly.
 */
function formatMoney(value: number, currency?: Currency | null): string {
  const cur = currency ?? DEFAULT_CURRENCY;
  const sym = cur.symbol ? `${cur.symbol} ` : '';
  const abs = Math.abs(value);
  let num: string;
  if (abs >= 1000000) num = `${(value / 1000000).toFixed(1)}M`;
  else if (abs >= 1000) num = `${(value / 1000).toFixed(1)}K`;
  else num = value.toFixed(0);
  return `${sym}${num}`;
}

function formatPercent(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '0%';
  return `${Math.min(100, Math.max(0, value)).toFixed(1)}%`;
}

export function ExecutiveKpiCards({ data, yearId, currency }: Props) {
  const { quickStats, currentYear } = data;
  const params = yearId ? `?yearId=${yearId}` : '';

  const cards = [
    {
      label: 'Total Revenue',
      value: formatMoney(quickStats.totalRevenue, currency),
      href: `/budget${params}`,
      color: 'bg-emerald-50 border-emerald-200',
      textColor: 'text-emerald-700',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      hasData: quickStats.totalRevenue > 0,
    },
    {
      label: 'Net Profit',
      value: formatMoney(quickStats.netProfit, currency),
      href: `/budget${params}`,
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      hasData: true,
    },
    {
      label: 'KPI Achievement',
      value: formatPercent(quickStats.kpiAchievement),
      href: `/kpi${params}`,
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      hasData: quickStats.totalKpis > 0,
    },
    {
      label: 'Project Completion',
      value: formatPercent(quickStats.projectCompletion),
      href: `/projects${params}`,
      color: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-700',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      hasData: quickStats.activeProjects > 0,
    },
    {
      label: 'Budget Utilization',
      value: formatPercent(quickStats.budgetUtilization),
      href: `/budget${params}`,
      color: 'bg-teal-50 border-teal-200',
      textColor: 'text-teal-700',
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      hasData: true,
    },
    {
      label: 'High/Critical Risks',
      value: quickStats.highRisks.toString(),
      href: `/risk-compliance?tab=risks${params}`,
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-700',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      hasData: true,
    },
    {
      label: 'Compliance Rate',
      value: formatPercent(quickStats.complianceRate),
      href: `/risk-compliance?tab=compliance${params}`,
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      hasData: true,
    },
    {
      label: 'Pending Approvals',
      value: quickStats.pendingApprovals.toString(),
      href: `/governance${params}`,
      color: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-700',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      hasData: true,
    },
    {
      label: 'Strategic Progress',
      value: formatPercent(quickStats.strategicProgress),
      href: `/strategic${params}`,
      color: 'bg-violet-50 border-violet-200',
      textColor: 'text-violet-700',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      hasData: true,
    },
    {
      label: 'Active Employees',
      value: quickStats.totalEmployees.toString(),
      href: `/organization${params}`,
      color: 'bg-cyan-50 border-cyan-200',
      textColor: 'text-cyan-700',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      hasData: true,
    },
    {
      label: 'Overdue Actions',
      value: quickStats.overdueActions.toString(),
      href: `/workplan?filter=overdue${params}`,
      color: 'bg-rose-50 border-rose-200',
      textColor: 'text-rose-700',
      icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      hasData: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className={`${card.color} border rounded-xl p-4 hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg className={`w-5 h-5 ${card.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
            </svg>
            <span className="text-xs font-medium text-gray-600 truncate">{card.label}</span>
          </div>
          <div className={`text-2xl font-bold ${card.textColor}`}>
            {card.hasData ? card.value : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {currentYear ? `FY ${currentYear.year}` : 'No year'}
          </div>
        </Link>
      ))}
    </div>
  );
}
