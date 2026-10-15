'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Props {
  data: Array<{ status: string; count: number; percentage: number }>;
  total: number;
  title?: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  in_progress: '#3b82f6',
  delayed: '#ef4444',
  not_started: '#94a3b8',
  planned: '#a855f7',
  on_hold: '#f59e0b',
  default: '#6b7280',
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-800">{data?.status?.replace('_', ' ')}</p>
      <p className="text-sm text-gray-600">Count: <span className="font-medium">{data?.count}</span></p>
      <p className="text-sm text-gray-600">Percentage: <span className="font-medium">{data?.percentage?.toFixed(1)}%</span></p>
    </div>
  );
}

export function ActivityStatusChart({ data, total, title = 'Activity Status' }: Props) {
  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No activities available.</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    status: d.status.replace('_', ' '),
    color: STATUS_COLORS[d.status] || STATUS_COLORS.default,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <span className="text-2xl font-bold text-gray-800">{total}</span>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="count"
              nameKey="status"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {chartData.map((d, i) => (
          <a
            key={i}
            href={`/workplan?status=${d.status.replace(' ', '_')}`}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            {d.status}: {d.count}
          </a>
        ))}
      </div>
    </div>
  );
}
