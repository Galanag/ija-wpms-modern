// Shared currency formatting utilities.
//
// Currencies are stored in the DB and each financial record (Budget,
// BudgetLine, FinanceEntry, BudgetRequest, PlanningYear) carries a currencyId
// pointing to a Currency row. ETB (Ethiopian Birr) is seeded as the default.

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  locale?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export const DEFAULT_CURRENCY: Currency = {
  id: 1,
  code: 'ETB',
  name: 'Ethiopian Birr',
  symbol: 'Br',
  decimalPlaces: 2,
  locale: 'en-ET',
};

/**
 * Format a numeric amount according to a currency. When `opts.explicitSymbol`
 * is true the currency symbol is always shown; otherwise it is only shown when
 * there is no Intl currency pattern (fallback) or when the caller asks for it.
 */
export function formatCurrency(
  amount: number | undefined | null,
  currency: Currency | null | undefined,
  opts?: { explicitSymbol?: boolean },
) {
  const a = amount ?? 0;
  const cur = currency ?? DEFAULT_CURRENCY;
  try {
    if (typeof Intl === 'undefined') throw new Error('no-intl');
    const locale = cur.locale && cur.locale !== 'en-ET' ? cur.locale : 'en-ET';
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: cur.code,
      minimumFractionDigits: cur.decimalPlaces ?? 2,
      maximumFractionDigits: cur.decimalPlaces ?? 2,
    }).format(a);
    // Intl may not know ETB; if it renders a 'ETB' code instead of a symbol,
    // fall back to our symbol so users see "Br 1,000.00" rather than "ETB …".
    const looksRaw = /ETB|USD\b/.test(formatted) && !opts?.explicitSymbol;
    if (looksRaw) throw new Error('fallback');
    return formatted;
  } catch {
    const s = cur.symbol && cur.symbol !== '' ? `${cur.symbol} ` : '';
    return `${s}${a.toLocaleString(cur.locale || 'en-US', {
      minimumFractionDigits: cur.decimalPlaces ?? 2,
      maximumFractionDigits: cur.decimalPlaces ?? 2,
    })}`;
  }
}

/**
 * Format an amount using a currency object, returning the symbol-prefixed
 * string. Equivalent to formatCurrency but with explicit symbol always shown.
 */
export function formatAmountByCurrency(
  amount: number | undefined | null,
  currency: Currency | null | undefined,
) {
  return formatCurrency(amount, currency, { explicitSymbol: true });
}

/**
 * Fetch the default currency from the backend. Falls back to a hardcoded ETB
 * default if the API is unreachable so the UI never blocks on this call.
 */
export async function getDefaultCurrency(): Promise<Currency> {
  try {
    const res = await fetch('/api/currency/default');
    if (res.ok) {
      const data = await res.json();
      const c = data?.data ?? data;
      if (c?.code) {
        return c as Currency;
      }
    }
  } catch {
    // ignore network errors; fall back below
  }
  return DEFAULT_CURRENCY;
}

/**
 * Fetch all active currencies (ordered with default first) for populate
 * dropdowns. Returns an empty array if the endpoint is unavailable.
 */
export async function getCurrencies(): Promise<Currency[]> {
  try {
    const res = await fetch('/api/currency');
    if (res.ok) {
      const data = await res.json();
      const list = data?.data ?? data;
      if (Array.isArray(list)) {
        return list as Currency[];
      }
    }
  } catch {
    // ignore
  }
  return [DEFAULT_CURRENCY];
}

/**
 * Look up a currency from a list by id. Returns null when not found so the
 * caller can fall back to the default formatting.
 */
export function getCurrencyById(list: Currency[], id: number | undefined | null) {
  if (!id) return null;
  return list.find((c) => c.id === id) ?? null;
}

/**
 * Short symbol form used inside tables where "Br 1,234" is too wide.
 * e.g. formatShortAmount(1234, cur) => "Br 1,234"
 */
export function formatShortAmount(
  amount: number | undefined | null,
  currency: Currency | null | undefined,
) {
  const a = amount ?? 0;
  const cur = currency ?? DEFAULT_CURRENCY;
  const s = cur.symbol && cur.symbol !== '' ? `${cur.symbol} ` : '';
  return `${s}${a.toLocaleString('en-US', {
    maximumFractionDigits: cur.decimalPlaces,
  })}`;
}