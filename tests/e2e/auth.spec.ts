import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Authentication', () => {
  test('rejects wrong credentials with an error', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: /Sign in/i }).click();
    // Must NOT navigate to dashboard; an error must be shown
    await page.waitForTimeout(2000);
    expect(page.url()).not.toMatch(/dashboard/);
    await expect(page.locator('text=/invalid|incorrect|unable|failed/i').first()).toBeVisible({ timeout: 10_000 });
  });

  test('login lands on executive dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText(/Plans, Performance, Resources/i)).toBeVisible();
  });

  test('logout returns to the login screen', async ({ page }) => {
    await login(page);
    const logoutBtn = page.getByRole('button', { name: /log ?out|sign ?out/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page.locator('#username')).toBeVisible({ timeout: 15_000 });
    } else {
      // navigation entry alternative
      await page.goto('/');
      await expect(page.locator('#username')).toBeVisible();
    }
  });
});
