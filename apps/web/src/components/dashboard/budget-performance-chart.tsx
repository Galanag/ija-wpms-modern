'use client';
import { BudgetQuarterly } from '@/lib/dashboard-types';
import { formatCurrency, Currency, DEFAULT_CURRENCY } from '@/lib/currency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  data: BudgetQuarterly[];
  title?: string;
  currency?: Currency | null;
}

function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  const cur: Currency = currency ?? DEFAULT_CURRENCY;
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-800">{label}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-gray-500">Planned: <span className="font-medium text-gray-700">{formatCurrency(Number(data?.planned) || 0, cur, { explicitSymbol: true })}</span></p>
        <p className="text-amber-500">Revised: <span className="font-medium">{formatCurrency(Number(data?.revised) || 0, cur, { explicitSymbol: true })}</span></p>
        <p className="text-emerald-600">Actual: <span className="font-medium">{formatCurrency(Number(data?.actual) || 0, cur, { explicitSymbol: true })}</span></p>
        <p className="text-blue-600">Revenue: <span className="font-medium">{formatCurrency(Number(data?.revenue) || 0, cur, { explicitSymbol: true })}</span></p>
      </div>
    </div>
  );
}

export function BudgetPerformanceChart({ data, title = 'Budget Performance by Quarter', currency = DEFAULT_CURRENCY }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No budget data available.</p>
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
            <XAxis dataKey="quarter" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `${currency?.symbol ?? 'Br'} ${((v as number)/1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend />
            <Bar dataKey="planned" name="Planned" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="revised" name="Revised" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
