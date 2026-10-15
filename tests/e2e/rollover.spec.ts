import { test, expect } from '@playwright/test';
import { apiRequest, login } from './helpers';

test.describe.serial('Rollover', () => {
  test('rollover page loads with wizard', async ({ page }) => {
    await login(page);
    await page.goto('/rollover');
    await expect(page.getByRole('heading', { name: /Plan Rollover Wizard/i })).toBeVisible({ timeout: 20_000 });
  });

  test('rollover items API returns structure items', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/rollover/items');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
    expect(res.data.structureItems).toBeTruthy();
  });

  test('rollover preview for valid years returns valid response', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    let allYears = years;
    if (allYears.length < 2) {
      const sourceYear = allYears[0];
      let newYear = sourceYear ? sourceYear.year + 1 : 2028;
      const existingYears = new Set(allYears.map((y: any) => y.year));
      while (existingYears.has(newYear)) {
        newYear++;
      }
      const createRes = await apiRequest(page, '/api/planning/years', {
        method: 'POST',
        body: JSON.stringify({ year: newYear, label: `FY${newYear}`, status: 'active' }),
      });
      if ([200, 201].includes(createRes.status) && createRes.data?.id) {
        allYears = [...allYears, createRes.data];
      }
    }
    if (allYears.length < 2) {
      test.skip(true, 'Need at least 2 planning years');
      return;
    }
    const sourceYear = allYears.find((y: any) => y.status === 'active') || allYears[0];
    const targetYear = allYears[allYears.length - 1];
    if (sourceYear.id === targetYear.id) {
      test.skip(true, 'Source and target are the same');
      return;
    }
    const previewRes = await apiRequest(page, '/api/rollover/preview', {
      method: 'POST',
      body: JSON.stringify({
        sourceYearId: sourceYear.id,
        targetYearId: targetYear.id,
        mode: 'selected',
        selectedItems: ['strategic', 'kpi'],
      }),
    });
    expect([200, 201]).toContain(previewRes.status);
    expect(previewRes.data).toBeTruthy();
    expect(previewRes.data.sourceYear).toBeTruthy();
    expect(previewRes.data.targetYear).toBeTruthy();
    expect(previewRes.data.items).toBeTruthy();
  });

  test('rollover preview blocks closed source year', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    let years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    let closedYear = years.find((y: any) => y.status === 'closed');
    if (!closedYear) {
      const sourceYear = years.find((y: any) => y.status === 'active') || years[0];
      if (sourceYear) {
        const updateRes = await apiRequest(page, `/api/planning/years/${sourceYear.id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'closed' }),
        });
        if ([200, 201].includes(updateRes.status)) {
          closedYear = updateRes.data?.status === 'closed' ? updateRes.data : undefined;
        }
      }
    }
    if (years.length < 2) {
      const createRes = await apiRequest(page, '/api/planning/years', {
        method: 'POST',
        body: JSON.stringify({ year: 2029, label: 'FY2029', status: 'active' }),
      });
      if ([200, 201].includes(createRes.status) && createRes.data?.id) {
        years = [...years, createRes.data];
      }
    }
    if (!closedYear || years.length < 2) {
      test.skip(true, 'Need closed year and another year');
      return;
    }
    const activeYear = years.find((y: any) => y.status === 'active' && y.id !== closedYear.id) || years.find((y: any) => y.id !== closedYear.id);
    if (!activeYear || activeYear.id === closedYear.id) {
      test.skip(true, 'Need closed year and another distinct year');
      return;
    }
    const previewRes = await apiRequest(page, '/api/rollover/preview', {
      method: 'POST',
      body: JSON.stringify({
        sourceYearId: closedYear.id,
        targetYearId: activeYear.id,
        mode: 'all',
      }),
    });
    expect([200, 201]).toContain(previewRes.status);
    expect(previewRes.data.protection).toBeTruthy();
    expect(previewRes.data.protection.sourceClosed).toBe(true);
  });

  test('rollover jobs endpoint', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/rollover/jobs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('execute rollover creates job', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    if (years.length < 2) {
      test.skip(true, 'Need at least 2 planning years');
      return;
    }
    const sourceYear = years.find((y: any) => y.status === 'active') || years[0];
    let targetYear = years.find((y: any) => y.status === 'active' && y.id !== sourceYear.id);
    if (!targetYear) {
      const existingYears = new Set(years.map((y: any) => y.year));
      let newYear = sourceYear.year + 1;
      while (existingYears.has(newYear)) {
        newYear++;
      }
      const createRes = await apiRequest(page, '/api/planning/years', {
        method: 'POST',
        body: JSON.stringify({ year: newYear, label: `FY${newYear}`, status: 'active' }),
      });
      if ([200, 201].includes(createRes.status) && createRes.data?.id) {
        targetYear = createRes.data;
      }
    }
    if (!targetYear || sourceYear.id === targetYear.id) {
      test.skip(true, 'Need two distinct active years for rollover');
      return;
    }
    const executeRes = await apiRequest(page, '/api/rollover/execute', {
      method: 'POST',
      body: JSON.stringify({
        sourceYearId: sourceYear.id,
        targetYearId: targetYear.id,
        mode: 'selected',
        selectedItems: ['kpi'],
      }),
    });
    expect([200, 201]).toContain(executeRes.status);
    expect(executeRes.data).toBeTruthy();
  });
});
