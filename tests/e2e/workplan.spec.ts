import { test, expect } from '@playwright/test';
import { apiRequest, login } from './helpers';

test.describe.serial('Workplan Management', () => {
  test('workplan page loads with filters and stats', async ({ page }) => {
    await login(page);
    await page.goto('/workplan');
    await expect(page.getByRole('heading', { name: 'Annual Work Plan' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Total')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Completed' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'In Progress' })).toBeVisible();
  });

  test('create work plan via API', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    expect(years.length).toBeGreaterThan(0);
    const activeYear = years.find((y: any) => y.status === 'active') || years[0];
    const yearId = activeYear.id;

    const createRes = await apiRequest(page, '/api/workplan/plans', {
      method: 'POST',
      body: JSON.stringify({
        name: `E2E WP ${Date.now()}`,
        description: 'E2E workplan',
        yearId,
      }),
    });
    expect([200, 201]).toContain(createRes.status);
    expect(createRes.data).toBeTruthy();
  });

  test('create activity via API and verify subtasks/deliverables', async ({ page }) => {
    await login(page);
    const plansRes = await apiRequest(page, '/api/workplan/plans?take=5');
    const plans = Array.isArray(plansRes.data) ? plansRes.data : [];
    if (plans.length === 0) {
      test.skip(true, 'No work plans available');
      return;
    }
    const plan = plans[0];

    const actRes = await apiRequest(page, '/api/workplan/activities', {
      method: 'POST',
      body: JSON.stringify({
        workPlanId: plan.id,
        yearId: plan.yearId,
        title: `E2E Activity ${Date.now()}`,
        description: 'E2E test activity',
        quarter: 'Q1',
        priority: 'high',
        implementationStatus: 'not_started',
        progress: 0,
      }),
    });
    expect([200, 201]).toContain(actRes.status);
    const activityId = actRes.data?.id;

    if (activityId) {
      const subtaskRes = await apiRequest(page, '/api/workplan/subtasks', {
        method: 'POST',
        body: JSON.stringify({
          activityId,
          title: `E2E Subtask ${Date.now()}`,
          status: 'not_started',
          progress: 0,
        }),
      });
      expect([200, 201]).toContain(subtaskRes.status);

      const delivRes = await apiRequest(page, '/api/workplan/deliverables', {
        method: 'POST',
        body: JSON.stringify({
          activityId,
          title: `E2E Deliverable ${Date.now()}`,
          status: 'pending',
        }),
      });
      expect([200, 201]).toContain(delivRes.status);
    }
  });

  test('workplan statistics endpoint returns valid data', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const yearId = years.length > 0 ? years[0].id : 1;
    const res = await apiRequest(page, `/api/workplan/statistics/${yearId}`);
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('overdue activities endpoint', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const yearId = years.length > 0 ? years[0].id : 1;
    const res = await apiRequest(page, `/api/workplan/overdue/${yearId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('schedule endpoint', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    const yearId = years.length > 0 ? years[0].id : 1;
    const res = await apiRequest(page, `/api/workplan/schedule/${yearId}`);
    expect(res.status).toBe(200);
  });

  test('activity progress update via API', async ({ page }) => {
    await login(page);
    const actsRes = await apiRequest(page, '/api/workplan/activities?take=5');
    const acts = Array.isArray(actsRes.data) ? actsRes.data : [];
    if (acts.length === 0) {
      test.skip(true, 'No activities');
      return;
    }
    const act = acts[0];
    const progressRes = await apiRequest(page, `/api/workplan/activities/${act.id}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progress: 50, note: 'E2E progress update' }),
    });
    expect([200, 201]).toContain(progressRes.status);
  });
});
