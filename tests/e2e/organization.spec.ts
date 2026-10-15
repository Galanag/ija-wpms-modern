import { test, expect } from '@playwright/test';
import { login } from './helpers';

const EMP_NAME = `E2E Employee ${Date.now()}`;

test.describe.serial('Employee full CRUD through the UI', () => {
  test('create → appears in list → persists after reload', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Organizations' }).click();
    await expect(page.getByRole('heading', { name: 'Organization Management' })).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: '+ New Employee' }).click();
    await page.getByLabel('Full Name *').fill(EMP_NAME);
    await page.getByLabel('Employee No.').fill(`E2E-${Date.now()}`);
    await page.getByLabel('Job Title').fill('E2E Tester');
    await page.getByLabel('Email').fill(`e2e${Date.now()}@test.ija`);
    await page.getByRole('button', { name: 'Save Employee' }).click();

    // row appears without reload (UI refresh)
    await expect(page.locator('tr', { hasText: EMP_NAME }).first()).toBeVisible({ timeout: 15_000 });

    // persists after full reload
    await page.reload();
    await expect(page.locator('tr', { hasText: EMP_NAME }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('edit → save → edited value persists after reload', async ({ page }) => {
    await login(page);
    await page.goto('/organization?tab=employees');
    await expect(page.getByRole('heading', { name: 'Organization Management' })).toBeVisible({ timeout: 20_000 });

    const row = page.locator('tr', { hasText: EMP_NAME }).first();
    await row.getByRole('button', { name: 'Edit' }).click();
    const jobTitle = page.getByLabel('Job Title');
    await jobTitle.fill('E2E Senior Tester');
    await page.getByRole('button', { name: 'Save Employee' }).click();

    await page.reload();
    await expect(page.locator('tr', { hasText: EMP_NAME }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('tr', { hasText: 'E2E Senior Tester' }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('view details opens with employee data', async ({ page }) => {
    await login(page);
    await page.goto('/organization?tab=employees');
    await expect(page.getByRole('heading', { name: 'Organization Management' })).toBeVisible({ timeout: 20_000 });
    const row = page.locator('tr', { hasText: EMP_NAME }).first();
    await row.click();
    // The view modal shows a Close button; its sibling Edit opens the edit form.
    const modal = page.locator('div.fixed.inset-0').last();
    await expect(modal.getByText(EMP_NAME).first()).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Edit' })).toBeVisible();
  });

  test('deactivate → status flips and persists', async ({ page }) => {
    await login(page);
    await page.goto('/organization?tab=employees');
    await expect(page.getByRole('heading', { name: 'Organization Management' })).toBeVisible({ timeout: 20_000 });
    const row = page.locator('tr', { hasText: EMP_NAME }).first();
    await row.getByRole('button', { name: 'Deactivate' }).click();
    await expect(row.locator('text=Inactive')).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(page.locator('tr', { hasText: EMP_NAME }).first().locator('text=Inactive')).toBeVisible({ timeout: 15_000 });
  });
});
