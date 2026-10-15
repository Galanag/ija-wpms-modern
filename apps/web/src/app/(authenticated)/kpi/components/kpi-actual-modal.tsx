'use client';
import { useState } from 'react';
import { request } from '@/lib/api';

interface KpiActualModalProps {
  open: boolean;
  onClose: () => void;
  planId: number;
  kpiName: string;
  yearId: number;
  onSuccess: () => void;
}

export function KpiActualModal({ open, onClose, planId, kpiName, yearId, onSuccess }: KpiActualModalProps) {
  const [periodType, setPeriodType] = useState('quarterly');
  const [periodKey, setPeriodKey] = useState('');
  const [actualValue, setActualValue] = useState('');
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodType || !periodKey || !actualValue) {
      setError('Period type, period key, and value are required');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      await request('/kpi/actuals', {
        method: 'POST',
        body: JSON.stringify({
          kpiPlanId: planId,
          periodType,
          periodKey,
          actualValue: parseFloat(actualValue),
          comment,
        }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save actual');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Enter KPI Actual - {kpiName}</h2>
        {error && <div className="bg-red-50 text-red-800 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Period Type</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Period Key</label>
            <input
              type="text"
              placeholder={periodType === 'monthly' ? 'e.g. M1' : periodType === 'quarterly' ? 'e.g. Q1' : 'e.g. YTD'}
              value={periodKey}
              onChange={(e) => setPeriodKey(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Actual Value</label>
            <input
              type="number"
              step="any"
              value={actualValue}
              onChange={(e) => setActualValue(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
