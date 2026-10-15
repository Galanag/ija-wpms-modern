'use client';
import Link from 'next/link';
import { ExecutiveAlert } from '@/lib/dashboard-types';

interface Props {
  alerts: ExecutiveAlert[];
  title?: string;
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-600' },
  low: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
};

const SEVERITY_ICONS: Record<string, string> = {
  critical: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  high: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  medium: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  low: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
};

export function ExecutiveAlertsPanel({ alerts, title = 'Executive Alerts' }: Props) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-emerald-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-emerald-600 font-medium">All Clear</p>
          <p className="text-gray-500 text-sm mt-1">No alerts require your attention</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
          {alerts.length} alerts
        </span>
      </div>
      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const style = SEVERITY_STYLES[alert.severity] ?? { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' };
          const icon = SEVERITY_ICONS[alert.severity] ?? SEVERITY_ICONS.low;
          return (
            <Link
              key={`${alert.type}-${index}`}
              href={alert.href}
              className={`flex items-center gap-3 p-3 rounded-lg ${style.bg} ${style.border} border hover:shadow-sm transition-shadow`}
            >
              <svg className={`w-5 h-5 ${style.icon} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{alert.label}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${style.bg.replace('-50', '-100')} ${style.icon}`}>
                {alert.count}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <Link href="/governance" className="text-sm text-emerald-600 hover:underline">
          View all pending actions
        </Link>
      </div>
    </div>
  );
}
