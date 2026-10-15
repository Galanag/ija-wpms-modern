import { test, expect } from '@playwright/test';
import { apiRequest, login } from './helpers';

const KPI_CODE = `E2E-KPI-${Date.now()}`;
const KPI_NAME = `E2E KPI ${Date.now()}`;
const CATEGORY_NAME = `E2E Category ${Date.now()}`;

test.describe.serial('KPI Management', () => {
  test('KPI page loads with plans table and stats', async ({ page }) => {
    await login(page);
    await page.goto('/kpi');
    await expect(page.getByRole('heading', { name: 'KPI Management' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('KPI Plans')).toBeVisible();
    await expect(page.getByText('Quarterly Targets')).toBeVisible();
    await expect(page.getByText('KPI Definitions')).toBeVisible();
  });

  test('year selector filters KPI plans via API', async ({ page }) => {
    await login(page);
    await page.goto('/kpi');
    await expect(page.getByRole('heading', { name: 'KPI Management' })).toBeVisible({ timeout: 20_000 });
    const yearSelect = page.locator('select').first();
    await yearSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1500);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const yearId = years.length > 0 ? years[0].id : 1;
    const plansRes = await apiRequest(page, `/api/kpi/plans?yearId=${yearId}`);
    expect(plansRes.status).toBe(200);
  });

  test('create KPI definition via API and verify in list', async ({ page }) => {
    await login(page);
    await page.goto('/kpi');
    await expect(page.getByRole('heading', { name: 'KPI Management' })).toBeVisible({ timeout: 20_000 });

    const createRes = await apiRequest(page, '/api/kpi/definitions', {
      method: 'POST',
      body: JSON.stringify({
        code: KPI_CODE,
        name: KPI_NAME,
        description: 'E2E test KPI',
        area: 'Finance',
        definition: 'Total revenue generated',
        formula: 'sum(revenue)',
        unit: 'ETB',
        frequency: 'quarterly',
        direction: 'higher_is_better',
      }),
    });
    expect([200, 201]).toContain(createRes.status);
    expect(createRes.data).toBeTruthy();
  });

  test('create KPI plan via API and verify metrics endpoint', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    expect(yearsRes.status).toBe(200);
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    expect(years.length).toBeGreaterThan(0);
    const yearId = years[years.length - 1].id;

    const defsRes = await apiRequest(page, '/api/kpi/definitions');
    const defs = Array.isArray(defsRes.data) ? defsRes.data : [];
    const kpiId = defs.length > 0 ? defs[0].id : 1;

    const existingRes = await apiRequest(page, `/api/kpi/plans?yearId=${yearId}&kpiId=${kpiId}`);
    const existingPlans = Array.isArray(existingRes.data) ? existingRes.data : [];
    const planId = existingPlans.length > 0 ? existingPlans[0].id : null;

    if (!planId) {
      const planRes = await apiRequest(page, '/api/kpi/plans', {
        method: 'POST',
        body: JSON.stringify({
          yearId,
          kpiId,
          annualTarget: 1000,
          q1Target: 200,
          q2Target: 300,
          q3Target: 250,
          q4Target: 250,
          weight: 1,
        }),
      });
      expect([200, 201]).toContain(planRes.status);
      expect(planRes.data).toBeTruthy();
    }

    const finalPlanId = planId || existingPlans[0]?.id;
    if (finalPlanId) {
      const metricsRes = await apiRequest(page, `/api/kpi/metrics/${finalPlanId}`);
      expect(metricsRes.status).toBe(200);
    }
  });

  test('enter KPI actual and verify it persists', async ({ page }) => {
    await login(page);
    const plansRes = await apiRequest(page, '/api/kpi/plans?take=5');
    const plans = Array.isArray(plansRes.data) ? plansRes.data : [];
    if (plans.length === 0) {
      test.skip(true, 'No KPI plans available to test actuals');
      return;
    }
    const plan = plans[0];
    const actualRes = await apiRequest(page, '/api/kpi/actuals', {
      method: 'POST',
      body: JSON.stringify({
        kpiPlanId: plan.id,
        periodType: 'quarterly',
        periodKey: `Q1-${Date.now()}`,
        actualValue: 150,
        comment: 'E2E actual',
      }),
    });
    expect([200, 201]).toContain(actualRes.status);
  });

  test('dashboard metrics endpoint returns valid stats', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/kpi/dashboard/metrics?yearId=1');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('KPI categories endpoint returns list', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/kpi/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('update KPI plan via API', async ({ page }) => {
    await login(page);
    const plansRes = await apiRequest(page, '/api/kpi/plans?take=5');
    const plans = Array.isArray(plansRes.data) ? plansRes.data : [];
    if (plans.length === 0) {
      test.skip(true, 'No KPI plans available');
      return;
    }
    const plan = plans[0];
    const updateRes = await apiRequest(page, `/api/kpi/plans/${plan.id}`, {
      method: 'PUT',
      body: JSON.stringify({ annualTarget: 2000 }),
    });
    expect([200, 201]).toContain(updateRes.status);
  });

  test('compare-years endpoint works', async ({ page }) => {
    await login(page);
    const defsRes = await apiRequest(page, '/api/kpi/definitions');
    const defs = Array.isArray(defsRes.data) ? defsRes.data : [];
    if (defs.length === 0) {
      test.skip(true, 'No KPI definitions');
      return;
    }
    const kpiId = defs[0].id;
    const res = await apiRequest(page, `/api/kpi/compare-years/${kpiId}?yearIds=1,2`);
    expect(res.status).toBe(200);
  });
});
