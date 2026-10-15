import { test, expect } from '@playwright/test';
import { apiRequest, login } from './helpers';

test.describe.serial('Currency Management', () => {
  test('settings page loads with currencies tab', async ({ page }) => {
    await login(page);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /Settings/i }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Currencies/i }).first()).toBeVisible();
  });

  test('currency list API returns currencies', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/currency');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });

  test('active currencies endpoint', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/currency/active');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('default currency endpoint', async ({ page }) => {
    await login(page);
    const res = await apiRequest(page, '/api/currency/default');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('create currency via API', async ({ page }) => {
    await login(page);
    const code = `E2E`;
    const listRes = await apiRequest(page, '/api/currency');
    const list = Array.isArray(listRes.data) ? listRes.data : [];
    const exists = list.some((c: any) => c.code === code);
    if (exists) {
      const existing = list.find((c: any) => c.code === code);
      const updateRes = await apiRequest(page, `/api/currency/${existing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: `E2E Currency ${Date.now()}` }),
      });
      expect([200, 201]).toContain(updateRes.status);
      return;
    }
    const createRes = await apiRequest(page, '/api/currency', {
      method: 'POST',
      body: JSON.stringify({
        code,
        name: `E2E Currency ${Date.now()}`,
        symbol: 'E2',
        decimalPlaces: 2,
        locale: 'en-US',
        isActive: true,
      }),
    });
    expect([200, 201]).toContain(createRes.status);
    expect(createRes.data).toBeTruthy();
  });

  test('get currency by id', async ({ page }) => {
    await login(page);
    const listRes = await apiRequest(page, '/api/currency');
    const list = Array.isArray(listRes.data) ? listRes.data : [];
    if (list.length === 0) {
      test.skip(true, 'No currencies');
      return;
    }
    const currency = list[0];
    const res = await apiRequest(page, `/api/currency/${currency.id}`);
    expect(res.status).toBe(200);
  });

  test('update currency via API', async ({ page }) => {
    await login(page);
    const listRes = await apiRequest(page, '/api/currency');
    const list = Array.isArray(listRes.data) ? listRes.data : [];
    if (list.length === 0) {
      test.skip(true, 'No currencies');
      return;
    }
    const currency = list[0];
    const baseName = currency.name.length > 80 ? currency.name.slice(0, 80) : currency.name;
    const updateRes = await apiRequest(page, `/api/currency/${currency.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: baseName + ' Updated' }),
    });
    expect([200, 201]).toContain(updateRes.status);
  });

  test('set default currency via API', async ({ page }) => {
    await login(page);
    const listRes = await apiRequest(page, '/api/currency');
    const list = Array.isArray(listRes.data) ? listRes.data : [];
    let activeNonDefault = list.find((c: any) => !c.isDefault && c.isActive);
    if (!activeNonDefault) {
      const ts = Date.now();
      const code = `S${ts % 100000}`.toUpperCase().slice(0, 3);
      const createRes = await apiRequest(page, '/api/currency', {
        method: 'POST',
        body: JSON.stringify({
          code,
          name: `E2E Default Test ${ts}`,
          symbol: '$',
          decimalPlaces: 2,
          locale: 'en-US',
          isActive: true,
        }),
      });
      if ([200, 201].includes(createRes.status) && createRes.data?.id) {
        activeNonDefault = createRes.data;
      }
    }
    if (!activeNonDefault) {
      test.skip(true, 'No active non-default currency available');
      return;
    }
    const res = await apiRequest(page, `/api/currency/${activeNonDefault.id}/default`, {
      method: 'PUT',
    });
    expect([200, 201]).toContain(res.status);
  });

  test('archive currency via API', async ({ page }) => {
    await login(page);
    const listRes = await apiRequest(page, '/api/currency');
    const list = Array.isArray(listRes.data) ? listRes.data : [];
    let nonSystem = list.filter((c: any) => !c.isDefault && c.isActive);
    if (nonSystem.length === 0) {
      const ts = Date.now();
      const code = `A${ts % 100000}`.toUpperCase().slice(0, 3);
      const createRes = await apiRequest(page, '/api/currency', {
        method: 'POST',
        body: JSON.stringify({
          code,
          name: `E2E Archive Test ${ts}`,
          symbol: 'A',
          decimalPlaces: 2,
          locale: 'en-US',
          isActive: true,
        }),
      });
      if ([200, 201].includes(createRes.status) && createRes.data?.id) {
        nonSystem = [createRes.data];
      }
    }
    if (nonSystem.length === 0) {
      test.skip(true, 'No archivable currencies');
      return;
    }
    const currency = nonSystem[0];
    const res = await apiRequest(page, `/api/currency/${currency.id}`, {
      method: 'DELETE',
    });
    expect([200, 201]).toContain(res.status);
  });
});
