import { test, expect } from '@playwright/test';
import { apiRequest, login } from './helpers';

test.describe.serial('Strategic Hierarchy', () => {
  test('strategic page loads', async ({ page }) => {
    await login(page);
    await page.goto('/strategic');
    await expect(page.getByRole('heading', { name: 'Strategic Management' })).toBeVisible({ timeout: 20_000 });
  });

  test('strategic plans endpoint returns list', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/strategic/plans');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('create strategic plan via API', async ({ page }) => {
    await login(page);
    const createRes = await apiRequest(page, '/api/strategic/plans', {
      method: 'POST',
      body: JSON.stringify({
        name: `E2E Strategic Plan ${Date.now()}`,
        description: 'E2E test strategic plan',
      }),
    });
    expect([200, 201]).toContain(createRes.status);
    expect(createRes.data).toBeTruthy();
  });

  test('create theme linked to plan via API', async ({ page }) => {
    await login(page);
    const plansRes = await apiRequest(page, '/api/strategic/plans');
    const plans = Array.isArray(plansRes.data) ? plansRes.data : [];
    if (plans.length === 0) {
      test.skip(true, 'No strategic plans');
      return;
    }
    const plan = plans[0];
    const themeRes = await apiRequest(page, '/api/strategic/themes', {
      method: 'POST',
      body: JSON.stringify({
        planId: plan.id,
        name: `E2E Theme ${Date.now()}`,
        code: 'ETH-001',
        description: 'E2E theme',
        orderIndex: 1,
      }),
    });
    expect([200, 201]).toContain(themeRes.status);
    expect(themeRes.data).toBeTruthy();
  });

  test('create result linked to theme via API', async ({ page }) => {
    await login(page);
    const plansRes = await apiRequest(page, '/api/strategic/plans');
    const plans = Array.isArray(plansRes.data) ? plansRes.data : [];
    if (plans.length === 0) {
      test.skip(true, 'No strategic plans');
      return;
    }
    const plan = plans[0];
    if (!plan.themes || plan.themes.length === 0) {
      const themeRes = await apiRequest(page, '/api/strategic/themes', {
        method: 'POST',
        body: JSON.stringify({
          planId: plan.id,
          name: `E2E Theme ${Date.now()}`,
          code: 'ETH-002',
          orderIndex: 1,
        }),
      });
      if (themeRes.data?.id) plan.themes = [themeRes.data];
    }
    const theme = plan.themes?.[0];
    if (!theme) {
      test.skip(true, 'No theme available');
      return;
    }
    const resultRes = await apiRequest(page, '/api/strategic/results', {
      method: 'POST',
      body: JSON.stringify({
        themeId: theme.id,
        name: `E2E Result ${Date.now()}`,
        code: 'ER-001',
        expectedOutcome: 'Improved outcomes',
        orderIndex: 1,
      }),
    });
    expect([200, 201]).toContain(resultRes.status);
  });

  test('create goal linked to result via API', async ({ page }) => {
    await login(page);
    const plansRes = await apiRequest(page, '/api/strategic/plans');
    const plans = Array.isArray(plansRes.data) ? plansRes.data : [];
    if (plans.length === 0) {
      test.skip(true, 'No strategic plans');
      return;
    }
    const plan = plans[0];
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const yearId = years.length > 0 ? years[0].id : 1;
    const resultRes = await apiRequest(page, '/api/strategic/results', {
      method: 'POST',
      body: JSON.stringify({
        planId: plan.id,
        name: `E2E Result ${Date.now()}`,
        code: 'ER-002',
        orderIndex: 1,
      }),
    });
    if (resultRes.data?.id) {
      const goalRes = await apiRequest(page, '/api/strategic/goals', {
        method: 'POST',
        body: JSON.stringify({
          resultId: resultRes.data.id,
          yearId,
          name: `E2E Goal ${Date.now()}`,
          code: 'EG-001',
        }),
      });
      expect([200, 201]).toContain(goalRes.status);
    }
  });

  test('hierarchy endpoint returns structure for year', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/strategic/hierarchy/1');
    expect(res.status).toBe(200);
  });

  test('statistics endpoint', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/strategic/statistics');
    expect(res.status).toBe(200);
  });

  test('copy structure to year endpoint', async ({ page }) => {
    await login(page);
    const plansRes = await apiRequest(page, '/api/strategic/plans');
    const plans = Array.isArray(plansRes.data) ? plansRes.data : [];
    let activePlan = plans.find((p: any) => p.status === 'active') || plans.find((p: any) => p.approvalStatus === 'approved');
    if (!activePlan) {
      const yearsRes = await apiRequest(page, '/api/planning/years');
      const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
      const yearId = years.length > 0 ? years[0].id : 1;
      const createRes = await apiRequest(page, '/api/strategic/plans', {
        method: 'POST',
        body: JSON.stringify({ name: `E2E Plan ${Date.now()}`, yearId, planningType: 'annual' }),
      });
      if (![200, 201].includes(createRes.status) || !createRes.data?.id) {
        const body: any = { name: `E2E Plan ${Date.now()}`, planningType: 'annual' };
        if (yearId) body.yearId = yearId;
        const altRes = await apiRequest(page, '/api/strategic/plans', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        Object.assign(createRes, altRes);
      }
      if ([200, 201].includes(createRes.status) && createRes.data?.id) {
        activePlan = createRes.data;
      } else if (plans.length > 0) {
        activePlan = plans[0];
      }
    }
    if (!activePlan) {
      test.skip(true, 'Need an active strategic plan');
      return;
    }
    const yearsRes = await apiRequest(page, '/api/planning/years');
    let years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    if (years.length < 2) {
      const sourceYear = years[0];
      let newYear = sourceYear ? sourceYear.year + 1 : 2028;
      const existingYears = new Set(years.map((y: any) => y.year));
      while (existingYears.has(newYear)) {
        newYear++;
      }
      const createYearRes = await apiRequest(page, '/api/planning/years', {
        method: 'POST',
        body: JSON.stringify({ year: newYear, label: `FY${newYear}`, status: 'active' }),
      });
      if ([200, 201].includes(createYearRes.status) && createYearRes.data?.id) {
        years = [...years, createYearRes.data];
      }
    }
    if (years.length < 2) {
      test.skip(true, 'Need at least 2 years');
      return;
    }
    const sourceYear = years.find((y: any) => y.status === 'closed') || years[0];
    const targetYear = years.find((y: any) => y.id !== sourceYear.id) || years[years.length - 1];
    if (sourceYear.id === targetYear.id) {
      test.skip(true, 'Source and target are the same');
      return;
    }
    const res = await apiRequest(page, '/api/strategic/copy-to-year', {
      method: 'POST',
      body: JSON.stringify({ sourceYearId: sourceYear.id, targetYearId: targetYear.id }),
    });
    expect([200, 201]).toContain(res.status);
  });
});
