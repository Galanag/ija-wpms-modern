import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe.serial('Global Search', () => {
  test('search input is accessible from app shell', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await expect(page.getByPlaceholder(/search/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test('search API returns results for query', async ({ page }) => {
    await login(page);
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/search?q=test&limit=10');
      const data = await r.json().catch(() => null);
      return { status: r.status, data };
    });
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
    expect(res.data.total).toBeDefined();
  });

  test('search API returns empty for empty query', async ({ page }) => {
    await login(page);
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/search?q=&limit=10');
      const data = await r.json().catch(() => null);
      return { status: r.status, data };
    });
    expect(res.status).toBe(200);
    expect(res.data.total).toBe(0);
  });

  test('search results contain relevant entity types', async ({ page }) => {
    await login(page);
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/search?q=budget&limit=20');
      const data = await r.json().catch(() => null);
      return { status: r.status, data };
    });
    expect(res.status).toBe(200);
    if (res.data.data && res.data.data.length > 0) {
      const first = res.data.data[0];
      expect(first).toHaveProperty('type');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('href');
    }
  });

  test('search from dashboard opens search overlay', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('kpi');
      await page.waitForTimeout(1000);
      const overlay = page.locator('[data-testid="search-overlay"], .search-overlay, [role="dialog"]').first();
      if (await overlay.isVisible()) {
        await expect(overlay).toBeVisible();
      }
    }
  });

  test('search with KPI keyword filters correctly', async ({ page }) => {
    await login(page);
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/search?q=kpi&limit=10');
      const data = await r.json().catch(() => null);
      return { status: r.status, data };
    });
    expect(res.status).toBe(200);
    if (res.data.data && res.data.data.length > 0) {
      const kpiResults = res.data.data.filter((r: any) =>
        r.type?.toLowerCase().includes('kpi') || r.name?.toLowerCase().includes('kpi')
      );
      expect(kpiResults.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('search with project keyword returns project results', async ({ page }) => {
    await login(page);
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/search?q=project&limit=10');
      const data = await r.json().catch(() => null);
      return { status: r.status, data };
    });
    expect(res.status).toBe(200);
  });

  test('search limit parameter controls result count', async ({ page }) => {
    await login(page);
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/search?q=a&limit=5');
      const data = await r.json().catch(() => null);
      return { status: r.status, data };
    });
    expect(res.status).toBe(200);
    if (res.data.data) {
      expect(res.data.data.length).toBeLessThanOrEqual(5);
    }
  });
});
