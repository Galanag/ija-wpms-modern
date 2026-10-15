'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency as fmtAmount, getDefaultCurrency, Currency } from '@/lib/currency';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportFilterBar } from '@/components/reporting/filter-bar';
import { SimpleBarChart } from '@/components/reporting/simple-bar-chart';
import { SimplePieChart } from '@/components/reporting/simple-pie-chart';

type ReportDomain = 'executive' | 'kpi' | 'workplan' | 'projects' | 'budget' | 'risk' | 'compliance' | 'strategic' | 'monitoring' | 'organization';
type ViewMode = 'summary' | 'table' | 'chart' | 'kanban' | 'timeline';

const REPORT_DOMAINS: { value: ReportDomain; label: string }[] = [
  { value: 'executive', label: 'Executive' },
  { value: 'kpi', label: 'KPI' },
  { value: 'workplan', label: 'Workplan' },
  { value: 'projects', label: 'Projects' },
  { value: 'budget', label: 'Budget & Finance' },
  { value: 'risk', label: 'Risk' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'strategic', label: 'Strategic' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'organization', label: 'Organization' },
];

const VIEW_MODES: { value: ViewMode; label: string; domains: ReportDomain[] }[] = [
  { value: 'summary', label: 'Summary', domains: ['executive', 'kpi', 'workplan', 'projects', 'budget', 'risk', 'compliance', 'strategic', 'monitoring', 'organization'] },
  { value: 'table', label: 'Table', domains: ['kpi', 'workplan', 'projects', 'budget', 'risk', 'compliance', 'strategic', 'monitoring', 'organization'] },
  { value: 'chart', label: 'Chart', domains: ['kpi', 'workplan', 'projects', 'budget', 'risk', 'compliance', 'strategic', 'organization'] },
  { value: 'kanban', label: 'Kanban', domains: ['workplan', 'projects', 'risk', 'compliance'] },
  { value: 'timeline', label: 'Timeline', domains: ['workplan', 'projects', 'monitoring'] },
];

interface YearOption { id: number; year: number; status: string }
interface OrgUnit { id: number; name: string }

// ============ VIEW COMPONENTS ============

function SummaryView({ domain, data, currency }: { domain: ReportDomain; data: any; currency: Currency }) {
  const cards = buildSummaryCards(domain, data, currency);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            {card.subtitle && <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>}
          </div>
        ))}
      </div>
      {data.executiveAlerts && data.executiveAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Executive Alerts</h3>
          <div className="space-y-2">
            {data.executiveAlerts.map((alert: any, i: number) => (
              <a key={i} href={alert.href} className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 ${alert.severity === 'critical' ? 'bg-red-50 border border-red-200' : alert.severity === 'high' ? 'bg-orange-50 border border-orange-200' : alert.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                <span className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'high' ? 'bg-orange-500' : alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
                <span className="text-sm font-medium text-gray-700">{alert.label}</span>
                <span className="ml-auto text-lg font-bold text-gray-900">{alert.count}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TableView({ domain, data, currency }: { domain: ReportDomain; data: any; currency: Currency }) {
  const rows = buildTableRows(domain, data, currency);
  if (!rows || rows.length === 0) return <div className="text-center py-12 text-gray-500">No data available</div>;
  const headers = Object.keys(rows[0]);
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>{headers.map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((row: any, i: number) => (
            <tr key={i} className="hover:bg-gray-50">
              {headers.map((h) => <td key={h} className="px-4 py-3 text-sm text-gray-600">{row[h] ?? '-'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartView({ domain, data }: { domain: ReportDomain; data: any }) {
  const charts = buildChartData(domain, data);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {charts.map((chart, i) => (
        <div key={i}>
          {chart.type === 'pie' ? <SimplePieChart data={chart.data} title={chart.title} /> : <SimpleBarChart data={chart.data} title={chart.title} />}
        </div>
      ))}
    </div>
  );
}

function KanbanView({ domain, data }: { domain: ReportDomain; data: any }) {
  const columns = buildKanbanColumns(domain, data);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {columns.map((col, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-700">{col.title}</h4>
            <span className="text-sm text-gray-500">{col.items.length}</span>
          </div>
          <div className="space-y-2">
            {col.items.length === 0 ? <p className="text-xs text-gray-400 italic">No items</p> : col.items.map((item: any, j: number) => (
              <div key={j} className="bg-white rounded-md p-3 shadow-sm text-sm">
                <p className="font-medium text-gray-800">{item.title}</p>
                {item.subtitle && <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineView({ domain, data }: { domain: ReportDomain; data: any }) {
  const events = buildTimelineEvents(domain, data);
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-4">
        {events.length === 0 ? <p className="text-gray-500 text-center py-8">No timeline data</p> : events.map((event: any, i: number) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${event.color}`} />
              {i < events.length - 1 && <div className="w-0.5 flex-1 bg-gray-200" />}
            </div>
            <div className="pb-4">
              <p className="font-medium text-gray-800">{event.title}</p>
              <p className="text-sm text-gray-500">{event.date}</p>
              {event.description && <p className="text-xs text-gray-400 mt-1">{event.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ DATA BUILDERS ============

function buildSummaryCards(domain: ReportDomain, data: any, currency: Currency) {
  switch (domain) {
    case 'executive':
      return [
        { label: 'Total KPIs', value: data.kpi?.total || 0, subtitle: `${data.kpi?.achievementRate?.toFixed(1) || 0}% achievement` },
        { label: 'Active Projects', value: data.projects?.active || 0 },
        { label: 'Budget Utilization', value: `${data.budget?.utilizationRate?.toFixed(1) || 0}%` },
        { label: 'Compliance Rate', value: `${data.compliance?.complianceRate?.toFixed(1) || 0}%` },
      ];
    case 'kpi':
      return [
        { label: 'Total Plans', value: data.totalKpis || data.total || 0 },
        { label: 'Achieved', value: data.achieved || 0 },
        { label: 'On Track', value: data.onTrack || 0 },
        { label: 'At Risk', value: data.atRisk || data.offTrack || 0 },
      ];
    case 'workplan':
      return [
        { label: 'Total Activities', value: data.total || data.activities?.length || 0 },
        { label: 'Completed', value: data.completed || 0 },
        { label: 'In Progress', value: data.inProgress || 0 },
        { label: 'Delayed', value: data.delayed || 0 },
      ];
    case 'projects':
      return [
        { label: 'Total Projects', value: data.totalProjects || data.total || 0 },
        { label: 'Active', value: data.activeProjects || data.active || 0 },
        { label: 'Completed', value: data.completedProjects || data.completed || 0 },
        { label: 'Avg Completion', value: `${data.avgCompletion?.toFixed?.(1) || 0}%` },
      ];
    case 'budget':
      return [
        { label: 'Total Planned', value: fmtAmount(data.totalPlanned ?? 0, currency, { explicitSymbol: true }) },
        { label: 'Total Revised', value: fmtAmount(data.totalRevised ?? 0, currency, { explicitSymbol: true }) },
        { label: 'Total Actual', value: fmtAmount(data.totalActual ?? 0, currency, { explicitSymbol: true }) },
        { label: 'Utilization', value: `${data.utilizationRate?.toFixed(1) || 0}%` },
      ];
    case 'risk':
      return [
        { label: 'Total Risks', value: data.total || data.totalRisks || 0 },
        { label: 'High/Critical', value: (data.highCount || 0) + (data.criticalCount || 0) },
        { label: 'Open', value: data.open || data.openRisks || 0 },
        { label: 'Overdue', value: Array.isArray(data.overdueMitigations) ? data.overdueMitigations.length : (data.overdueMitigations || 0) },
      ];
    case 'compliance':
      return [
        { label: 'Total Requirements', value: data.total || data.totalRequirements || 0 },
        { label: 'Compliant', value: data.compliant || 0 },
        { label: 'Non-Compliant', value: data.nonCompliant || data.non_compliant || 0 },
        { label: 'Pending', value: data.pending || 0 },
      ];
    case 'strategic':
      return [
        { label: 'Total Goals', value: data.total || data.goals?.length || 0 },
        { label: 'Achieved', value: data.achieved || 0 },
        { label: 'In Progress', value: data.inProgress || 0 },
        { label: 'Not Started', value: data.notStarted || 0 },
      ];
    case 'organization':
      return [
        { label: 'Total Units', value: data.organization?.totalUnits || 0 },
        { label: 'Total Employees', value: data.employees?.total || 0 },
        { label: 'Active Employees', value: data.employees?.active || 0 },
        { label: 'Unit Types', value: Object.keys(data.organization?.byType || {}).length },
      ];
    case 'monitoring':
      return [
        { label: 'Total Reports', value: data.total || 0 },
        { label: 'Submitted', value: data.submitted || 0 },
        { label: 'Approved', value: data.approved || 0 },
        { label: 'Findings', value: data.findings || data.totalFindings || 0 },
      ];
    default:
      return [];
  }
}

function buildTableRows(domain: ReportDomain, data: any, currency: Currency) {
  switch (domain) {
    case 'kpi':
      return (data.kpis || []).map((k: any) => ({ Name: k.name, Code: k.code, Target: k.target, Actual: k.actual, Achievement: `${k.achievement?.toFixed?.(1) || 0}%`, Status: k.status?.replace('_', ' '), Unit: k.unit }));
    case 'workplan':
      return (data.activities || []).map((a: any) => ({ Title: a.title, Status: a.implementationStatus || a.status || '', Progress: `${a.progress || 0}%`, 'Org Unit': a.orgUnit?.name || 'N/A', 'Due Date': a.dueDate || '-', Priority: a.priority || '-' }));
    case 'projects':
      return (data.projects || []).map((p: any) => ({ Name: p.name, Code: p.code || '', Status: p.status || '', Completion: `${p.progress?.toFixed?.(1) || p.completion?.toFixed?.(1) || 0}%`, Budget: p.budget == null ? '-' : fmtAmount(Number(p.budget), currency, { explicitSymbol: true }), Spend: p.spend == null ? '-' : fmtAmount(Number(p.spend), currency, { explicitSymbol: true }) }));
    case 'risk':
      return (data.risks || []).map((r: any) => ({ Title: r.title, Severity: r.level || r.severity || '', Status: r.status || '', Score: r.score || r.riskScore || '', Category: r.category || '', Owner: r.owner || 'Unassigned' }));
    case 'compliance':
      return (data.requirements || []).map((r: any) => ({ Title: r.title, Status: r.status || '', Category: r.category || '', 'Due Date': r.dueDate || '-', Findings: r.findings || 0 }));
    case 'strategic':
      return (data.goals || []).map((g: any) => ({ Code: g.code, Title: g.title, Theme: g.theme || '', Status: g.status || '', KPIs: g.kpis || 0 }));
    case 'organization':
      return (data.employees || []).map((e: any) => ({ Name: e.fullName, 'Employee No': e.employeeNo || '', Position: e.position || e.jobTitle || '', 'Org Unit': e.orgUnit?.name || '', Active: e.active ? 'Yes' : 'No' }));
    default:
      return [];
  }
}

function buildChartData(domain: ReportDomain, data: any) {
  const charts: Array<{ type: 'bar' | 'pie'; title: string; data: Array<{ label: string; value: number }> }> = [];
  switch (domain) {
    case 'kpi':
      if (data.byStatus) charts.push({ type: 'pie', title: 'KPI by Status', data: Object.entries(data.byStatus).map(([k, v]: any) => ({ label: k.replace('_', ' '), value: v })) });
      if (data.trend) charts.push({ type: 'bar', title: 'KPI Trend', data: data.trend.map((t: any) => ({ label: t.period, value: t.actual })) });
      break;
    case 'workplan':
      if (data.byStatus) charts.push({ type: 'pie', title: 'Activities by Status', data: Object.entries(data.byStatus).map(([k, v]: any) => ({ label: k.replace('_', ' '), value: v })) });
      break;
    case 'projects':
      if (data.byStatus) charts.push({ type: 'pie', title: 'Projects by Status', data: Object.entries(data.byStatus).map(([k, v]: any) => ({ label: k, value: v })) });
      if (data.byType) charts.push({ type: 'bar', title: 'Projects by Type', data: Object.entries(data.byType).map(([k, v]: any) => ({ label: k, value: v })) });
      break;
    case 'budget':
      if (data.byCategory) charts.push({ type: 'bar', title: 'Budget by Category', data: data.byCategory.map((c: any) => ({ label: c.category, value: c.actual })) });
      break;
    case 'risk':
      if (data.bySeverity || data.byLevel) { const sev = data.bySeverity || data.byLevel || {}; charts.push({ type: 'pie', title: 'Risks by Severity', data: Object.entries(sev).map(([k, v]: any) => ({ label: k, value: v })) }); }
      break;
    case 'compliance':
      if (data.byStatus) charts.push({ type: 'pie', title: 'Compliance by Status', data: Object.entries(data.byStatus).map(([k, v]: any) => ({ label: k.replace('_', ' '), value: v })) });
      break;
    case 'strategic':
      if (data.byTheme) charts.push({ type: 'bar', title: 'Goals by Theme', data: data.byTheme.map((t: any) => ({ label: t.theme, value: t.total })) });
      break;
    case 'organization':
      if (data.organization?.byType) charts.push({ type: 'pie', title: 'Units by Type', data: Object.entries(data.organization.byType).map(([k, v]: any) => ({ label: k, value: v })) });
      break;
  }
  return charts;
}

function buildKanbanColumns(domain: ReportDomain, data: any) {
  switch (domain) {
    case 'workplan':
      return ['not_started', 'in_progress', 'delayed', 'completed'].map((status) => ({
        title: status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        items: (data.activities || []).filter((a: any) => (a.implementationStatus || a.status) === status).map((item: any) => ({ title: item.title, subtitle: item.orgUnit?.name || '' })),
      }));
    case 'projects':
      return ['planning', 'active', 'on_hold', 'completed'].map((status) => ({
        title: status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        items: (data.projects || []).filter((p: any) => p.status === status).map((item: any) => ({ title: item.name, subtitle: item.manager || '' })),
      }));
    case 'risk':
      return ['open', 'mitigated', 'accepted', 'closed'].map((status) => ({
        title: status.charAt(0).toUpperCase() + status.slice(1),
        items: (data.risks || []).filter((r: any) => r.status === status).map((item: any) => ({ title: item.title, subtitle: item.severity || item.level || '' })),
      }));
    case 'compliance':
      return ['pending', 'compliant', 'non_compliant', 'expired'].map((status) => ({
        title: status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        items: (data.requirements || []).filter((r: any) => r.status === status).map((item: any) => ({ title: item.title, subtitle: item.category || '' })),
      }));
    default:
      return [];
  }
}

function buildTimelineEvents(domain: ReportDomain, data: any) {
  switch (domain) {
    case 'workplan':
      return (data.activities || []).slice(0, 20).map((a: any) => ({ title: a.title, date: a.dueDate || a.startDate || '-', description: a.orgUnit?.name, color: a.implementationStatus === 'completed' ? 'bg-green-500' : a.implementationStatus === 'delayed' ? 'bg-red-500' : 'bg-blue-500' }));
    case 'projects':
      return (data.projects || []).slice(0, 20).map((p: any) => ({ title: p.name, date: p.endDate || p.startDate || '-', description: p.manager, color: p.status === 'completed' ? 'bg-green-500' : p.status === 'active' ? 'bg-blue-500' : 'bg-gray-500' }));
    case 'monitoring':
      return (data.periods || data.reports || []).slice(0, 20).map((r: any) => ({ title: r.title || r.periodKey || '', date: r.endDate || r.startDate || '-', color: r.status === 'approved' ? 'bg-green-500' : r.status === 'submitted' ? 'bg-purple-500' : 'bg-blue-500' }));
    default:
      return [];
  }
}

// ============ MAIN PAGE ============

export default function ReportingPage() {
  const [activeDomain, setActiveDomain] = useState<ReportDomain>('executive');
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [years, setYears] = useState<YearOption[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<number | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [savedReports, setSavedReports] = useState<Array<{ name: string; domain: ReportDomain; yearId: number; orgUnitId: number | null; quarter: string; status: string; viewMode: ViewMode }>>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [reportName, setReportName] = useState('');

  useEffect(() => { fetchYears(); fetchOrgUnits(); getDefaultCurrency().then(setCurrency); }, []);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ija_saved_reports');
      if (stored) setSavedReports(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { if (selectedYear) fetchReportData(); }, [selectedYear, selectedOrgUnit, selectedQuarter, selectedStatus, activeDomain]);
  useEffect(() => {
    const supported = VIEW_MODES.find(v => v.value === viewMode)?.domains.includes(activeDomain);
    if (!supported) setViewMode('summary');
  }, [activeDomain, viewMode]);

  const fetchYears = async () => {
    try {
      const res = await fetch('/api/planning/years');
      if (res.ok) {
        const data = await res.json();
        const list: YearOption[] = Array.isArray(data) ? data : data.data || [];
        setYears(list);
        const active = list.find(y => y.status === 'active');
        setSelectedYear(active?.id || list[0]?.id || 0);
      }
    } catch (err) { console.error('Failed to fetch years:', err); }
  };

  const fetchOrgUnits = async () => {
    try {
      const res = await fetch('/api/organization/tree');
      if (res.ok) {
        const data = await res.json();
        const flat: OrgUnit[] = [];
        const flatten = (nodes: any[]) => { for (const node of nodes) { flat.push({ id: node.id, name: node.name }); if (node.children) flatten(node.children); } };
        if (Array.isArray(data)) flatten(data);
        setOrgUnits(flat);
      }
    } catch (err) { console.error('Failed to fetch org units:', err); }
  };

  const loadReportData = async (domain: ReportDomain, yearId: number, orgUnitId: number | null, quarter: string, status: string) => {
    const params = new URLSearchParams({ yearId: yearId.toString() });
    if (orgUnitId) params.set('orgUnitId', orgUnitId.toString());
    if (quarter) params.set('quarter', quarter);
    if (status) params.set('status', status);
    let endpoint = '';
    switch (domain) {
      case 'executive': endpoint = '/api/dashboard'; break;
      case 'kpi': endpoint = '/api/kpi/dashboard/metrics'; break;
      case 'workplan': endpoint = `/api/workplan/statistics/${yearId}`; break;
      case 'projects': endpoint = `/api/project/projects/summary?${params}`; break;
      case 'budget': endpoint = `/api/budget/calculations/summary/${yearId}`; break;
      case 'risk': endpoint = `/api/risk-compliance/dashboard/risks?yearId=${yearId}`; break;
      case 'compliance': endpoint = `/api/risk-compliance/dashboard/compliance?yearId=${yearId}`; break;
      case 'strategic': endpoint = `/api/strategic/statistics?yearId=${yearId}`; break;
      case 'monitoring': endpoint = `/api/monitoring/dashboard?yearId=${yearId}`; break;
      case 'organization': endpoint = '/api/organization/statistics'; break;
    }
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Failed to load report: ${res.status}`);
    return res.json();
  };

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadReportData(activeDomain, selectedYear, selectedOrgUnit, selectedQuarter, selectedStatus);
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report data');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [activeDomain, selectedYear, selectedOrgUnit, selectedQuarter, selectedStatus]);

  const exportCSV = () => {
    if (!reportData) return;
    let csv = '';
    if (Array.isArray(reportData)) {
      if (reportData.length > 0) {
        csv = Object.keys(reportData[0]).join(',') + '\n';
        csv += reportData.map((row: any) => Object.values(row).join(',')).join('\n');
      }
    } else {
      csv = JSON.stringify(reportData, null, 2);
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IJA_${activeDomain}_Report_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Real XLSX workbook: headers + current filtered rows (same rows the table view renders). */
  const exportXLSX = () => {
    if (!reportData) return;
    const rows = buildTableRows(activeDomain, reportData, resolvedCurrency) || [];
    const wb = XLSX.utils.book_new();
    if (rows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
    } else {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['No data for current filters']]), 'Report');
    }
    XLSX.writeFile(wb, `IJA_${activeDomain}_Report_${selectedYear}.xlsx`);
  };

  /** Real PDF: title, report parameters, generated timestamp and the filtered data table. */
  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const rows = buildTableRows(activeDomain, reportData, resolvedCurrency) || [];
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    doc.setFontSize(16);
    doc.text(`IJA-WPMS ${activeDomain.toUpperCase()} Report`, 40, 40);
    doc.setFontSize(10);
    const yearLabel = years.find((y) => String(y.id) === String(selectedYear))?.year ?? selectedYear;
    doc.text(
      `Planning year: ${yearLabel}   Org unit: ${orgUnits.find((u) => String(u.id) === String(selectedOrgUnit))?.name ?? 'All'}   Quarter: ${selectedQuarter || 'All'}   Status: ${selectedStatus || 'All'}`,
      40,
      60,
    );
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 76);

    if (rows.length > 0) {
      autoTable(doc, {
        startY: 92,
        head: [headers],
        body: rows.map((r: any) => headers.map((h) => String(r[h] ?? '-'))),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [16, 185, 129] },
      });
    } else {
      doc.text('No data for the current filters.', 40, 100);
    }
    doc.save(`IJA_${activeDomain}_Report_${yearLabel}.pdf`);
  };

  const resolvedCurrency = currency ?? { id: 1, code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', decimalPlaces: 2, locale: 'en-ET' };
  const availableViewModes = VIEW_MODES.filter(v => v.domains.includes(activeDomain));

  const saveCurrentReport = () => {
    if (!reportName.trim()) return;
    const report = { name: reportName.trim(), domain: activeDomain, yearId: selectedYear, orgUnitId: selectedOrgUnit, quarter: selectedQuarter, status: selectedStatus, viewMode };
    const updated = [...savedReports, report];
    setSavedReports(updated);
    localStorage.setItem('ija_saved_reports', JSON.stringify(updated));
    setReportName('');
    setShowSaveDialog(false);
  };

  const loadSavedReport = (report: typeof savedReports[0]) => {
    setActiveDomain(report.domain);
    setSelectedYear(report.yearId);
    setSelectedOrgUnit(report.orgUnitId || 0);
    setSelectedQuarter(report.quarter);
    setSelectedStatus(report.status);
    setViewMode(report.viewMode);
  };

  const deleteSavedReport = (index: number) => {
    const updated = savedReports.filter((_, i) => i !== index);
    setSavedReports(updated);
    localStorage.setItem('ija_saved_reports', JSON.stringify(updated));
  };

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reporting Center</h1>
        <p className="text-gray-600 mt-1">Professional reports, analytics, and exportable insights</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b overflow-x-auto">
          <nav className="flex -mb-px min-w-max">
            {REPORT_DOMAINS.map((d) => (
              <button key={d.value} onClick={() => setActiveDomain(d.value)}
                className={`py-3 px-5 text-sm font-medium border-b-2 whitespace-nowrap ${activeDomain === d.value ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {d.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        {availableViewModes.map((v) => (
          <button key={v.value} onClick={() => setViewMode(v.value)}
            className={`px-3 py-1.5 text-sm rounded-md font-medium ${viewMode === v.value ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {v.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <select
            value=""
            onChange={(e) => { const report = savedReports[Number(e.target.value)]; if (report) loadSavedReport(report); }}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-md"
          >
            <option value="">Load saved report...</option>
            {savedReports.map((r, i) => (
              <option key={i} value={i}>{r.name} ({r.domain})</option>
            ))}
          </select>
          <button onClick={() => setShowSaveDialog(true)} disabled={!reportData || loading} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">Save Report</button>
          <button onClick={exportCSV} disabled={!reportData || loading} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">Export CSV</button>
          <button onClick={exportXLSX} disabled={!reportData || loading} className="px-3 py-1.5 text-sm bg-emerald-700 text-white rounded-md hover:bg-emerald-800 disabled:opacity-50">Export XLSX</button>
          <button onClick={exportPDF} disabled={!reportData || loading} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">Export PDF</button>
        </div>
      </div>
      <ReportFilterBar years={years} selectedYear={selectedYear} onYearChange={setSelectedYear} selectedOrgUnit={selectedOrgUnit} onOrgUnitChange={setSelectedOrgUnit} orgUnits={orgUnits} selectedQuarter={selectedQuarter} onQuarterChange={setSelectedQuarter} selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} />
      {loading && <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span className="ml-3 text-gray-600">Loading report...</span></div>}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={fetchReportData} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Retry</button>
        </div>
      )}
      {!loading && !error && reportData && (
        <div className="space-y-6">
          {viewMode === 'summary' && <SummaryView domain={activeDomain} data={reportData} currency={resolvedCurrency} />}
          {viewMode === 'table' && <TableView domain={activeDomain} data={reportData} currency={resolvedCurrency} />}
          {viewMode === 'chart' && <ChartView domain={activeDomain} data={reportData} />}
          {viewMode === 'kanban' && <KanbanView domain={activeDomain} data={reportData} />}
          {viewMode === 'timeline' && <TimelineView domain={activeDomain} data={reportData} />}
        </div>
      )}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Save Report Configuration</h2>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Report name..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowSaveDialog(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveCurrentReport} disabled={!reportName.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
