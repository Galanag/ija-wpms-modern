'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { request } from '@/lib/api';

interface PlanningYear {
  id: number;
  year: number;
  label: string;
}

interface UserRef {
  id: number;
  username: string;
  fullName: string;
}

interface OrgUnitRef {
  id: number;
  name: string;
}

interface ReviewFinding {
  id: number;
  title: string;
  description?: string;
  severity: string;
  category: string;
  sourceInfo?: string;
  createdAt: string;
}

interface ReviewDecision {
  id: number;
  description?: string;
  decision: string;
  dueDate: string | null;
  assignedTo?: number;
  status: string;
  createdAt: string;
  User?: UserRef;
}

interface ReviewAction {
  id: number;
  title: string;
  description?: string;
  responsiblePersonId?: number;
  responsibleOrgUnitId?: number;
  dueDate: string | null;
  status: string;
  followUpStatus?: string;
  createdAt: string;
  updatedAt: string;
  User?: UserRef;
  OrgUnit?: OrgUnitRef;
}

interface ManagementReviewDetail {
  id: number;
  yearId: number;
  reviewPeriod: string;
  reviewDate: string;
  participants: string[];
  status: string;
  notes?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  PlanningYear: PlanningYear;
  User?: UserRef;
  ReviewFinding: ReviewFinding[];
  ReviewDecision: ReviewDecision[];
  ReviewAction: ReviewAction[];
}

function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const c of cookies) {
    const parts = c.trim().split('=');
    if (parts[0] === 'ija_csrf') return decodeURIComponent(parts[1] || '');
  }
  return null;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  open: 'bg-red-100 text-red-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  deferred: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800',
};

function StatusBadge({ status }: { status: string }) {
  const bg = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${bg}`}>
      {String(status).replace('_', ' ')}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const bg = SEVERITY_COLORS[severity] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${bg}`}>
      {String(severity).replace('_', ' ')}
    </span>
  );
}

export default function ManagementReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = Number(params.id);
  const [review, setReview] = useState<ManagementReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [addFindingOpen, setAddFindingOpen] = useState(false);
  const [addDecisionOpen, setAddDecisionOpen] = useState(false);
  const [addActionOpen, setAddActionOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request<ManagementReviewDetail>(`/management-reviews/${reviewId}`);
      setReview(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load review');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reviewId) load();
  }, [reviewId]);

  const mutate = async (path: string, opts: RequestInit) => {
    setMutating(true);
    setFormError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch(`/api${path}`, {
        ...opts,
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
          ...(opts.headers || {}),
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message || body?.error || `Request failed (${res.status})`);
      }
      return body;
    } finally {
      setMutating(false);
    }
  };

  const handleAddFinding = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    try {
      await mutate(`/management-reviews/${reviewId}/findings`, {
        method: 'POST',
        body: JSON.stringify({
          title: data.get('title'),
          description: data.get('description'),
          severity: data.get('severity'),
          category: data.get('category'),
          sourceInfo: data.get('sourceInfo'),
        }),
      });
      setAddFindingOpen(false);
      load();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleAddDecision = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    try {
      await mutate(`/management-reviews/${reviewId}/decisions`, {
        method: 'POST',
        body: JSON.stringify({
          description: data.get('description'),
          decision: data.get('decision'),
          dueDate: data.get('dueDate') || undefined,
          assignedTo: data.get('assignedTo') ? Number(data.get('assignedTo')) : undefined,
          status: 'open',
        }),
      });
      setAddDecisionOpen(false);
      load();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleAddAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    try {
      await mutate(`/management-reviews/${reviewId}/actions`, {
        method: 'POST',
        body: JSON.stringify({
          title: data.get('title'),
          description: data.get('description'),
          responsiblePersonId: data.get('responsiblePersonId') ? Number(data.get('responsiblePersonId')) : undefined,
          responsibleOrgUnitId: data.get('responsibleOrgUnitId') ? Number(data.get('responsibleOrgUnitId')) : undefined,
          dueDate: data.get('dueDate') || undefined,
          status: data.get('status') || 'open',
          followUpStatus: data.get('followUpStatus'),
        }),
      });
      setAddActionOpen(false);
      load();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleUpdateActionStatus = async (actionId: number, status: string) => {
    try {
      await mutate(`/management-reviews/${reviewId}/actions/${actionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleCloseReview = async () => {
    if (!confirm('Close this management review? This action is audited.')) return;
    try {
      await mutate(`/management-reviews/${reviewId}/close`, { method: 'POST' });
      load();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading && !review) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error || 'Review not found'}</p>
          <button onClick={() => router.push('/management-review')} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded">
            Back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">Management Review</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">{review.reviewPeriod}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={review.status} />
          {review.status !== 'closed' && (
            <button
              onClick={handleCloseReview}
              disabled={mutating}
              className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 text-sm"
            >
              {mutating ? ' closing…' : 'Close Review'}
            </button>
          )}
        </div>
      </div>

      {formError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{formError}</div>}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Review Information</h2>
        {review.notes && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">Notes</p>
            <p className="text-sm text-gray-900 mt-1">{review.notes}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Planning Year</p>
            <p className="text-sm font-medium text-gray-900">{review.PlanningYear?.label || review.PlanningYear?.year || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Review Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(review.reviewDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Prepared By</p>
            <p className="text-sm font-medium text-gray-900">{review.User?.fullName || review.User?.username || '-'}</p>
          </div>
          <div className="md:col-span-3">
            <p className="text-sm text-gray-500">Participants</p>
            <p className="text-sm text-gray-900 mt-1">
              {Array.isArray(review.participants) && review.participants.length > 0
                ? review.participants.join(', ')
                : '-'}
            </p>
          </div>
        </div>
      </div>

      <ReviewSection
        title="Findings"
        items={review.ReviewFinding || []}
        onAdd={() => setAddFindingOpen(true)}
        addLabel="Add Finding"
        statusBadge={(s: any) => <SeverityBadge severity={s.severity} />}
        row={(f: ReviewFinding) => (
          <>
            <td className="px-4 py-3 text-sm text-gray-600">{f.category}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{f.sourceInfo || '-'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(f.createdAt)}</td>
          </>
        )}
        columns={['Title', 'Severity', 'Category', 'Source', 'Created']}
        addForm={
          <FindingForm onSubmit={handleAddFinding} onCancel={() => setAddFindingOpen(false)} loading={mutating} />
        }
        addOpen={addFindingOpen}
        setAddOpen={setAddFindingOpen}
        formError={formError}
      />

      <DecisionSection
        title="Decisions"
        items={review.ReviewDecision || []}
        onAdd={() => {
          setFormError(null);
          setAddDecisionOpen(true);
        }}
        addLabel="Add Decision"
        columns={['Decision', 'Description', 'Assigned To', 'Due Date', 'Status', 'Created']}
        addForm={
          <DecisionForm onSubmit={handleAddDecision} onCancel={() => setAddDecisionOpen(false)} loading={mutating} />
        }
        addOpen={addDecisionOpen}
        setAddOpen={setAddDecisionOpen}
        formatDate={formatDate}
      />

      <ActionSection
        title="Actions"
        items={review.ReviewAction || []}
        onAdd={() => {
          setFormError(null);
          setAddActionOpen(true);
        }}
        addLabel="Add Action"
        columns={['Title', 'Owner', 'Due Date', 'Status', 'Follow-up', 'Updated']}
        onUpdateStatus={handleUpdateActionStatus}
        addForm={
          <ActionForm onSubmit={handleAddAction} onCancel={() => setAddActionOpen(false)} loading={mutating} />
        }
        addOpen={addActionOpen}
        setAddOpen={setAddActionOpen}
        formatDate={formatDate}
      />
    </div>
  );
}

function SectionShell({ title, count, onAdd, addLabel, addOpen, setAddOpen, addForm, formError }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {title} <span className="text-sm text-gray-500 font-normal">({count})</span>
        </h2>
        <button
          onClick={onAdd}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
        >
          {addLabel}
        </button>
      </div>
      {addOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">{addForm}</div>
        </div>
      )}
    </div>
  );
}

function ReviewSection({ title, items, onAdd, addLabel, addForm, addOpen, setAddOpen, statusBadge, row, columns }: any) {
  return (
    <SectionShell
      title={title}
      count={items.length}
      onAdd={onAdd}
      addLabel={addLabel}
      addOpen={addOpen}
      setAddOpen={setAddOpen}
      addForm={addForm}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((c: string) => (
                <th key={c} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                  No findings recorded
                </td>
              </tr>
            ) : (
              items.map((f: ReviewFinding) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{f.title}</td>
                  <td className="px-4 py-3">{statusBadge(f)}</td>
                  {row(f)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

function DecisionSection({ title, items, onAdd, addLabel, addForm, addOpen, columns, formatDate }: any) {
  return (
    <SectionShell title={title} count={items.length} onAdd={onAdd} addLabel={addLabel} addOpen={addOpen} addForm={addForm}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((c: string) => (
                <th key={c} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                  No decisions recorded
                </td>
              </tr>
            ) : (
              items.map((d: ReviewDecision) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 capitalize">{d.decision}</td>
                  <td className="px-4 py-3 text-gray-600">{d.description || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{d.User?.fullName || d.User?.username || d.assignedTo || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(d.dueDate)}</td>
                  <td className="px-4 py-3">{StatusBadge({ status: d.status })}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(d.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

function ActionSection({ title, items, onAdd, addLabel, addForm, addOpen, columns, onUpdateStatus, formatDate }: any) {
  return (
    <SectionShell title={title} count={items.length} onAdd={onAdd} addLabel={addLabel} addOpen={addOpen} addForm={addForm}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((c: string) => (
                <th key={c} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {c}
                </th>
              ))}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-gray-500">
                  No actions recorded
                </td>
              </tr>
            ) : (
              items.map((a: ReviewAction) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                  <td className="px-4 py-3 text-gray-600">{a.User?.fullName || a.User?.username || a.responsiblePersonId || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(a.dueDate)}</td>
                  <td className="px-4 py-3">{StatusBadge({ status: a.status })}</td>
                  <td className="px-4 py-3 text-gray-600">{a.followUpStatus || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(a.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={a.status}
                      onChange={(e) => onUpdateStatus(a.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

function FindingForm({ onSubmit, onCancel, loading }: any) {
  return (
    <>
      <h3 className="text-lg font-semibold mb-4">Add Finding</h3>
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input type="text" name="title" required className="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" rows={3} className="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Severity</label>
              <select name="severity" className="mt-1 block w-full border rounded-md px-3 py-2">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select name="category" className="mt-1 block w-full border rounded-md px-3 py-2">
                <option value="kpi">KPI</option>
                <option value="activity">Activity</option>
                <option value="project">Project</option>
                <option value="budget">Budget</option>
                <option value="risk">Risk</option>
                <option value="compliance">Compliance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Source Info</label>
            <input type="text" name="sourceInfo" className="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
            {loading ? 'Saving…' : 'Add Finding'}
          </button>
        </div>
      </form>
    </>
  );
}

function DecisionForm({ onSubmit, onCancel, loading }: any) {
  return (
    <>
      <h3 className="text-lg font-semibold mb-4">Add Decision</h3>
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Decision *</label>
            <select name="decision" required className="mt-1 block w-full border rounded-md px-3 py-2">
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="deferred">Deferred</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" rows={3} className="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned To (user id)</label>
              <input type="number" name="assignedTo" min="1" className="mt-1 block w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input type="date" name="dueDate" className="mt-1 block w-full border rounded-md px-3 py-2" />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
            {loading ? 'Saving…' : 'Add Decision'}
          </button>
        </div>
      </form>
    </>
  );
}

function ActionForm({ onSubmit, onCancel, loading }: any) {
  return (
    <>
      <h3 className="text-lg font-semibold mb-4">Add Action</h3>
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input type="text" name="title" required className="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" rows={3} className="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Responsible Person (user id)</label>
              <input type="number" name="responsiblePersonId" min="1" className="mt-1 block w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Responsible Org Unit (id)</label>
              <input type="number" name="responsibleOrgUnitId" min="1" className="mt-1 block w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input type="date" name="dueDate" className="mt-1 block w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select name="status" className="mt-1 block w-full border rounded-md px-3 py-2">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
            {loading ? 'Saving…' : 'Add Action'}
          </button>
        </div>
      </form>
    </>
  );
}
