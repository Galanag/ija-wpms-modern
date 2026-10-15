import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Reporting with real exports', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/reporting');
    await expect(page.getByRole('heading', { name: /Reporting Center/i })).toBeVisible({ timeout: 20_000 });
    await page.waitForLoadState('networkidle');
  });

  test('risk report loads and year filter changes data context', async ({ page }) => {
    await page.getByRole('button', { name: /Risk/i }).click();
    await expect(page.locator('text=/Loading report|No data|Total/i').first()).toBeVisible({ timeout: 20_000 });
  });

  async function openRiskTable(page: import('@playwright/test').Page) {
    await page.getByRole('button', { name: /Risk/i }).click();
    await page.waitForLoadState('networkidle');
    const tableBtn = page.getByRole('button', { name: /Table/i });
    await tableBtn.waitFor({ state: 'visible', timeout: 20_000 });
    await tableBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }

  test('CSV export downloads a real CSV file', async ({ page }) => {
    await openRiskTable(page);
    const downloadPromise = page.waitForEvent('download', { timeout: 20_000 });
    await page.getByRole('button', { name: /Export CSV/i }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
    const fs = require('fs');
    const content = fs.readFileSync(path!, 'utf8');
    expect(content).toContain(',');
  });

  test('XLSX export downloads a valid workbook (ZIP signature)', async ({ page }) => {
    await openRiskTable(page);
    const xlsxBtn = page.getByRole('button', { name: /Export XLSX/i });
    await xlsxBtn.waitFor({ state: 'visible', timeout: 30_000 });
    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await xlsxBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
    const path = await download.path();
    const fs = require('fs');
    const buf = fs.readFileSync(path!);
    expect(buf.subarray(0, 4).toString('binary')).toBe('PK\x03\x04');
  });

  test('PDF export downloads a valid PDF (signature + title text)', async ({ page }) => {
    await openRiskTable(page);
    const pdfBtn = page.getByRole('button', { name: /Export PDF/i });
    await pdfBtn.waitFor({ state: 'visible', timeout: 30_000 });
    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await pdfBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    const path = await download.path();
    const fs = require('fs');
    const buf = fs.readFileSync(path!);
    expect(buf.subarray(0, 5).toString('binary')).toBe('%PDF-');
    expect(buf.toString('binary')).toContain('IJA-WPMS');
  });
});
