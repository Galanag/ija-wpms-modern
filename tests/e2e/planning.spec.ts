import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Planning years', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('planning years page lists seeded years including closed historical years', async ({ page }) => {
    await page.getByRole('link', { name: 'Planning Years' }).click();
    // The year table in the main content must show the historical 2018 year (closed)
    await expect(page.locator('main').locator('text=2018').first()).toBeVisible({ timeout: 20_000 });
  });

  test('year status values render (active year exists)', async ({ page }) => {
    await page.getByRole('link', { name: 'Planning Years' }).click();
    await expect(page.locator('main').locator('text=/active/i').first()).toBeVisible({ timeout: 15_000 });
  });
});
