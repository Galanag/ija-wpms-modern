import { test, expect } from '@playwright/test';
import { apiRequest, login } from './helpers';

test.describe.serial('Templates', () => {
  test('templates page loads with tabs', async ({ page }) => {
    await login(page);
    await page.goto('/templates');
    await expect(page.getByRole('heading', { name: /Templates & Master Data/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Templates/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Import/i })).toBeVisible();
  });

  test('template types endpoint returns all types', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/templates/types');
    expect(res.status).toBe(200);
    expect(res.data.templateTypes).toBeTruthy();
    expect(res.data.templateTypes.length).toBeGreaterThan(0);
  });

  test('list KPI templates via API', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/templates/kpi_template');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('list activity templates via API', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/templates/activity_template');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('list project templates via API', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/templates/project_template');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('create template via API', async ({ page }) => {
    await login(page);
    const createRes = await apiRequest(page, '/api/templates/kpi_template', {
      method: 'POST',
      body: JSON.stringify({
        code: `E2E-${Date.now()}`,
        name: `E2E Template ${Date.now()}`,
      }),
    });
    expect([200, 201]).toContain(createRes.status);
    expect(createRes.data).toBeTruthy();
  });

  test('get template by id', async ({ page }) => {
    await login(page);
    const listRes = await apiRequest(page, '/api/templates/kpi_template');
    const templates = Array.isArray(listRes.data) ? listRes.data : [];
    if (templates.length === 0) {
      test.skip(true, 'No templates');
      return;
    }
    const template = templates[0];
    const res = await apiRequest(page, `/api/templates/kpi_template/${template.id}`);
    expect(res.status).toBe(200);
  });

  test('update template via API', async ({ page }) => {
    await login(page);
    const listRes = await apiRequest(page, '/api/templates/kpi_template');
    const templates = Array.isArray(listRes.data) ? listRes.data : [];
    if (templates.length === 0) {
      test.skip(true, 'No templates');
      return;
    }
    const template = templates[0];
    const updateRes = await apiRequest(page, `/api/templates/kpi_template/${template.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: template.name + ' Updated' }),
    });
    expect([200, 201]).toContain(updateRes.status);
  });

  test('soft delete template via API', async ({ page }) => {
    await login(page);
    const createRes = await apiRequest(page, '/api/templates/kpi_template', {
      method: 'POST',
      body: JSON.stringify({
        name: `E2E Template ToDelete ${Date.now()}`,
        description: 'To be deleted',
        content: { code: 'DEL', name: 'Delete Me' },
      }),
    });
    if (createRes.data?.id) {
      const deleteRes = await apiRequest(page, `/api/templates/kpi_template/${createRes.data.id}`, {
        method: 'DELETE',
      });
      expect(deleteRes.status).toBe(200);
    }
  });

  test('instantiate template via API', async ({ page }) => {
    await login(page);
    const listRes = await apiRequest(page, '/api/templates/kpi_template');
    const templates = Array.isArray(listRes.data) ? listRes.data : [];
    if (templates.length === 0) {
      test.skip(true, 'No templates to instantiate');
      return;
    }
    const template = templates[0];
    const defsRes = await apiRequest(page, '/api/kpi/definitions');
    const defs = Array.isArray(defsRes.data) ? defsRes.data : [];
    const kpiId = defs.length > 0 && defs[0].id ? defs[0].id : 1;
    const instantiateRes = await apiRequest(page, `/api/templates/kpi_template/${template.id}/instantiate`, {
      method: 'POST',
      body: JSON.stringify({ yearId: 1, kpiId }),
    });
    expect([200, 201]).toContain(instantiateRes.status);
  });
});
