import { test, expect } from '@playwright/test';
import { login } from './helpers';

const RISK_TITLE = `E2E Risk ${Date.now()}`;

test.describe.serial('Risk & Compliance', () => {
  test('risk tab loads with the new dashboard contract', async ({ page }) => {
    await login(page);
    await page.goto('/risk-compliance');
    await expect(page.getByText('Risk & Compliance')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Total Risks')).toBeVisible();
    await expect(page.getByText('Risk Overview')).toBeVisible();
  });

  test('create risk via UI → appears → persists after reload', async ({ page }) => {
    await login(page);
    await page.goto('/risk-compliance');
    await page.getByRole('button', { name: 'Register New Risk' }).click();
    await page.getByLabel(/Title/i).first().fill(RISK_TITLE);
    await page.getByRole('button', { name: /Register Risk|Create Risk|Save/i }).click();
    await expect(page.locator('text=' + RISK_TITLE).first()).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(page.locator('text=' + RISK_TITLE).first()).toBeVisible({ timeout: 15_000 });
  });

  test('compliance tab renders the compliance contract', async ({ page }) => {
    await login(page);
    await page.goto('/risk-compliance?tab=compliance');
    const main = page.locator('main');
    await expect(main.getByRole('heading', { name: 'Compliance Overview' })).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText('Total Requirements')).toBeVisible();
  });

  test('copy requirements modal opens with real controls', async ({ page }) => {
    await login(page);
    await page.goto('/risk-compliance?tab=compliance');
    await expect(page.getByRole('heading', { name: 'Compliance Overview' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Copy Recurring/i }).click();
    await expect(page.getByRole('heading', { name: 'Copy Recurring Requirements' })).toBeVisible();
    await expect(page.getByText('Target Year', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
  });
});
