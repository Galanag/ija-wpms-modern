import { test, expect } from '@playwright/test';
import { apiRequest, login } from './helpers';

const ADMIN_USER = { username: 'admin', password: 'admin123' };
const YEAR_ID = 10; // 2027 active planning year

let reviewId: number;
let findingId: number;
let decisionId: number;
let actionId: number;

test.describe.serial('Management Review Module', () => {
  test('Step 1-2: create management review for yearId=10 (2027 active year)', async ({ page }) => {
    await login(page, ADMIN_USER.username, ADMIN_USER.password);

    const createRes = await apiRequest(page, '/api/management-reviews', {
      method: 'POST',
      body: JSON.stringify({
        yearId: YEAR_ID,
        reviewPeriod: 'Q1 2027 Management Review',
        reviewDate: '2027-01-15',
        participants: ['admin', 'auditor', 'director'],
        notes: 'Quarterly leadership review for Q1 2027.',
      }),
    });

    expect([200, 201]).toContain(createRes.status);
    expect(createRes.data).toBeTruthy();
    reviewId = createRes.data.id;
    expect(reviewId).toBeDefined();
    expect(createRes.data.yearId).toBe(YEAR_ID);
    expect(createRes.data.reviewPeriod).toBe('Q1 2027 Management Review');
    expect(createRes.data.status).toBe('draft');
    expect(Array.isArray(createRes.data.participants)).toBe(true);
  });

  test('Step 3: add a finding to the review', async ({ page }) => {
    await login(page, ADMIN_USER.username, ADMIN_USER.password);

    const res = await apiRequest(page, `/api/management-reviews/${reviewId}/findings`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Budget variance exceeds threshold',
        description: 'Q1 expenditures are 12% over plan in the operations category.',
        severity: 'high',
        category: 'budget',
        sourceInfo: 'Finance ledger comparison Q1-2027',
      }),
    });

    expect([200, 201]).toContain(res.status);
    expect(res.data).toBeTruthy();
    findingId = res.data.id;
    expect(res.data.reviewId).toBe(reviewId);
    expect(res.data.severity).toBe('high');
    expect(res.data.category).toBe('budget');
  });

  test('Step 4: add a decision to the review', async ({ page }) => {
    await login(page, ADMIN_USER.username, ADMIN_USER.password);

    const res = await apiRequest(page, `/api/management-reviews/${reviewId}/decisions`, {
      method: 'POST',
      body: JSON.stringify({
        description: 'Approve immediate corrective action for operations spending.',
        decision: 'approved',
        dueDate: '2027-02-28',
        assignedTo: 1,
        status: 'open',
      }),
    });

    expect([200, 201]).toContain(res.status);
    expect(res.data).toBeTruthy();
    decisionId = res.data.id;
    expect(res.data.reviewId).toBe(reviewId);
    expect(res.data.decision).toBe('approved');
    expect(res.data.assignedTo).toBe(1);
  });

  test('Step 5: add an action with a responsible person', async ({ page }) => {
    await login(page, ADMIN_USER.username, ADMIN_USER.password);

    const res = await apiRequest(page, `/api/management-reviews/${reviewId}/actions`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Review and re-baseline Q1 budget',
        description: 'Conduct spend analysis and update the approved budget baseline.',
        responsiblePersonId: 1,
        dueDate: '2027-02-28',
        status: 'open',
        followUpStatus: 'pending_identification',
      }),
    });

    expect([200, 201]).toContain(res.status);
    expect(res.data).toBeTruthy();
    actionId = res.data.id;
    expect(res.data.reviewId).toBe(reviewId);
    expect(res.data.title).toBe('Review and re-baseline Q1 budget');
    expect(res.data.responsiblePersonId).toBe(1);
    expect(res.data.status).toBe('open');
  });

  test('Step 6-7: reload detail and verify persistence of all items', async ({ page }) => {
    await login(page, ADMIN_USER.username, ADMIN_USER.password);

    const res = await apiRequest(page, `/api/management-reviews/${reviewId}`);
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();

    expect(res.data.id).toBe(reviewId);
    expect(res.data.reviewPeriod).toBe('Q1 2027 Management Review');

    const foundFinding = (res.data.ReviewFinding || []).find((f: any) => f.id === findingId);
    expect(foundFinding).toBeTruthy();
    expect(foundFinding.severity).toBe('high');

    const foundDecision = (res.data.ReviewDecision || []).find((d: any) => d.id === decisionId);
    expect(foundDecision).toBeTruthy();
    expect(foundDecision.decision).toBe('approved');

    const foundAction = (res.data.ReviewAction || []).find((a: any) => a.id === actionId);
    expect(foundAction).toBeTruthy();
    expect(foundAction.responsiblePersonId).toBe(1);
    expect(foundAction.status).toBe('open');

    // List endpoint should also return the review
    const listRes = await apiRequest(page, `/api/management-reviews?yearId=${YEAR_ID}`);
    expect(listRes.status).toBe(200);
    const listed = (Array.isArray(listRes.data) ? listRes.data : []).find((r: any) => r.id === reviewId);
    expect(listed).toBeTruthy();
  });

  test('Step 8: update action status', async ({ page }) => {
    await login(page, ADMIN_USER.username, ADMIN_USER.password);

    const res = await apiRequest(page, `/api/management-reviews/${reviewId}/actions/${actionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    });

    expect([200, 201]).toContain(res.status);
    expect(res.data).toBeTruthy();
    expect(res.data.id).toBe(actionId);
    expect(res.data.status).toBe('completed');

    // Persist via reload
    const detailRes = await apiRequest(page, `/api/management-reviews/${reviewId}`);
    const updatedAction = (detailRes.data.ReviewAction || []).find((a: any) => a.id === actionId);
    expect(updatedAction).toBeTruthy();
    expect(updatedAction.status).toBe('completed');
  });

  test('Step 9: close the review', async ({ page }) => {
    await login(page, ADMIN_USER.username, ADMIN_USER.password);

    const res = await apiRequest(page, `/api/management-reviews/${reviewId}/close`, {
      method: 'POST',
    });

    expect([200, 201]).toContain(res.status);
    expect(res.data).toBeTruthy();
    expect(res.data.status).toBe('closed');

    // Verify persisted closed state
    const detailRes = await apiRequest(page, `/api/management-reviews/${reviewId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.data.status).toBe('closed');
  });

  test('Step 10: verify audit records exist for create and close', async ({ page }) => {
    await login(page, ADMIN_USER.username, ADMIN_USER.password);

    const auditRes = await apiRequest(
      page,
      `/api/governance/audit?entity=ManagementReview&recordId=${reviewId}&limit=50`,
    );
    expect(auditRes.status).toBe(200);
    expect(auditRes.data).toBeTruthy();

    const actions = (auditRes.data.data || []).map((a: any) => a.action);
    expect(actions).toContain('CREATE');
    expect(actions).toContain('CLOSE');

    // Finding action audit should also exist
    const findingAuditRes = await apiRequest(
      page,
      `/api/governance/audit?entity=ReviewFinding&recordId=${findingId}&limit=50`,
    );
    expect(findingAuditRes.status).toBe(200);
    const findingActions = (findingAuditRes.data.data || []).map((a: any) => a.action);
    expect(findingActions).toContain('CREATE');
  });
});
