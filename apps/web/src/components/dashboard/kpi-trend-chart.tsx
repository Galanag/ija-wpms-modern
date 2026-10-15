'use client';
import { KpiTrendPoint } from '@/lib/dashboard-types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

interface Props {
  data: KpiTrendPoint[];
  title?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  const variance = data?.actual - data?.target;
  const variancePercent = data?.target ? ((variance / data.target) * 100).toFixed(1) : '0';
  
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-800">{label}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-gray-600">Target: <span className="font-medium">{data?.target?.toLocaleString()}</span></p>
        <p className="text-emerald-600">Actual: <span className="font-medium">{data?.actual?.toLocaleString()}</span></p>
        <p className={variance >= 0 ? 'text-emerald-600' : 'text-red-600'}>
          Variance: <span className="font-medium">{variance >= 0 ? '+' : ''}{variance.toLocaleString()} ({variancePercent}%)</span>
        </p>
        <p className="text-blue-600">
          Achievement: <span className="font-medium">{data?.achievement?.toFixed(1)}%</span>
        </p>
      </div>
    </div>
  );
}

export function KpiTrendChart({ data, title = 'KPI Achievement Trend' }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No KPI trend data available for this period.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => v.toLocaleString()} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#e5e7eb" />
            <Bar dataKey="target" name="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
