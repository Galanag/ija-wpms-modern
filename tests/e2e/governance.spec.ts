import { test, expect } from '@playwright/test';
import { apiRequest, login } from './helpers';

test.describe.serial('Governance and Closed-Year Protection', () => {
  test('governance page loads with roles tab', async ({ page }) => {
    await login(page);
    await page.goto('/governance');
    await expect(page.getByRole('heading', { name: /Governance/i }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Roles/i }).first()).toBeVisible();
  });

  test('roles list API returns seeded roles', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/governance/roles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });

  test('permissions endpoint for current user', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/governance/permissions');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('audit log endpoint returns entries', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/governance/audit?limit=10');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('year protection check for closed year denies modification', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const closedYear = years.find((y: any) => y.status === 'closed') || years.find((y: any) => y.year <= 2019) || years[years.length - 1];
    if (!closedYear) {
      test.skip(true, 'No closed year found');
      return;
    }
    const res = await apiRequest(page, '/api/governance/check-year-protection', {
      method: 'POST',
      body: JSON.stringify({ userId: 19, resource: 'kpi_plan', yearId: closedYear.id }),
    });
    expect([200, 201]).toContain(res.status);
    expect(res.data.canModify).toBe(false);
  });

  test('year protection check for active year allows modification', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const activeYear = years.find((y: any) => y.status === 'active') || years.find((y: any) => y.year === 2027) || years[0];
    if (!activeYear) {
      test.skip(true, 'No active year');
      return;
    }
    const res = await apiRequest(page, '/api/governance/check-year-protection', {
      method: 'POST',
      body: JSON.stringify({ userId: 1, resource: 'kpi_plan', yearId: activeYear.id }),
    });
    expect([200, 201]).toContain(res.status);
    expect(res.data.canModify).toBe(true);
  });

  test('create custom role via API', async ({ page }) => {
    await login(page);
    const roleRes = await apiRequest(page, '/api/governance/roles', {
      method: 'POST',
      body: JSON.stringify({
        name: `E2E Role ${Date.now()}`,
        code: `e2e_role_${Date.now()}`,
        description: 'E2E test role',
        permissions: [
          { resource: 'kpi', actions: ['view', 'create'] },
          { resource: 'activity', actions: ['view'] },
        ],
      }),
    });
    expect([200, 201]).toContain(roleRes.status);
    expect(roleRes.data).toBeTruthy();
  });

  test('approval check endpoint', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/governance/can-approve', {
      method: 'POST',
      body: JSON.stringify({ userId: 1, entity: 'kpi_plan', recordId: 1 }),
    });
    expect([200, 201]).toContain(res.status);
  });
});
