'use client';

import { useState, useEffect, useRef } from 'react';
import { request } from '@/lib/api';

interface SearchResult {
  type: string;
  label: string;
  id: number;
  title: string;
  subtitle?: string;
  href: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(async () => {
      try {
        const data = await request<{ data: SearchResult[] }>(`/search?q=${encodeURIComponent(query.trim())}&limit=20`, { signal: controller.signal });
        setResults(data.data || []);
        setOpen(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') setError(err.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    acc[r.label] = acc[r.label] || [];
    acc[r.label]!.push(r);
    return acc;
  }, {});

  return (
    <div className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8578]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search employees, KPIs, projects, risks..."
          className="w-full pl-10 pr-4 py-2 border border-[#ddd8ca] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#123a28] focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-[#123a28] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {open && (query.trim() || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
          {error && <div className="p-3 text-sm text-red-600">{error}</div>}
          {!loading && results.length === 0 && query.trim() && !error && (
            <div className="p-4 text-sm text-gray-500">No results found for &quot;{query}&quot;</div>
          )}
          {Object.entries(grouped).map(([label, items]) => (
            <div key={label}>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">{label}</div>
              {items.map((item) => (
                <a
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                    {item.subtitle && <div className="text-xs text-gray-500 truncate">{item.subtitle}</div>}
                  </div>
                  <span className="text-xs text-gray-400">{item.type}</span>
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
