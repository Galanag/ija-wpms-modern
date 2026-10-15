import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Dashboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dashboard loads with year selector and KPI cards', async ({ page }) => {
    await expect(page.getByText(/Executive overview/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel(/Planning Year/i)).toBeVisible();
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('Active Employees')).toBeVisible();
  });

  test('Employees card navigates to /organization', async ({ page }) => {
    const card = page.locator('a', { hasText: 'Active Employees' }).first();
    await card.click();
    await page.waitForURL(/organization/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Organization Management' })).toBeVisible({ timeout: 15_000 });
  });

  test('Risks card navigates to risk-compliance', async ({ page }) => {
    const card = page.locator('a', { hasText: 'High/Critical Risks' }).first();
    await card.click();
    await page.waitForURL(/risk-compliance/, { timeout: 15_000 });
    await expect(page.getByText('Risk & Compliance')).toBeVisible();
  });

  test('changing the planning year changes dashboard context', async ({ page }) => {
    await expect(page.getByText(/Executive overview/i)).toBeVisible({ timeout: 20_000 });
    const yearSelect = page.getByLabel(/Planning Year/i);
    await yearSelect.selectOption({ label: '2026 Planning Year' });
    await expect(page.getByText(/2026 Planning Year.*fiscal year|2026.*fiscal year/).first()).toBeVisible({ timeout: 15_000 });
  });
});
