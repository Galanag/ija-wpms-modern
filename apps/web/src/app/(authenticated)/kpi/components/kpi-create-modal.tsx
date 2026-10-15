'use client';
import { useState } from 'react';
import { request } from '@/lib/api';

interface KpiDefinition {
  id: number;
  code: string;
  name: string;
  unit?: string;
}

interface KpiCreateModalProps {
  open: boolean;
  onClose: () => void;
  yearId: number;
  kpiDefinitions: KpiDefinition[];
  onSuccess: () => void;
}

export function KpiCreateModal({ open, onClose, yearId, kpiDefinitions, onSuccess }: KpiCreateModalProps) {
  const [selectedKpiId, setSelectedKpiId] = useState('');
  const [annualTarget, setAnnualTarget] = useState('');
  const [baselineValue, setBaselineValue] = useState('');
  const [weight, setWeight] = useState('1');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKpiId) {
      setError('Please select a KPI');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      await request('/kpi/plans', {
        method: 'POST',
        body: JSON.stringify({
          kpiId: parseInt(selectedKpiId),
          yearId,
          annualTarget: annualTarget ? parseFloat(annualTarget) : undefined,
          baselineValue: baselineValue ? parseFloat(baselineValue) : undefined,
          weight: parseFloat(weight) || 1,
        }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create KPI plan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">New KPI Plan</h2>
        {error && <div className="bg-red-50 text-red-800 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">KPI Definition</label>
            <select
              value={selectedKpiId}
              onChange={(e) => setSelectedKpiId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a KPI</option>
              {kpiDefinitions.map((kpi: KpiDefinition) => (
                <option key={kpi.id} value={kpi.id}>
                  {kpi.code} - {kpi.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Annual Target</label>
            <input
              type="number"
              step="any"
              value={annualTarget}
              onChange={(e) => setAnnualTarget(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Baseline Value</label>
            <input
              type="number"
              step="any"
              value={baselineValue}
              onChange={(e) => setBaselineValue(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Weight</label>
            <input
              type="number"
              step="any"
              min="0"
              max="100"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
