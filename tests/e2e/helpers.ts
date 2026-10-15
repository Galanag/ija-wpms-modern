import { Page, expect } from '@playwright';

/**
 * Real UI login through the login screen (no API bypass, no cookie injection).
 */
export async function login(page: Page, username = 'admin', password = 'admin123') {
  await page.goto('/');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 20_000 });
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: /log ?out|sign ?out/i }).first().click();
  await page.waitForURL(/\//, { timeout: 15_000 });
}

export async function apiRequest(page: Page, path: string, options: RequestInit = {}, extra?: any): Promise<{ status: number; data: any }> {
  const csrf = await page.evaluate(() => {
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const parts = c.trim().split('=');
      if (parts[0] === 'ija_csrf') return decodeURIComponent(parts[1] || '');
    }
    return null;
  });

  const res = await page.evaluate(
    async ({ path, opts, csrfToken, extraData }: { path: string; opts: RequestInit; csrfToken: string | null; extraData: any }) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(opts.headers as Record<string, string>),
      };
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
      const r = await fetch(path, { ...opts, headers });
      const data = await r.json().catch(() => null);
      return { status: r.status, data };
    },
    { path, opts: options, csrfToken: csrf, extraData: extra }
  );

  return res;
}
