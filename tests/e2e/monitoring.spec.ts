import { test, expect } from '@playwright/test';
import { apiRequest, login } from './helpers';

test.describe.serial('Monitoring', () => {
  test('monitoring dashboard loads via governance tab', async ({ page }) => {
    await login(page);
    await page.goto('/governance?tab=monitoring');
    await expect(page.getByRole('heading', { name: /Governance/i })).toBeVisible({ timeout: 20_000 });
  });

  test('monitoring dashboard API returns stats for year', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const yearId = years.length > 0 ? years[0].id : 1;
    const res = await apiRequest(page, `/api/monitoring/dashboard?yearId=${yearId}`);
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('monitoring periods CRUD via API', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const activeYear = years.find((y: any) => y.status === 'active') || years[years.length - 1];
    const yearId = activeYear.id;
    const listRes = await apiRequest(page, `/api/monitoring/periods?yearId=${yearId}`);
    const existing = Array.isArray(listRes.data) ? listRes.data : [];
    const periodKey = existing.some((p: any) => p.periodKey === 'Q1') ? `Q1-E2E-${Date.now()}` : 'Q1';
    const createRes = await apiRequest(page, '/api/monitoring/periods', {
      method: 'POST',
      body: JSON.stringify({
        periodType: 'quarterly',
        periodKey,
        yearId,
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        label: `E2E Period ${Date.now()}`,
      }),
    });
    expect([200, 201]).toContain(createRes.status);
    expect(createRes.data).toBeTruthy();
    const periodId = createRes.data?.id;

    if (periodId) {
      const listRes2 = await apiRequest(page, `/api/monitoring/periods?yearId=${yearId}`);
      expect(listRes2.status).toBe(200);
      expect(Array.isArray(listRes2.data)).toBe(true);
    }
  });

  test('monitoring reports CRUD via API', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const yearId = years.length > 0 ? years[0].id : 1;
    const createRes = await apiRequest(page, '/api/monitoring/reports', {
      method: 'POST',
      body: JSON.stringify({
        title: `E2E Report ${Date.now()}`,
        yearId,
        reportType: 'quarterly',
        periodKey: 'Q1',
        status: 'draft',
      }),
    });
    expect([200, 201]).toContain(createRes.status);
    const reportId = createRes.data?.id;

    if (reportId) {
      const submitRes = await apiRequest(page, `/api/monitoring/reports/${reportId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ submittedBy: 1 }),
      });
      expect([200, 201]).toContain(submitRes.status);
    }
  });

  test('monitoring visits CRUD via API', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const yearId = years.length > 0 ? years[0].id : 1;
    const visitRes = await apiRequest(page, '/api/monitoring/visits', {
      method: 'POST',
      body: JSON.stringify({
        yearId,
        visitDate: '2026-06-15',
        status: 'scheduled',
      }),
    });
    expect([200, 201]).toContain(visitRes.status);
  });

  test('list monitoring reports', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const yearId = years.length > 0 ? years[0].id : 1;
    const res = await apiRequest(page, `/api/monitoring/reports?yearId=${yearId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('list monitoring visits', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const yearId = years.length > 0 ? years[0].id : 1;
    const res = await apiRequest(page, `/api/monitoring/visits?yearId=${yearId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});
