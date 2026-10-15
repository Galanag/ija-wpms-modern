'use client';

import { useState, useEffect } from 'react';
import { request } from '@/lib/api';

interface PlanningYear {
  id: number;
  year: number;
  label: string;
  status: string;
}

interface ManagementReview {
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
  PlanningYear: { id: number; year: number; label: string };
  User?: { id: number; username: string; fullName: string };
  _count: { ReviewFinding: number; ReviewDecision: number; ReviewAction: number };
}

function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const c of cookies) {
    const parts = c.trim().split('=');
    if (parts[0] === 'ija_csrf') return decodeURIComponent(parts[1] || '');
  }
  return null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

export default function ManagementReviewPage() {
  const [years, setYears] = useState<PlanningYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [reviews, setReviews] = useState<ManagementReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchReviews();
    }
  }, [selectedYear]);

  const fetchYears = async () => {
    try {
      const data = await request<PlanningYear[]>('/planning/years');
      if (Array.isArray(data) && data.length > 0) {
        setYears(data);
        const active = data.find((y) => y.status === 'active');
        setSelectedYear(active?.id || data[0]?.id || 0);
      }
    } catch (err: any) {
      console.error('Failed to fetch years:', err);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request<ManagementReview[]>(
        `/management-reviews?${new URLSearchParams({ yearId: String(selectedYear) }).toString()}`,
      );
      setReviews(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    setCreateError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch('/api/management-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify({ ...data, yearId: selectedYear }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowCreateModal(false);
        fetchReviews();
      } else {
        setCreateError(body?.message || body?.error || `Failed to create review (${res.status})`);
      }
    } catch (err: any) {
      setCreateError(err?.message || 'Network error');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading management reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Management Reviews</h1>
            <p className="text-gray-600 mt-1">Plan, track, and close periodic management review activities</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border rounded-lg px-3 py-2"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  Year {y.year} ({y.status})
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setCreateError(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-[#123a28] text-white rounded-lg hover:bg-[#0f2e20] transition-colors"
            >
              New Management Review
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        )}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Findings</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Decisions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No management reviews for this year
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <a
                        href={`/management-review/${review.id}`}
                        className="text-sm font-medium text-gray-900 hover:underline"
                      >
                        {review.reviewPeriod}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(review.reviewDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[review.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {review.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{review._count?.ReviewFinding ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{review._count?.ReviewDecision ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{review._count?.ReviewAction ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {Array.isArray(review.participants) ? review.participants.join(', ') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{review.User?.fullName || review.User?.username || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(review.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">New Management Review</h2>
            {createError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{createError}</p>}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const participants = (data.get('participants') as string)
                  ?.split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);
                handleCreate({
                  reviewPeriod: data.get('reviewPeriod'),
                  reviewDate: data.get('reviewDate'),
                  participants: participants || [],
                  notes: data.get('notes'),
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Review Period *</label>
                  <input type="text" name="reviewPeriod" required placeholder="e.g. Q1 2027" className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Review Date *</label>
                  <input type="date" name="reviewDate" required className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Participants</label>
                  <input type="text" name="participants" placeholder="Comma-separated names" className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea name="notes" rows={3} className="mt-1 block w-full border rounded-md px-3 py-2" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded-md">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#123a28] text-white rounded-md">
                  Create Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
