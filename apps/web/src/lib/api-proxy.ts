import { NextRequest, NextResponse } from 'next/server';

/**
 * Centralized, secure reverse proxy to the IJA-WPMS NestJS API.
 *
 * All Next.js /api/* proxy routes funnel through this helper so that:
 *  - There is ONE configured API origin (no per-route drift).
 *  - The browser session cookie is forwarded to the backend (auth works).
 *  - The CSRF token is injected from the ija_csrf cookie for state-changing
 *    requests (satisfies the backend CsrfGuard without duplicating client logic).
 *  - The backend's Set-Cookie headers are propagated back to the browser.
 *  - SSRF / open-proxy abuse is prevented: only the configured origin is allowed
 *    and path traversal is rejected.
 */

const WWW_AUTH_COOKIE = 'ija_session';
const CSRF_COOKIE = 'ija_csrf';
const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getApiBase(): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    'http://localhost:4000/api/v1';
  return base.replace(/\/+$/, '');
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0) {
      const key = part.slice(0, eq).trim();
      const val = part.slice(eq + 1).trim();
      if (key) out[key] = val;
    }
  }
  return out;
}

/**
 * Build the upstream URL, forwarded cookie header, and CSRF token.
 * Throws for invalid/unsafe paths.
 */
function buildUpstream(opts: {
  method: string;
  path: string;
  searchParams: URLSearchParams | null;
  request: NextRequest;
}): { url: string; cookieHeader: string | null; csrfToken: string | null } {
  const { method, path, searchParams, request } = opts;

  // --- Open-redirect / path-traversal guard -------------------------------
  if (
    !path ||
    path.includes('..') ||
    path.includes('//') ||
    path.includes('\\') ||
    path.includes(':') ||
    path.startsWith('/') ||
    path.split('/').some((seg) => !seg || seg === '.' || seg === '..')
  ) {
    throw new Error('Invalid proxy path');
  }

  // The API_BASE is a fixed environment value, never derived from user input,
  // which prevents using the proxy as an open redirect / SSRF relay.
  const base = getApiBase();
  let parsed: URL;
  try {
    parsed = new URL(base);
  } catch {
    throw new Error('Invalid API base');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Invalid API scheme');
  }
  const url = `${parsed.toString().replace(/\/+$/, '')}/${path}${searchParams ? '?' + searchParams.toString() : ''}`;

  // --- Cookie forwarding --------------------------------------------------
  const cookies = parseCookies(request.headers.get('cookie'));
  const session = cookies[WWW_AUTH_COOKIE];
  const csrf = cookies[CSRF_COOKIE];

  // Forward both the session cookie and the CSRF cookie the API expects.
  // The backend CsrfGuard checks req.cookies.ija_csrf AND the X-CSRF-Token header
  // must match, so we need to forward the cookie itself (not just inject the header).
  const parts: string[] = [];
  if (session) parts.push(`${WWW_AUTH_COOKIE}=${encodeURIComponent(session)}`);
  if (csrf) parts.push(`${CSRF_COOKIE}=${encodeURIComponent(csrf)}`);
  const upstreamCookieHeader = parts.length > 0 ? parts.join('; ') : null;

  const csrfToken = STATE_CHANGING.has(method.toUpperCase()) ? (csrf ?? null) : null;

  return { url, cookieHeader: upstreamCookieHeader, csrfToken };
}

async function proxyHandler(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const method = req.method || 'GET';
  try {
    const { url, cookieHeader, csrfToken } = buildUpstream({
      method,
      path: pathSegments.join('/'),
      searchParams: req.nextUrl.searchParams,
      request: req,
    });

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (cookieHeader) headers.Cookie = cookieHeader;
    // Honour a CSRF token the browser explicitly set (e.g. the request() helper)
    // but fall back to injecting it from the ija_csrf cookie when absent. This
    // keeps every state-changing call valid against the backend CsrfGuard without
    // forcing every page to duplicate CSRF logic.
    const incomingCsrf = req.headers.get('x-csrf-token');
    const effectiveCsrf = incomingCsrf || csrfToken;
    if (effectiveCsrf) headers['X-CSRF-Token'] = effectiveCsrf;

    // Forward the request body when present (JSON or raw).
    let body: string | undefined;
    const contentType = req.headers.get('content-type') || '';
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const raw = await req.arrayBuffer();
      if (raw.byteLength > 0) {
        body = Buffer.from(raw).toString('utf-8');
        if (contentType) headers['Content-Type'] = contentType;
      }
    }

    const res = await fetch(url, {
      method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
    });

    // Propagate the backend's cookies to the browser so session lifecycle
    // works through the proxy (e.g. login via proxy sets the session cookie).
    const setCookie = res.headers.get('set-cookie');
    const text = await res.text();
    let parsed: unknown = {};
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = { error: 'Invalid JSON from API', status: res.status };
    }
    const nextRes = NextResponse.json(parsed, { status: res.status });
    if (setCookie) {
      const safeCookie = setCookie.replace(/;\s*path=([^;]*)/i, '; Path=/');
      nextRes.headers.append('Set-Cookie', safeCookie);
    }
    return nextRes;
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 502 });
  }
}

export async function proxyGet(req: NextRequest, path: string[]) {
  return proxyHandler(req, path);
}
export async function proxyPost(req: NextRequest, path: string[]) {
  return proxyHandler(req, path);
}
export async function proxyPut(req: NextRequest, path: string[]) {
  return proxyHandler(req, path);
}
export async function proxyPatch(req: NextRequest, path: string[]) {
  return proxyHandler(req, path);
}
export async function proxyDelete(req: NextRequest, path: string[]) {
  return proxyHandler(req, path);
}
