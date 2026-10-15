'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

interface Props {
  data: Array<{ theme: string; total: number; achieved: number; inProgress: number }>;
  total: number;
  achieved: number;
  title?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-800">{label}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-gray-600">Total: <span className="font-medium">{data?.total}</span></p>
        <p className="text-emerald-600">Achieved: <span className="font-medium">{data?.achieved}</span></p>
        <p className="text-blue-600">In Progress: <span className="font-medium">{data?.inProgress}</span></p>
        <p className="text-gray-500">Not Started: <span className="font-medium">{data?.total - data?.achieved - data?.inProgress}</span></p>
      </div>
    </div>
  );
}

export function StrategicGoalsChart({ data, total, achieved, title = 'Strategic Goals by Theme' }: Props) {
  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No strategic goals available.</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    theme: d.theme.length > 15 ? d.theme.substring(0, 15) + '...' : d.theme,
    fullTheme: d.theme,
    total: d.total,
    achieved: d.achieved,
    inProgress: d.inProgress,
    notStarted: Math.max(0, d.total - d.achieved - d.inProgress),
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="text-right">
          <span className="text-2xl font-bold text-gray-800">{total}</span>
          <p className="text-xs text-gray-500">Goals</p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis type="category" dataKey="theme" tick={{ fill: '#6b7280', fontSize: 11 }} width={75} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="achieved" name="Achieved" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} />
            <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="notStarted" name="Not Started" stackId="a" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-center">
        <a href="/strategic" className="text-sm text-emerald-600 hover:underline">
          {achieved} goals achieved ({total > 0 ? ((achieved / total) * 100).toFixed(0) : 0}%)
        </a>
      </div>
    </div>
  );
}
