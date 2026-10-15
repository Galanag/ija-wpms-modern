'use client';

import { useState, useEffect } from 'react';
import { formatCurrency as fmtCurrency, formatShortAmount, getCurrencies, getCurrencyById, Currency } from '@/lib/currency';

function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const c of cookies) {
    const parts = c.trim().split('=');
    if (parts[0] === 'ija_csrf') return decodeURIComponent(parts[1] || '');
  }
  return null;
}

interface BudgetSummary {
  totalPlanned: number;
  totalRevised: number;
  totalActual: number;
  variance: number;
  utilizationRate: number;
}

interface QuarterlyBudget {
  period: string;
  planned: number;
  revised: number;
  actual: number;
  variance: number;
  utilizationRate: number;
}

interface ExpenseBreakdown {
  opex: number;
  capex: number;
  other: number;
  total: number;
}
interface BudgetLine {
  id: number;
  lineName: string;
  plannedAmount: number;
  revisedAmount: number;
}

interface FinanceEntry {
  id: number;
  categoryName: string;
  entryType: string;
  amount: number;
  transactionDate: string;
  status: string;
}

interface Budget {
  id: number;
  yearId: number;
  category: string;
  plannedAmount: number;
  revisedAmount: number;
  approvalStatus: string;
  orgUnit?: { id: number; name: string };
  BudgetLine: BudgetLine[];
}

interface FundingSource {
  id: number;
  name: string;
  allocationAmount: number;
}



export default function BudgetPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'budgets' | 'entries' | 'funding'>('overview');
  const [years, setYears] = useState<{ id: number; year: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [quarterly, setQuarterly] = useState<QuarterlyBudget[]>([]);
  const [expenses, setExpenses] = useState<ExpenseBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Budget CRUD state
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [orgUnits, setOrgUnits] = useState<{id: number; name: string}[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState<Currency | null>(null);
  
  // Modal state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchData();
    }
  }, [selectedYear]);

  const fetchYears = async () => {
    try {
      const res = await fetch('/api/planning/years');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setYears(data);
          const active = data.find((y: any) => y.status === 'active');
          setSelectedYear(active?.id || data[0]?.id || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch years:', err);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const list = await getCurrencies();
      setCurrencies(list);
      const def = list.find((c) => c.isDefault) || list[0] || null;
      setDefaultCurrency(def ?? null);
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bvaRes, qRes, expRes] = await Promise.all([
        fetch(`/api/budget/calculations/budget-vs-actual/${selectedYear}`),
        fetch(`/api/budget/calculations/quarterly/${selectedYear}`),
        fetch(`/api/budget/calculations/expense-breakdown/${selectedYear}`),
      ]);

      const bvaData = await bvaRes.json();
      const qData = await qRes.json();
      const expData = await expRes.json();

      setSummary(bvaData.summary || bvaData);
      setQuarterly(Array.isArray(qData) ? qData : []);
      setExpenses(expData);
    } catch (error) {
      console.error('Failed to fetch budget data:', error);
      setError('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleCreateBudget = async (data: any) => {
    setSaving(true);
    setSaveError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify({ ...data, yearId: selectedYear }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to create budget');
      }
      showSuccess('Budget created successfully');
      setShowBudgetModal(false);
      fetchBudgets();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateEntry = async (data: any) => {
    setSaving(true);
    setSaveError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch('/api/budget/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify({ ...data, yearId: selectedYear }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to create entry');
      }
      showSuccess('Entry created successfully');
      setShowEntryModal(false);
      fetchEntries();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFunding = async (data: any) => {
    setSaving(true);
    setSaveError(null);
    try {
      const csrf = getCsrfToken();
      // Funding sources are AnnualPlanAllocation records exposed through the
      // generic CRUD API; they must not be sent to the Budget endpoint.
      const res = await fetch('/api/crud/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        body: JSON.stringify({
          yearId: selectedYear,
          name: data.name,
          allocationAmount: data.allocationAmount,
          notes: data.notes,
          orgUnitId: data.orgUnitId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to create funding source');
      }
      showSuccess('Funding source created successfully');
      setShowFundingModal(false);
      fetchFundingSources();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const fetchBudgets = async () => {
    try {
      const res = await fetch(`/api/budget?yearId=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setBudgets(Array.isArray(data) ? data : data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    }
  };

  const fetchEntries = async () => {
    try {
      const res = await fetch(`/api/budget/entries?yearId=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(Array.isArray(data) ? data : data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    }
  };

  const fetchFundingSources = async () => {
    try {
      const res = await fetch('/api/crud/allocations');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.items || [];
        setFundingSources(list.filter((a: any) => a.yearId === selectedYear));
      }
    } catch (err) {
      console.error('Failed to fetch funding sources:', err);
    }
  };

  const fetchOrgUnits = async () => {
    try {
      const res = await fetch('/api/crud/org-units');
      if (res.ok) {
        const data = await res.json();
        setOrgUnits(Array.isArray(data) ? data : data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch org units:', err);
    }
  };

  // Fetch data for tabs when they become active
  useEffect(() => {
    if (selectedYear) {
      fetchOrgUnits();
      fetchCurrencies();
    }
  }, [selectedYear]);

  useEffect(() => {
    if (activeTab === 'budgets' && selectedYear) {
      fetchBudgets();
    }
  }, [activeTab, selectedYear]);

  useEffect(() => {
    if (activeTab === 'entries' && selectedYear) {
      fetchEntries();
    }
  }, [activeTab, selectedYear]);

  useEffect(() => {
    if (activeTab === 'funding' && selectedYear) {
      fetchFundingSources();
    }
  }, [activeTab, selectedYear]);

  // Money rendering for the selected year's currency (falls back to the
  // system default currency resolved from the Currency master data).
  const fmtYearAmount = (amount: number | undefined | null) =>
    fmtCurrency(amount, defaultCurrency, { explicitSymbol: true });

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading budget data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchData} className="bg-indigo-600 text-white px-4 py-2 rounded">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Budget & Financial Management</h1>
            <p className="text-gray-600 mt-1">Track budgets, expenses, and financial performance</p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border rounded-md px-3 py-2"
            >
              {years.map(y => (
                <option key={y.id} value={y.id}>Year {y.year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {['overview', 'budgets', 'entries', 'funding'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-1">Total Planned</div>
                <div className="text-2xl font-bold text-gray-900">{fmtYearAmount(summary?.totalPlanned)}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-1">Total Actual</div>
                <div className="text-2xl font-bold text-blue-600">{fmtYearAmount(summary?.totalActual)}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-1">Variance</div>
                <div className={`text-2xl font-bold ${(summary?.variance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmtYearAmount(summary?.variance)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-1">Utilization</div>
                <div className="text-2xl font-bold text-gray-900">{(summary?.utilizationRate || 0).toFixed(1)}%</div>
              </div>
            </div>

            {/* Quarterly Breakdown */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Quarterly Budget vs Actual</h2>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Period</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Planned</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Revised</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Actual</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Variance</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {quarterly.map((q, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-3 text-sm font-medium">{q.period}</td>
                      <td className="px-4 py-3 text-right text-sm">{fmtYearAmount(q.planned)}</td>
                      <td className="px-4 py-3 text-right text-sm">{fmtYearAmount(q.revised)}</td>
                      <td className="px-4 py-3 text-right text-sm">{fmtYearAmount(q.actual)}</td>
                      <td className={`px-4 py-3 text-right text-sm ${q.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmtYearAmount(q.variance)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${q.utilizationRate > 100 ? 'bg-red-500' : q.utilizationRate > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(q.utilizationRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{q.utilizationRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {quarterly.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No quarterly budget data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Expense Breakdown */}
            {expenses && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">OPEX</h3>
                  <p className="text-2xl font-bold text-blue-600">{fmtYearAmount(expenses.opex)}</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${expenses.total > 0 ? (expenses.opex / expenses.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">CAPEX</h3>
                  <p className="text-2xl font-bold text-purple-600">{fmtYearAmount(expenses.capex)}</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${expenses.total > 0 ? (expenses.capex / expenses.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Other</h3>
                  <p className="text-2xl font-bold text-gray-600">{fmtYearAmount(expenses.other)}</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-500 h-2 rounded-full"
                      style={{ width: `${expenses.total > 0 ? (expenses.other / expenses.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Budget Management</h2>
              <button onClick={() => setShowBudgetModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                Create Budget
              </button>
            </div>
            {budgets.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Org Unit</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Planned</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revised</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Currency</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {budgets.map((b) => (
                    <tr key={b.id}>
                      <td className="px-4 py-2 text-sm font-medium">{b.category}</td>
                      <td className="px-4 py-2 text-sm">{b.orgUnit?.name || '-'}</td>
                      <td className="px-4 py-2 text-sm text-right">{fmtYearAmount(Number(b.plannedAmount))}</td>
                      <td className="px-4 py-2 text-sm text-right">{fmtYearAmount(Number(b.revisedAmount))}</td>
                      <td className="px-4 py-2 text-sm">
                        {(b as any).currency?.code || defaultCurrency?.code || 'ETB'}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                          {b.approvalStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No budgets found for this year. Create one to get started.</p>
            )}
          </div>
        )}

        {/* Entries Tab */}
        {activeTab === 'entries' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Finance Entries</h2>
              <button onClick={() => setShowEntryModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                Add Entry
              </button>
            </div>
            {entries.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Currency</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td className="px-4 py-2 text-sm">{e.transactionDate ? new Date(e.transactionDate).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-2 text-sm">{e.categoryName || '-'}</td>
                      <td className="px-4 py-2 text-sm capitalize">{e.entryType}</td>
                      <td className="px-4 py-2 text-sm text-right">{fmtYearAmount(Number(e.amount))}</td>
                      <td className="px-4 py-2 text-sm">
                        {(e as any).currency?.code || defaultCurrency?.code || 'ETB'}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No entries found for this year.</p>
            )}
          </div>
        )}

        {/* Funding Tab */}
        {activeTab === 'funding' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Funding Sources</h2>
              <button onClick={() => setShowFundingModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                Add Source
              </button>
            </div>
            {fundingSources.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Allocated Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fundingSources.map((source) => (
                    <tr key={source.id}>
                      <td className="px-4 py-2 text-sm">{source.name}</td>
                      <td className="px-4 py-2 text-sm text-right">{fmtYearAmount(source.allocationAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No funding sources configured for this year.</p>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Success/Error Messages */}
    {saveSuccess && (
      <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg z-50">
        {saveSuccess}
      </div>
    )}
    {saveError && (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg z-50">
        {saveError}
      </div>
    )}

    {/* Create Budget Modal */}
    {showBudgetModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Create Budget</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            handleCreateBudget({
              category: data.get('category'),
              plannedAmount: parseFloat(data.get('plannedAmount') as string || '0'),
              orgUnitId: data.get('orgUnitId') ? parseInt(data.get('orgUnitId') as string) : undefined,
              currencyId: data.get('currencyId') ? parseInt(data.get('currencyId') as string) : (defaultCurrency?.id ?? 1),
            });
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category *</label>
                <input type="text" name="category" required placeholder="e.g., Operations, Capital, Personnel" className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Planned Amount *</label>
                <input type="number" name="plannedAmount" required min="0" step="0.01" className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Organization Unit</label>
                <select name="orgUnitId" className="mt-1 block w-full border rounded-md px-3 py-2">
                  <option value="">Select...</option>
                  {orgUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency *</label>
                <select
                  name="currencyId"
                  defaultValue={defaultCurrency?.id ?? 1}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                >
                  {currencies.length > 0
                    ? currencies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name}{c.isDefault ? ' (default)' : ''}
                        </option>
                      ))
                    : <option value={1}>ETB - Ethiopian Birr (default)</option>}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowBudgetModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Add Entry Modal */}
    {showEntryModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Add Finance Entry</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            handleCreateEntry({
              categoryName: data.get('categoryName'),
              entryType: data.get('entryType'),
              amount: parseFloat(data.get('amount') as string || '0'),
              transactionDate: data.get('transactionDate'),
              description: data.get('description'),
              orgUnitId: data.get('orgUnitId') ? parseInt(data.get('orgUnitId') as string) : undefined,
              currencyId: data.get('currencyId') ? parseInt(data.get('currencyId') as string) : (defaultCurrency?.id ?? 1),
            });
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category *</label>
                <input type="text" name="categoryName" required placeholder="e.g., Revenue, Salaries, Supplies" className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select name="entryType" className="mt-1 block w-full border rounded-md px-3 py-2">
                  <option value="expense">Expense</option>
                  <option value="revenue">Revenue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount *</label>
                <input type="number" name="amount" required min="0" step="0.01" className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction Date *</label>
                <input type="date" name="transactionDate" required className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" rows={2} className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Organization Unit</label>
                <select name="orgUnitId" className="mt-1 block w-full border rounded-md px-3 py-2">
                  <option value="">Select...</option>
                  {orgUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency *</label>
                <select
                  name="currencyId"
                  defaultValue={defaultCurrency?.id ?? 1}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                >
                  {currencies.length > 0
                    ? currencies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name}{c.isDefault ? ' (default)' : ''}
                        </option>
                      ))
                    : <option value={1}>ETB - Ethiopian Birr (default)</option>}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowEntryModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Add Funding Source Modal */}
    {showFundingModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Add Funding Source</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            handleCreateFunding({
              name: data.get('name'),
              allocationAmount: parseFloat(data.get('allocationAmount') as string || '0'),
              notes: data.get('notes'),
              orgUnitId: data.get('orgUnitId') ? parseInt(data.get('orgUnitId') as string) : undefined,
              currencyId: data.get('currencyId') ? parseInt(data.get('currencyId') as string) : (defaultCurrency?.id ?? 1),
            });
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input type="text" name="name" required placeholder="e.g., Government Grant, Internal Funds" className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Allocation Amount *</label>
                <input type="number" name="allocationAmount" required min="0" step="0.01" className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea name="notes" rows={2} className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Organization Unit</label>
                <select name="orgUnitId" className="mt-1 block w-full border rounded-md px-3 py-2">
                  <option value="">Select...</option>
                  {orgUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency *</label>
                <select
                  name="currencyId"
                  defaultValue={defaultCurrency?.id ?? 1}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                >
                  {currencies.length > 0
                    ? currencies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name}{c.isDefault ? ' (default)' : ''}
                        </option>
                      ))
                    : <option value={1}>ETB - Ethiopian Birr (default)</option>}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowFundingModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Source'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
