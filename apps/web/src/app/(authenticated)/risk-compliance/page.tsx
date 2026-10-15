'use client';

import { useState, useEffect } from 'react';

function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const c of cookies) {
    const parts = c.trim().split('=');
    if (parts[0] === 'ija_csrf') return decodeURIComponent(parts[1] || '');
  }
  return null;
}



interface RiskDashboard {
  totalRisks: number;
  openRisks: number;
  highRisks: any[];
  overdueMitigations: any[];
  risks?: any[];
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  riskTrend: { open: number; mitigated: number; closed: number };
}

interface ComplianceDashboard {
  totalRequirements: number;
  compliant: number;
  nonCompliant: number;
  pending: number;
  expired?: number;
  upcomingDeadlines: any[];
  unresolvedFindings: number;
  openCorrectiveActions?: number;
  requirements?: any[];
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

const RISK_TYPES = [
  { value: 'strategic', label: 'Strategic' },
  { value: 'financial', label: 'Financial' },
  { value: 'operational', label: 'Operational' },
  { value: 'project', label: 'Project' },
  { value: 'technology', label: 'Technology/Cyber' },
  { value: 'reputational', label: 'Reputational' },
  { value: 'human_capital', label: 'Human Capital' },
  { value: 'external', label: 'External' },
  { value: 'compliance', label: 'Compliance' },
];

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  identified: 'bg-purple-100 text-purple-800',
  mitigated: 'bg-green-100 text-green-800',
  accepted: 'bg-yellow-100 text-yellow-800',
  transferred: 'bg-indigo-100 text-indigo-800',
  closed: 'bg-gray-100 text-gray-800',
  compliant: 'bg-green-100 text-green-800',
  non_compliant: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
  open: 'bg-red-100 text-red-800',
  resolved: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
};

export default function RiskCompliancePage() {
  const [activeTab, setActiveTab] = useState<'risk' | 'compliance' | 'corrective'>('risk');
  const [years, setYears] = useState<{ id: number; year: number; status: string }[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [riskDashboard, setRiskDashboard] = useState<RiskDashboard | null>(null);
  const [complianceDashboard, setComplianceDashboard] = useState<ComplianceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [complianceCreateError, setComplianceCreateError] = useState<string | null>(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showFindingModal, setShowFindingModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showCorrectiveModal, setShowCorrectiveModal] = useState(false);
  const [copyTargetYear, setCopyTargetYear] = useState<number>(0);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [correctiveActions, setCorrectiveActions] = useState<any[]>([]);
  const [correctiveCreateError, setCorrectiveCreateError] = useState<string | null>(null);

  useEffect(() => {
    // Deep-link support: /risk-compliance?tab=compliance opens the tab directly
    // (the sidebar links here).
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'compliance' || tab === 'risk') {
        setActiveTab(tab);
      }
    }
    fetchYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchData();
    }
  }, [selectedYear]);

  const fetchYears = async () => {
    try {
      const res = await fetch('/api/planning/years');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setYears(data);
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
      const [riskRes, compRes] = await Promise.all([
        fetch(`/api/risk-compliance/dashboard/risks?yearId=${selectedYear}`),
        fetch(`/api/risk-compliance/dashboard/compliance?yearId=${selectedYear}`),
      ]);

      if (!riskRes.ok || !compRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const riskData = await riskRes.json();
      const compData = await compRes.json();

      setRiskDashboard(riskData);
      setComplianceDashboard(compData);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRisk = async (data: any) => {
    setCreateError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch('/api/risk-compliance/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify({ ...data, yearId: selectedYear }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowRiskModal(false);
        fetchData();
      } else {
        setCreateError(body?.message || body?.error || `Failed to create risk (${res.status})`);
        fetchData();
      }
    } catch (err: any) {
      setCreateError(err?.message || 'Network error');
      fetchData();
    }
  };

  const handleCreateCompliance = async (data: any) => {
    setComplianceCreateError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch('/api/risk-compliance/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify({ ...data, yearId: selectedYear }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowComplianceModal(false);
        fetchData();
      } else {
        setComplianceCreateError(body?.message || body?.error || `Failed to create requirement (${res.status})`);
      }
    } catch (err: any) {
      setComplianceCreateError(err?.message || 'Network error');
      fetchData();
    }
  };

  const handleReportFinding = async (data: any) => {
    setCreateError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch('/api/risk-compliance/findings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowFindingModal(false);
        fetchData();
      } else {
        setCreateError(body?.message || body?.error || `Failed to report finding (${res.status})`);
      }
    } catch (err: any) {
      setCreateError(err?.message || 'Network error');
      fetchData();
    }
  };

  const handleCopyRequirements = async () => {
    if (!copyTargetYear) {
      setCopyMessage('Select a target year.');
      return;
    }
    setCopying(true);
    setCopyMessage(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch('/api/risk-compliance/requirements/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify({ sourceYearId: selectedYear, targetYearId: copyTargetYear }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setCopyMessage(data?.message || 'Copy failed');
        return;
      }
      setCopyMessage(`Copied ${data.copied} requirement(s). ${data.skipped} duplicate(s) skipped.`);
      fetchData();
    } catch (err: any) {
      setCopyMessage(err?.message || 'Copy failed');
    } finally {
      setCopying(false);
    }
  };

  const fetchCorrectiveActions = async () => {
    try {
      const res = await fetch(`/api/risk-compliance/corrective-actions?yearId=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setCorrectiveActions(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
  };

  const handleCreateCorrectiveAction = async (data: any) => {
    setCorrectiveCreateError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch('/api/risk-compliance/corrective-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify({ ...data, yearId: selectedYear }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowCorrectiveModal(false);
        fetchCorrectiveActions();
      } else {
        setCorrectiveCreateError(body?.message || body?.error || `Failed to create corrective action (${res.status})`);
      }
    } catch (err: any) {
      setCorrectiveCreateError(err?.message || 'Network error');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (loading && !riskDashboard) {
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
          <button onClick={fetchData} className="bg-indigo-600 text-white px-4 py-2 rounded">
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
            <h1 className="text-3xl font-bold text-gray-900">Risk & Compliance</h1>
            <p className="text-gray-600 mt-1">Manage risks, compliance requirements, and findings</p>
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
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('risk')}
            className={`px-4 py-2 font-medium ${activeTab === 'risk' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            Risk Management
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-4 py-2 font-medium ${activeTab === 'compliance' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            Compliance
          </button>
          <button
            onClick={() => setActiveTab('corrective')}
            className={`px-4 py-2 font-medium ${activeTab === 'corrective' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            Corrective Actions
          </button>
        </div>

        {/* Risk Tab */}
        {activeTab === 'risk' && riskDashboard && (
          <div>
            <div className="grid grid-cols-3 gap-6">
            {/* Risk Summary */}
              <div className="col-span-2 bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Risk Overview</h2>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{riskDashboard.totalRisks || 0}</div>
                    <div className="text-sm text-gray-500">Total Risks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{(riskDashboard.bySeverity?.high || 0) + (riskDashboard.bySeverity?.critical || 0)}</div>
                    <div className="text-sm text-gray-500">High/Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{riskDashboard.openRisks || 0}</div>
                    <div className="text-sm text-gray-500">Open</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{riskDashboard.bySeverity?.low || 0}</div>
                    <div className="text-sm text-gray-500">Low</div>
                  </div>
                </div>

                {/* Risk by Status */}
                <h3 className="font-medium text-gray-700 mb-3">By Status</h3>
                <div className="space-y-2">
                  {Object.entries(riskDashboard.byStatus || {}).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${status === 'mitigated' ? 'bg-green-500' : status === 'open' || status === 'in_progress' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                        <span className="text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                      </div>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowRiskModal(true)}
                    className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                  >
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">+</span>
                    <span>Register New Risk</span>
                  </button>
                  <button
                    onClick={() => setShowComplianceModal(true)}
                    className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                  >
                    <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">+</span>
                    <span>Add Compliance Requirement</span>
                  </button>
                  <button
                    onClick={() => { setCopyMessage(null); setCopyTargetYear(0); setShowCopyModal(true); }}
                    className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                  >
                    <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">↻</span>
                    <span>Copy Recurring Requirements</span>
                  </button>
                  <button
                    onClick={() => setShowFindingModal(true)}
                    className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                  >
                    <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">!</span>
                    <span>Report a Finding</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Risk Register */}
            <div className="col-span-3 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Risk Register</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(riskDashboard.risks || []).length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No risks registered for this year</td></tr>
                    ) : (
                      (riskDashboard.risks || []).map((risk: any) => (
                        <tr key={risk.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{risk.title}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${SEVERITY_COLORS[risk.level] || 'bg-gray-100 text-gray-800'}`}>
                              {risk.level}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[risk.status] || 'bg-gray-100 text-gray-800'}`}>
                              {String(risk.status).replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{risk.score}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{risk.category}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{risk.owner}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(risk.reviewDate)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && complianceDashboard && (
          <div>
            <div className="grid grid-cols-3 gap-6">
            {/* Compliance Summary */}
            <div className="col-span-2 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Compliance Overview</h2>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{complianceDashboard.totalRequirements || 0}</div>
                  <div className="text-sm text-gray-500">Total Requirements</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{complianceDashboard.compliant || 0}</div>
                  <div className="text-sm text-gray-500">Compliant</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{complianceDashboard.nonCompliant || 0}</div>
                  <div className="text-sm text-gray-500">Non-Compliant</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{complianceDashboard.pending || 0}</div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
              </div>

              {/* Compliance Rate */}
              {complianceDashboard.totalRequirements > 0 && (
                <div className="mb-6 pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Compliance Rate</span>
                    <span className="text-lg font-bold text-green-600">
                      {((complianceDashboard.compliant / complianceDashboard.totalRequirements) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${(complianceDashboard.compliant / complianceDashboard.totalRequirements) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Compliance by Status */}
              <h3 className="font-medium text-gray-700 mb-3">By Status</h3>
              <div className="space-y-2">
                {Object.entries(complianceDashboard.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${status === 'compliant' ? 'bg-green-500' : status === 'non_compliant' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                      <span className="text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                    </div>
                    <span className="font-medium">{count as number}</span>
                  </div>
                ))}
              </div>

              {/* Unresolved Findings */}
              {complianceDashboard.unresolvedFindings > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-800 font-medium">
                      {complianceDashboard.unresolvedFindings} unresolved findings require attention
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setShowRiskModal(true)}
                  className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                >
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">+</span>
                  <span>Register New Risk</span>
                </button>
                <button
                  onClick={() => setShowComplianceModal(true)}
                  className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                >
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">+</span>
                  <span>Add Compliance Requirement</span>
                </button>
                <button
                  onClick={() => { setCopyMessage(null); setCopyTargetYear(0); setShowCopyModal(true); }}
                  className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                >
                  <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">↻</span>
                  <span>Copy Recurring Requirements</span>
                </button>
                <button
                  onClick={() => setShowFindingModal(true)}
                  className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                >
                  <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">!</span>
                  <span>Report a Finding</span>
                </button>
              </div>
            </div>
          </div>

          {/* Compliance Requirements Register */}
          <div className="col-span-3 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Compliance Requirements</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsible</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Findings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(complianceDashboard.requirements || []).length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No compliance requirements for this year</td></tr>
                  ) : (
                    (complianceDashboard.requirements || []).map((req: any) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{req.title}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-800'}`}>
                            {String(req.status).replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{req.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(req.dueDate)}
                          {isOverdue(req.dueDate) && req.status !== 'compliant' && (
                            <span className="ml-2 text-xs text-red-600 font-medium">Overdue</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{req.responsible}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{req.findings ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

            {/* CORRECTIVE ACTIONS TAB */}
            {activeTab === 'corrective' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Corrective Actions</h2>
                  <button
                    onClick={() => setShowCorrectiveModal(true)}
                    className="px-4 py-2 bg-[#123a28] text-white rounded-lg hover:bg-[#0f2e20] transition-colors"
                  >
                    New Corrective Action
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {correctiveActions.length === 0 ? (
                          <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No corrective actions for this year</td></tr>
                        ) : (
                          correctiveActions.map((ca) => (
                            <tr key={ca.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{ca.title}</td>
                              <td className="px-4 py-3 text-sm font-mono text-gray-700">{ca.sourceType}{ca.sourceId ? ` #${ca.sourceId}` : ''}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs rounded ${
                                  ca.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                  ca.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  ca.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>{ca.priority}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs rounded ${STATUS_COLORS[ca.status] || 'bg-gray-100 text-gray-800'}`}>
                                  {ca.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{ca.dueDate ? formatDate(ca.dueDate) : '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{ca.Employee?.fullName || ca.ownerEmployeeId || '-'}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div className="bg-[#123a28] h-2 rounded-full" style={{ width: `${ca.completion ?? 0}%` }}></div>
                                  </div>
                                  <span className="text-xs text-gray-500">{ca.completion ?? 0}%</span>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
      </div>

      {/* Create Risk Modal */}
      {showRiskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Register New Risk</h2>
            {createError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{createError}</p>}
            <form onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              handleCreateRisk({
                title: data.get('title'),
                description: data.get('description'),
                category: data.get('category'),
                probability: parseInt(data.get('probability') as string) || 1,
                impact: parseInt(data.get('impact') as string) || 1,
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="risk-title" className="block text-sm font-medium text-gray-700">Title *</label>
                  <input id="risk-title" type="text" name="title" required className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="risk-description" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea id="risk-description" name="description" rows={3} className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="risk-category" className="block text-sm font-medium text-gray-700">Category</label>
                  <select id="risk-category" name="category" className="mt-1 block w-full border rounded-md px-3 py-2">
                    {RISK_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="risk-probability" className="block text-sm font-medium text-gray-700">Probability (1-5)</label>
                    <input id="risk-probability" type="number" name="probability" min="1" max="5" defaultValue="1" className="mt-1 block w-full border rounded-md px-3 py-2" />
                  </div>
                  <div>
                    <label htmlFor="risk-impact" className="block text-sm font-medium text-gray-700">Impact (1-5)</label>
                    <input id="risk-impact" type="number" name="impact" min="1" max="5" defaultValue="1" className="mt-1 block w-full border rounded-md px-3 py-2" />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowRiskModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Create Risk</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Compliance Modal */}
      {showComplianceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add Compliance Requirement</h2>
            {complianceCreateError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{complianceCreateError}</p>}
            <form onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              handleCreateCompliance({
                title: data.get('title'),
                description: data.get('description'),
                category: data.get('category'),
                dueDate: data.get('dueDate'),
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title *</label>
                  <input id="req-title" type="text" name="title" required className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="req-desc" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea id="req-desc" name="description" rows={3} className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="req-category" className="block text-sm font-medium text-gray-700">Category</label>
                  <input id="req-category" type="text" name="category" className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="e.g., Legal, Regulatory, Policy" />
                </div>
                <div>
                  <label htmlFor="req-due" className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input id="req-due" type="date" name="dueDate" className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowComplianceModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">Add Requirement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Finding Modal */}
      {showFindingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Report a Finding</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              handleReportFinding({
                title: data.get('title'),
                description: data.get('description'),
                severity: data.get('severity'),
                requirementId: data.get('requirementId') ? parseInt(data.get('requirementId') as string) : undefined,
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title *</label>
                  <input id="finding-title" type="text" name="title" required className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="finding-desc" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea id="finding-desc" name="description" rows={3} className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="finding-severity" className="block text-sm font-medium text-gray-700">Severity</label>
                  <select id="finding-severity" name="severity" className="mt-1 block w-full border rounded-md px-3 py-2">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="finding-req" className="block text-sm font-medium text-gray-700">Related Requirement ID</label>
                  <input id="finding-req" type="number" name="requirementId" className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="Optional" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowFindingModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-md">Report Finding</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Requirements Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-2">Copy Recurring Requirements</h2>
            <p className="text-sm text-gray-500 mb-4">
              Copies requirements from the selected year into the target year. Duplicates are skipped; due dates reset.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Source Year (current)</label>
                <input type="text" disabled value={years.find((y) => y.id === selectedYear)?.year ?? selectedYear} className="mt-1 block w-full border rounded-md px-3 py-2 bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Target Year</label>
                <select
                  value={copyTargetYear}
                  onChange={(e) => setCopyTargetYear(parseInt(e.target.value))}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                >
                  <option value={0}>Select target year…</option>
                  {years.filter((y) => y.id !== selectedYear && y.status !== 'closed' && y.status !== 'archived').map((y) => (
                    <option key={y.id} value={y.id}>{y.year} ({y.status})</option>
                  ))}
                </select>
              </div>
              {copyMessage && <p className="text-sm text-indigo-600">{copyMessage}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowCopyModal(false); setCopyMessage(null); }} className="px-4 py-2 border rounded-md">Close</button>
              <button type="button" onClick={handleCopyRequirements} disabled={copying || !copyTargetYear} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50">
                {copying ? 'Copying…' : 'Copy Requirements'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create Corrective Action Modal */}
      {showCorrectiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">New Corrective Action</h2>
            {correctiveCreateError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{correctiveCreateError}</p>}
            <form onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              handleCreateCorrectiveAction({
                title: data.get('title'),
                description: data.get('description'),
                sourceType: data.get('sourceType'),
                sourceId: data.get('sourceId') ? parseInt(data.get('sourceId') as string) : undefined,
                priority: data.get('priority'),
                dueDate: data.get('dueDate'),
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title *</label>
                  <input id="ca-title" type="text" name="title" required className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="ca-desc" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea id="ca-desc" name="description" rows={3} className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ca-source-type" className="block text-sm font-medium text-gray-700">Source Type</label>
                    <select id="ca-source-type" name="sourceType" className="mt-1 block w-full border rounded-md px-3 py-2">
                      <option value="risk">Risk</option>
                      <option value="compliance">Compliance</option>
                      <option value="audit">Audit</option>
                      <option value="finding">Finding</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ca-source-id" className="block text-sm font-medium text-gray-700">Source ID</label>
                    <input id="ca-source-id" type="number" name="sourceId" className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="Optional" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ca-priority" className="block text-sm font-medium text-gray-700">Priority</label>
                    <select id="ca-priority" name="priority" className="mt-1 block w-full border rounded-md px-3 py-2">
                      <option value="low">Low</option>
                      <option value="medium" selected>Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ca-due" className="block text-sm font-medium text-gray-700">Due Date</label>
                    <input id="ca-due" type="date" name="dueDate" className="mt-1 block w-full border rounded-md px-3 py-2" />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCorrectiveModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#123a28] text-white rounded-md">Create Action</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
