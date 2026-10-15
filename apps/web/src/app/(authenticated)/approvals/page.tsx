'use client';

import { useState, useEffect } from 'react';
import { request } from '@/lib/api';

interface ApprovalItem {
  id: number;
  type: 'Activity' | 'Budget' | 'Project' | 'KPI' | 'Report';
  title: string;
  orgUnit?: string;
  submittedAt: string;
  status?: string;
  approvalStatus?: string;
}

interface PendingApprovals {
  total: number;
  activities: ApprovalItem[];
  budgets: ApprovalItem[];
  projects: ApprovalItem[];
}

interface ExecutiveDashboard {
  pendingApprovals: PendingApprovals;
  // other properties...
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<PendingApprovals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request<ExecutiveDashboard>('/dashboard');
      setApprovals(data.pendingApprovals || { total: 0, activities: [], budgets: [], projects: [] });
    } catch (err: any) {
      setError(err.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (item: ApprovalItem) => {
    setActionError(null);
    setActionSuccess(null);
    setProcessingId(item.id);
    try {
      const entityMap: Record<string, string> = {
        'Activity': 'activity',
        'Budget': 'budget',
        'Project': 'project',
        'KPI': 'kpi_plan',
        'Report': 'report',
      };
      const entity = entityMap[item.type] || item.type.toLowerCase();
      await request('/governance/approve', {
        method: 'POST',
        body: JSON.stringify({
          userId: (await request<any>('/auth/me')).data.id,
          entity,
          recordId: item.id,
          comments: `Approved via Approvals Center`,
        }),
      });
      setActionSuccess(`${item.type} #${item.id} approved successfully`);
      await fetchApprovals();
    } catch (err: any) {
      setActionError(err.message || `Failed to approve ${item.type}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: ApprovalItem) => {
    const comments = prompt(`Reason for rejecting ${item.type} #${item.id}:`);
    if (comments === null) return;
    setActionError(null);
    setActionSuccess(null);
    setProcessingId(item.id);
    try {
      const entityMap: Record<string, string> = {
        'Activity': 'activity',
        'Budget': 'budget',
        'Project': 'project',
        'KPI': 'kpi_plan',
        'Report': 'report',
      };
      const entity = entityMap[item.type] || item.type.toLowerCase();
      await request('/governance/reject', {
        method: 'POST',
        body: JSON.stringify({
          userId: (await request<any>('/auth/me')).data.id,
          entity,
          recordId: item.id,
          comments: comments || `Rejected via Approvals Center`,
        }),
      });
      setActionSuccess(`${item.type} #${item.id} rejected`);
      await fetchApprovals();
    } catch (err: any) {
      setActionError(err.message || `Failed to reject ${item.type}`);
    } finally {
      setProcessingId(null);
    }
  };

  const allItems: ApprovalItem[] = approvals
    ? [
        ...approvals.activities.map((a) => ({ ...a, type: 'Activity' as const })),
        ...approvals.budgets.map((b) => ({ ...b, type: 'Budget' as const })),
        ...approvals.projects.map((p) => ({ ...p, type: 'Project' as const })),
      ]
    : [];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Activity':
        return 'bg-blue-100 text-blue-700';
      case 'Budget':
        return 'bg-green-100 text-green-700';
      case 'Project':
        return 'bg-purple-100 text-purple-700';
      case 'KPI':
        return 'bg-orange-100 text-orange-700';
      case 'Report':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Approval Center</h1>
          <p className="text-gray-600 mt-1">Review and process pending approvals</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        )}
        {actionError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{actionError}</div>
        )}
        {actionSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{actionSuccess}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Pending Activities</div>
            <div className="text-2xl font-bold text-gray-900">{approvals?.activities.length ?? 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Pending Budgets</div>
            <div className="text-2xl font-bold text-gray-900">{approvals?.budgets.length ?? 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Pending Projects</div>
            <div className="text-2xl font-bold text-gray-900">{approvals?.projects.length ?? 0}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">
              Pending Approvals ({approvals?.total ?? 0})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading approvals...</td>
                  </tr>
                ) : allItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No pending approvals</td>
                  </tr>
                ) : (
                  allItems.map((item) => (
                    <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.orgUnit || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(item)}
                            disabled={processingId === item.id}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {processingId === item.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(item)}
                            disabled={processingId === item.id}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
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
    </div>
  );
}
