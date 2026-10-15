'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  data: Array<{ type: string; count: number; avgCompletion: number }>;
  total: number;
  avgCompletion: number;
  title?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-800">{label}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-gray-600">Projects: <span className="font-medium">{data?.count}</span></p>
        <p className="text-blue-600">Avg Completion: <span className="font-medium">{data?.avgCompletion?.toFixed(1)}%</span></p>
      </div>
    </div>
  );
}

export function ProjectPortfolioChart({ data, total, avgCompletion, title = 'Project Portfolio by Type' }: Props) {
  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No projects available.</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    type: d.type.length > 12 ? d.type.substring(0, 12) + '...' : d.type,
    fullType: d.type,
    count: d.count,
    avgCompletion: d.avgCompletion,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="text-right">
          <span className="text-2xl font-bold text-gray-800">{total}</span>
          <p className="text-xs text-gray-500">Projects</p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="type" tick={{ fill: '#6b7280', fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
            <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="count" name="Projects" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="avgCompletion" name="Avg %" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-center">
        <a href="/projects" className="text-sm text-emerald-600 hover:underline">
          Overall completion: {avgCompletion.toFixed(1)}%
        </a>
      </div>
    </div>
  );
}
