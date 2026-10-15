import { test, expect } from '@playwright/test';
import { apiRequest, login, logout } from './helpers';

const ADMIN_USER = { username: 'admin', password: 'admin123' };

test.describe.serial('Operational UAT - Complete Lifecycle', () => {
  let executorId: number;
  let approverId: number;
  let activityId: number;
  let kpiPlanId: number;
  let kpiActualId: number;
  let yearId: number;

  async function getYearId(page: any): Promise<number> {
    const res = await apiRequest(page, '/api/planning/years');
    if (res.status === 200 && Array.isArray(res.data)) {
      const active = res.data.find((y: any) => y.status === 'active');
      if (active?.id) return active.id;
    }
    const res2 = await apiRequest(page, '/api/planning/years/10');
    if (res2.status === 200 && res2.data?.year === 2027) return 10;
    return 10;
  }

  test('Scenario 1: Executor submits activity, approver approves', async ({ page }) => {
    await login(page, ADMIN_USER.username, ADMIN_USER.password);
    executorId = 77;
    approverId = 1;
    yearId = await getYearId(page);

    await logout(page);
    await login(page, 'executor', 'executor123');

    const actRes = await apiRequest(page, '/api/workplan/activities', {
      method: 'POST',
      body: JSON.stringify({
        yearId,
        title: 'E2E Test Activity',
        description: 'Testing activity workflow',
        priority: 'high',
        implementationStatus: 'not_started',
        progress: 0,
        plannedQuantity: 100,
        unit: 'units',
      }),
    });
    expect(actRes.status).toBe(201);
    activityId = actRes.data?.id;
    expect(activityId).toBeDefined();
    expect(actRes.data?.approvalStatus).toBe('draft');

    const progressRes = await apiRequest(page, `/api/workplan/activities/${activityId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progress: 60, note: 'Work in progress', submittedBy: executorId }),
    });
    expect([200, 201]).toContain(progressRes.status);

    await page.waitForTimeout(1000);

    const submitRes = await apiRequest(page, `/api/workplan/activities/${activityId}/submit`, {
      method: 'POST',
    });
    expect([200, 201]).toContain(submitRes.status);
    expect(submitRes.data?.approvalStatus).toBe('submitted');

    await logout(page);
    await login(page, 'admin', 'admin123');

    await page.goto('/approvals');
    await page.waitForTimeout(3000);

    const approveRes = await apiRequest(page, `/api/workplan/activities/${activityId}/approve`, {
      method: 'POST',
    });
    expect([200, 201]).toContain(approveRes.status);
    expect(approveRes.data?.approvalStatus).toBe('approved');

    const verifyRes = await apiRequest(page, `/api/workplan/activities/${activityId}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.data?.approvalStatus).toBe('approved');
  });

  test('Scenario 2: Approver rejects, executor resubmits, approver approves', async ({ page }) => {
    await login(page, ADMIN_USER.username, ADMIN_USER.password);
    yearId = yearId || 10;

    const actRes = await apiRequest(page, '/api/workplan/activities', {
      method: 'POST',
      body: JSON.stringify({
        yearId,
        title: 'E2E Rejection Test Activity',
        description: 'Testing rejection workflow',
        priority: 'medium',
        implementationStatus: 'not_started',
        progress: 30,
      }),
    });
    expect(actRes.status).toBe(201);
    const rejectActivityId = actRes.data?.id;
    expect(rejectActivityId).toBeDefined();

    await logout(page);
    await login(page, 'executor', 'executor123');

    const submitRes = await apiRequest(page, `/api/workplan/activities/${rejectActivityId}/submit`, {
      method: 'POST',
    });
    expect(submitRes.data?.approvalStatus).toBe('submitted');

    await logout(page);
    await login(page, 'admin', 'admin123');

    const rejectApiRes = await apiRequest(page, `/api/workplan/activities/${rejectActivityId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments: 'Needs more detail' }),
    });
    expect([200, 201]).toContain(rejectApiRes.status);
    expect(rejectApiRes.data?.approvalStatus).toBe('rejected');

    await logout(page);
    await login(page, 'executor', 'executor123');

    const updateRes = await apiRequest(page, `/api/workplan/activities/${rejectActivityId}`, {
      method: 'PUT',
      body: JSON.stringify({ title: 'E2E Rejection Test Activity - UPDATED' }),
    });
    expect(updateRes.status).toBe(200);

    const resubmitRes = await apiRequest(page, `/api/workplan/activities/${rejectActivityId}/resubmit`, {
      method: 'POST',
    });
    expect(resubmitRes.data?.approvalStatus).toBe('submitted');

    await logout(page);
    await login(page, 'admin', 'admin123');

    const approveRes = await apiRequest(page, `/api/workplan/activities/${rejectActivityId}/approve`, {
      method: 'POST',
    });
    expect(approveRes.data?.approvalStatus).toBe('approved');

    const verifyRes = await apiRequest(page, `/api/workplan/activities/${rejectActivityId}`);
    expect(verifyRes.data?.approvalStatus).toBe('approved');
    expect(verifyRes.data?.title).toBe('E2E Rejection Test Activity - UPDATED');
  });

  test('Scenario 3: Executor cannot approve own submission', async ({ page }) => {
    await login(page, ADMIN_USER.username, ADMIN_USER.password);
    yearId = yearId || 10;

    await logout(page);
    await login(page, 'executor', 'executor123');

    const actRes = await apiRequest(page, '/api/workplan/activities', {
      method: 'POST',
      body: JSON.stringify({
        yearId,
        title: 'E2E SoD Test Activity',
        description: 'Testing separation of duties',
        priority: 'medium',
        implementationStatus: 'in_progress',
        progress: 50,
      }),
    });
    expect(actRes.status).toBe(201);
    const sodActivityId = actRes.data?.id;

    const approveRes = await apiRequest(page, `/api/workplan/activities/${sodActivityId}/approve`, {
      method: 'POST',
    });
    expect(approveRes.status).toBe(403);

    const rejectRes = await apiRequest(page, `/api/workplan/activities/${sodActivityId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments: 'test' }),
    });
    expect(rejectRes.status).toBe(403);

    await logout(page);
    await login(page, 'admin', 'admin123');

    const approverApproveRes = await apiRequest(page, `/api/workplan/activities/${sodActivityId}/approve`, {
      method: 'POST',
    });
    expect([200, 201]).toContain(approverApproveRes.status);
  });

  test('Scenario 4: KPI target, actual entry, verify, dashboard', async ({ page }) => {
    await login(page, ADMIN_USER.username, ADMIN_USER.password);
    yearId = yearId || 10;

    const defRes = await apiRequest(page, '/api/kpi/definitions', {
      method: 'POST',
      body: JSON.stringify({
        code: `E2E-KPI-${Date.now()}`,
        name: 'E2E KPI Test',
        area: 'Operations',
        definition: 'Test KPI',
        formula: 'sum(value)',
        unit: 'ETB',
        frequency: 'quarterly',
        direction: 'higher_is_better',
      }),
    });
    expect([200, 201]).toContain(defRes.status);
    const kpiId = defRes.data?.id;

    const planRes = await apiRequest(page, '/api/kpi/plans', {
      method: 'POST',
      body: JSON.stringify({
        yearId,
        kpiId: kpiId,
        annualTarget: 1000,
        q1Target: 250,
        q2Target: 250,
        q3Target: 250,
        q4Target: 250,
        weight: 1,
      }),
    });
    expect([200, 201]).toContain(planRes.status);
    kpiPlanId = planRes.data?.id;
    expect(kpiPlanId).toBeDefined();

    await page.goto('/kpi');
    await page.waitForTimeout(3000);

    const actualRes = await apiRequest(page, '/api/kpi/actuals', {
      method: 'POST',
      body: JSON.stringify({
        kpiPlanId: kpiPlanId,
        periodType: 'quarterly',
        periodKey: 'Q1',
        actualValue: 800,
        comment: 'E2E actual entry',
      }),
    });
    expect([200, 201]).toContain(actualRes.status);
    kpiActualId = actualRes.data?.id;
    expect(kpiActualId).toBeDefined();

    const dupRes = await apiRequest(page, '/api/kpi/actuals', {
      method: 'POST',
      body: JSON.stringify({
        kpiPlanId: kpiPlanId,
        periodType: 'quarterly',
        periodKey: 'Q1',
        actualValue: 500,
      }),
    });
    expect(dupRes.status).toBe(400);

    await page.reload();
    await page.waitForTimeout(3000);

    const actualsRes = await apiRequest(page, `/api/kpi/actuals/${kpiPlanId}`);
    expect(actualsRes.status).toBe(200);
    expect(Array.isArray(actualsRes.data)).toBe(true);
    const actuals = actualsRes.data as any[];
    expect(actuals.length).toBeGreaterThan(0);
    expect(actuals[0].actualValue).toBe(800);

    const metricsRes = await apiRequest(page, `/api/kpi/metrics/${kpiPlanId}`);
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.data?.target).toBe(1000);
    expect(metricsRes.data?.actual).toBe(800);
    expect(metricsRes.data?.achievementPercentage).toBe(80);
    expect(metricsRes.data?.variance).toBe(-200);

    const verifyRes = await apiRequest(page, `/api/kpi/actuals/${kpiActualId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ userId: approverId }),
    });
    expect([200, 201]).toContain(verifyRes.status);

    const actualsAfterVerify = await apiRequest(page, `/api/kpi/actuals/${kpiPlanId}`);
    const foundActual = (actualsAfterVerify.data as any[]).find((a: any) => a.id === kpiActualId);
    expect(foundActual?.approvalStatus).toBe('verified');

    const dashRes = await apiRequest(page, `/api/dashboard?yearId=${yearId}`);
    expect(dashRes.status).toBe(200);
    expect(dashRes.data?.kpi?.totalTarget).toBeGreaterThan(0);

    await page.goto('/reporting');
    await page.waitForTimeout(2000);
  });

  test('Scenario 5: Closed year blocks mutations', async ({ page }) => {
    await login(page, ADMIN_USER.username, ADMIN_USER.password);

    const closedYearRes = await apiRequest(page, '/api/planning/years');
    const closedYear = (closedYearRes.status === 200 && Array.isArray(closedYearRes.data))
      ? closedYearRes.data.find((y: any) => y.status === 'closed' && y.year === 2019)
      : null;
    const closedYearId = closedYear?.id || 2;

    await logout(page);
    await login(page, 'executor', 'executor123');

    const actRes = await apiRequest(page, '/api/workplan/activities', {
      method: 'POST',
      body: JSON.stringify({
        yearId: closedYearId,
        title: 'Should Fail',
        priority: 'medium',
        implementationStatus: 'not_started',
        progress: 0,
      }),
    });
    expect([403, 409]).toContain(actRes.status);

    const readRes = await apiRequest(page, `/api/workplan/activities?yearId=${closedYearId}`);
    expect(readRes.status).toBe(200);
  });
});