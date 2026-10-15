// Centralized API client.
//
// All requests are routed through the Next.js /api/* reverse proxy
// (src/lib/api-proxy.ts). Routing through the proxy keeps every call
// same-origin so the browser's cookies stay on the web origin and the proxy
// is responsible for forwarding the session cookie + CSRF token to NestJS.

let csrf = '';

export function setCsrf(v: string) {
  csrf = v;
  if (typeof document !== 'undefined') {
    document.cookie = `ija_csrf=${encodeURIComponent(v)}; path=/; SameSite=Strict`;
  }
}

export async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (csrf) headers.set('X-CSRF-Token', csrf);

  const method = (init.method || 'GET').toUpperCase();
  const r = await fetch(`/api${path}`, {
    ...init,
    method,
    headers,
    // same-origin (default) so the browser sends the web origin's cookies
  });

  const text = await r.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned invalid JSON (${r.status})`);
  }
  if (!r.ok) {
    throw new Error(
      json?.message || json?.error?.message || json?.error || `Request failed: ${r.status}`,
    );
  }
  return json as T;
}

export async function login(username: string, password: string) {
  const x = await request<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  const c = await request<any>('/auth/csrf', { method: 'POST', body: JSON.stringify({}) });
  const token = c.data?.csrfToken;
  if (token) setCsrf(token);
  return x.data.user;
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } finally {
    csrf = '';
  }
}
