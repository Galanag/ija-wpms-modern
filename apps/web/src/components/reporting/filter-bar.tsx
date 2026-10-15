'use client';

interface FilterBarProps {
  years: { id: number; year: number; status: string }[];
  selectedYear: number;
  onYearChange: (yearId: number) => void;
  selectedOrgUnit: number | null;
  onOrgUnitChange: (orgUnitId: number | null) => void;
  orgUnits: { id: number; name: string }[];
  selectedQuarter: string;
  onQuarterChange: (quarter: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  availableStatuses?: string[];
  extraFilters?: React.ReactNode;
}

export function ReportFilterBar({
  years, selectedYear, onYearChange,
  selectedOrgUnit, onOrgUnitChange, orgUnits,
  selectedQuarter, onQuarterChange,
  selectedStatus, onStatusChange,
  availableStatuses = [],
  extraFilters,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Planning Year */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Year:</label>
          <select
            value={selectedYear || ''}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.year} {y.status === 'active' ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Organization Unit */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Unit:</label>
          <select
            value={selectedOrgUnit || ''}
            onChange={(e) => onOrgUnitChange(e.target.value ? Number(e.target.value) : null)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Units</option>
            {orgUnits.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Quarter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Quarter:</label>
          <select
            value={selectedQuarter}
            onChange={(e) => onQuarterChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </select>
        </div>

        {/* Status */}
        {availableStatuses.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {availableStatuses.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        )}

        {/* Extra filters (domain-specific) */}
        {extraFilters}
      </div>
    </div>
  );
}
