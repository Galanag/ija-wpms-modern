'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Props {
  data: Array<{ label: string; value: number; color?: string }>;
  title?: string;
  height?: number;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6366f1'];

export function SimplePieChart({ data, title = '', height = 250 }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  const chartData = data.map((d, i) => ({ ...d, color: d.color || COLORS[i % COLORS.length] }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" nameKey="label">
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
                                    <Tooltip formatter={((value: any) => [value.toLocaleString(), 'Value']) as any} />
            <Legend formatter={(value) => <span className="text-sm text-gray-600">{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
