import { test, expect } from '@playwright/test';
import { apiRequest, login } from './helpers';

const PROJ_NAME = `E2E Project ${Date.now()}`;

test.describe.serial('Project Management', () => {
  test('projects page loads with list', async ({ page }) => {
    await login(page);
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible({ timeout: 20_000 });
  });

  test('create project via API and verify summary endpoint', async ({ page }) => {
    await login(page);
    const yearsRes = await apiRequest(page, '/api/planning/years');
    const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
    expect(years.length).toBeGreaterThan(0);
    const activeYear = years.find((y: any) => y.status === 'active') || years[years.length - 1];
    const yearId = activeYear.id;

    const createRes = await apiRequest(page, '/api/project/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: PROJ_NAME,
        description: 'E2E test project',
        yearId,
        status: 'planned',
      }),
    });
    expect([200, 201]).toContain(createRes.status);
    expect(createRes.data).toBeTruthy();

    const summaryRes = await apiRequest(page, `/api/project/projects/summary?yearId=${yearId}`);
    expect(summaryRes.status).toBe(200);
  });

  test('create milestone for project via API', async ({ page }) => {
    await login(page);
    const projectsRes = await apiRequest(page, '/api/project/projects?take=5');
    const projects = Array.isArray(projectsRes.data) ? projectsRes.data : [];
    let project = projects[0];
    if (!project) {
      const yearsRes = await apiRequest(page, '/api/planning/years');
      const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
      const yearId = years.length > 0 ? years[0].id : 1;
      const createRes = await apiRequest(page, '/api/project/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: PROJ_NAME,
          description: 'E2E test project for milestone',
          yearId,
          status: 'planned',
        }),
      });
      if ([200, 201].includes(createRes.status)) {
        project = createRes.data;
      }
    }
    if (!project) {
      test.skip(true, 'No projects available');
      return;
    }
    const msRes = await apiRequest(page, '/api/project/milestones', {
      method: 'POST',
      body: JSON.stringify({
        projectId: project.id,
        name: `E2E Milestone ${Date.now()}`,
        dueDate: '2026-12-31',
        status: 'pending',
      }),
    });
    expect([200, 201]).toContain(msRes.status);
  });

  test('update project via API', async ({ page }) => {
    await login(page);
    const projectsRes = await apiRequest(page, '/api/project/projects?take=5');
    const projects = Array.isArray(projectsRes.data) ? projectsRes.data : [];
    let project = projects[0];
    if (!project) {
      const yearsRes = await apiRequest(page, '/api/planning/years');
      const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
      const yearId = years.length > 0 ? years[0].id : 1;
      const createRes = await apiRequest(page, '/api/project/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: PROJ_NAME,
          description: 'E2E test project for update',
          yearId,
          status: 'planned',
        }),
      });
      if ([200, 201].includes(createRes.status)) {
        project = createRes.data;
      }
    }
    if (!project) {
      test.skip(true, 'No projects');
      return;
    }
    const updateRes = await apiRequest(page, `/api/project/projects/${project.id}`, {
      method: 'PUT',
      body: JSON.stringify({ description: 'Updated by E2E' }),
    });
    expect([200, 201]).toContain(updateRes.status);
  });

  test('list milestones for project', async ({ page }) => {
    await login(page);
    const projectsRes = await apiRequest(page, '/api/project/projects?take=5');
    const projects = Array.isArray(projectsRes.data) ? projectsRes.data : [];
    let project = projects[0];
    if (!project) {
      const yearsRes = await apiRequest(page, '/api/planning/years');
      const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
      const yearId = years.length > 0 ? years[0].id : 1;
      const createRes = await apiRequest(page, '/api/project/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: PROJ_NAME,
          description: 'E2E test project for milestones list',
          yearId,
          status: 'planned',
        }),
      });
      if ([200, 201].includes(createRes.status)) {
        project = createRes.data;
      }
    }
    if (!project) {
      test.skip(true, 'No projects');
      return;
    }
    const res = await apiRequest(page, `/api/project/milestones/${project.id}`);
    expect([200, 201]).toContain(res.status);
    expect(Array.isArray(res.data)).toBe(true);
  });
});
