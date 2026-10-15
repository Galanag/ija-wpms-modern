import { test, expect } from '@playwright/test';
import { login, apiRequest } from './helpers';

const BUDGET_NAME = `E2E Budget ${Date.now()}`;

test.describe.serial('Budget Management', () => {
  test('budget page loads', async ({ page }) => {
    await login(page);
    await page.goto('/budget');
    await expect(page.getByRole('heading', { name: /Budget/i }).first()).toBeVisible({ timeout: 20_000 });
  });

  test('create budget via API with lines', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    expect(years.length).toBeGreaterThan(0);
    const activeYear = years.find((y: any) => y.status === 'active') || years[years.length - 1];
    const yearId = activeYear.id;

    const budgetRes = await apiRequest(page, '/api/budget', {
      method: 'POST',
      body: JSON.stringify({
        category: BUDGET_NAME,
        plannedAmount: 500000,
        currencyId: 1,
        yearId,
      }),
    });
    expect([200, 201]).toContain(budgetRes.status);
    expect(budgetRes.data).toBeTruthy();
    const budgetId = budgetRes.data?.id;

    if (budgetId) {
      const lineRes = await apiRequest(page, '/api/budget/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId,
          lineName: 'Operations',
          plannedAmount: 100000,
        }),
      });
      expect([200, 201]).toContain(lineRes.status);
    }
  });

  test('budget-vs-actual calculation endpoint', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const yearId = years.length > 0 ? years[0].id : 1;
    const res = await apiRequest(page, `/api/budget/calculations/budget-vs-actual/${yearId}`);
    expect(res.status).toBe(200);
  });

  test('quarterly budget calculation endpoint', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const yearId = years.length > 0 ? years[0].id : 1;
    const res = await apiRequest(page, `/api/budget/calculations/quarterly/${yearId}`);
    expect(res.status).toBe(200);
  });

  test('budget summary endpoint', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const yearId = years.length > 0 ? years[0].id : 1;
    const res = await apiRequest(page, `/api/budget/calculations/summary/${yearId}`);
    expect(res.status).toBe(200);
  });

  test('expense breakdown endpoint', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const yearId = years.length > 0 ? years[0].id : 1;
    const res = await apiRequest(page, `/api/budget/calculations/expense-breakdown/${yearId}`);
    expect(res.status).toBe(200);
  });

  test('finance entries CRUD via API', async ({ page }) => {
    await login(page);
    const budgetsRes = await apiRequest(page, '/api/budget');
    const budgets = Array.isArray(budgetsRes.data) ? budgetsRes.data : [];
    if (budgets.length === 0) {
      test.skip(true, 'No budgets');
      return;
    }
    const budget = budgets[0];
    const entryRes = await apiRequest(page, '/api/budget/entries', {
      method: 'POST',
      body: JSON.stringify({
        budgetId: budget.id,
        entryType: 'expense',
        amount: 50000,
        description: 'E2E finance entry',
      }),
    });
    expect([200, 201]).toContain(entryRes.status);
  });
});
