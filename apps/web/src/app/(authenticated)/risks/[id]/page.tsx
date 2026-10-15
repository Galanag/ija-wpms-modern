'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { request } from '@/lib/api';

interface RiskDetail {
  id: number;
  title: string;
  description?: string;
  category?: string;
  status: string;
  probability: number;
  impact: number;
  score: number;
  mitigation?: string;
  dueDate?: string;
  owner?: string;
  createdAt: string;
  updatedAt: string;
  RiskCategory?: { id: number; name: string };
  OrgUnit?: { id: number; name: string };
  Employee?: { id: number; fullName: string };
  PlanningYear?: { id: number; year: number; label: string };
  RiskReview?: Array<{ id: number; reviewDate: string; notes?: string; status: string }>;
}

export default function RiskDetailPage() {
  const params = useParams();
  const riskId = Number(params.id);
  const [risk, setRisk] = useState<RiskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRisk = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await request<RiskDetail>(`/risk-compliance/risks/${riskId}`);
        setRisk(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load risk');
      } finally {
        setLoading(false);
      }
    };
    if (riskId) fetchRisk();
  }, [riskId]);

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

  if (error || !risk) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error || 'Risk not found'}</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (score: number) => {
    if (score >= 15) return 'text-red-600 bg-red-100';
    if (score >= 10) return 'text-orange-600 bg-orange-100';
    if (score >= 5) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">Risk Detail</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">{risk.title}</h1>
        {risk.RiskCategory && <p className="text-sm text-gray-500 mt-1">Category: {risk.RiskCategory.name}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Status</p>
          <p className="text-lg font-semibold text-gray-900 capitalize">{risk.status.replace('_', ' ')}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Risk Score</p>
          <p className={`text-lg font-semibold px-2 py-1 rounded inline-block ${getSeverityColor(risk.score)}`}>
            {risk.score} / 25
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Probability</p>
          <p className="text-lg font-semibold text-gray-900">{risk.probability} / 5</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Impact</p>
          <p className="text-lg font-semibold text-gray-900">{risk.impact} / 5</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Risk Information</h2>
        {risk.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-sm text-gray-900 mt-1">{risk.description}</p>
          </div>
        )}
        {risk.mitigation && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">Mitigation</p>
            <p className="text-sm text-gray-900 mt-1">{risk.mitigation}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Owner</p>
            <p className="text-sm font-medium text-gray-900">{risk.Employee?.fullName || risk.owner || 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Organization Unit</p>
            <p className="text-sm font-medium text-gray-900">{risk.OrgUnit?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Planning Year</p>
            <p className="text-sm font-medium text-gray-900">{risk.PlanningYear?.label || risk.PlanningYear?.year || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="text-sm font-medium text-gray-900">{risk.dueDate ? new Date(risk.dueDate).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </div>

      {risk.RiskReview && risk.RiskReview.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Review History</h2>
          <div className="space-y-3">
            {risk.RiskReview.map((review) => (
              <div key={review.id} className="border-l-4 border-blue-400 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{review.status}</p>
                    {review.notes && <p className="text-sm text-gray-600 mt-1">{review.notes}</p>}
                  </div>
                  <span className="text-xs text-gray-500">{new Date(review.reviewDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
