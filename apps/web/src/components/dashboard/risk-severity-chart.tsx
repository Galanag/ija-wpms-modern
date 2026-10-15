'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Props {
  data: Array<{ severity: string; count: number; color: string }>;
  total: number;
  highCount: number;
  criticalCount: number;
  title?: string;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-800 capitalize">{data?.severity} Risks</p>
      <p className="text-sm text-gray-600">Count: <span className="font-medium">{data?.count}</span></p>
    </div>
  );
}

export function RiskSeverityChart({ data, total, highCount, criticalCount, title = 'Risk Severity Distribution' }: Props) {
  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No risks recorded.</p>
      </div>
    );
  }

  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const sortedData = [...data].sort((a, b) => 
    severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );

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
              data={sortedData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="count"
              nameKey="severity"
            >
              {sortedData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => <span className="text-sm text-gray-600 capitalize">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-600" />
          <span className="text-sm text-gray-600">Critical:</span>
          <a href="/risk-compliance?tab=risks&severity=critical" className="text-sm font-semibold text-red-600 hover:underline">
            {criticalCount}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-sm text-gray-600">High:</span>
          <a href="/risk-compliance?tab=risks&severity=high" className="text-sm font-semibold text-orange-500 hover:underline">
            {highCount}
          </a>
        </div>
      </div>
    </div>
  );
}
