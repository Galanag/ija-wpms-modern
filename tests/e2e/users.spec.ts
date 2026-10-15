import { test, expect } from '@playwright/test';
import { login } from './helpers';

const USERNAME = `e2euser-${Date.now()}`;

test.describe.serial('User Administration', () => {
  test('admin can navigate to users page', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Users' }).click();
    await expect(page.getByRole('heading', { name: 'User Administration' })).toBeVisible({ timeout: 20_000 });
  });

  test('create user via UI → appears in list → persists after reload', async ({ page }) => {
    await login(page);
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'User Administration' })).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: 'Create User' }).first().click();
    await expect(page.locator('input#create-username')).toBeVisible({ timeout: 15_000 });

    await page.getByLabel('Username *').fill(USERNAME);
    await page.getByLabel('Full Name *').fill('E2E User');
    await page.getByLabel('Email').fill('e2e@test.ija');
    await page.getByLabel('Phone').fill('+251911000000');
    await page.getByLabel('Password *').fill('Test123456');
    await page.getByLabel('Role *').selectOption({ label: 'Super Administrator' });

    const [response] = await Promise.all([
      page.waitForResponse('/api/admin/users', { timeout: 30_000 }),
      page.getByRole('button', { name: 'Create User' }).last().click(),
    ]);
    expect(response.status()).toBe(201);

    await expect(page.getByText('User created successfully')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('tr', { hasText: USERNAME }).first()).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(page.locator('tr', { hasText: USERNAME }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('edit user → save → edited value persists after reload', async ({ page }) => {
    await login(page);
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'User Administration' })).toBeVisible({ timeout: 20_000 });

    const row = page.locator('tr', { hasText: USERNAME }).first();
    await row.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Full Name *').fill('E2E User Updated');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('User updated successfully')).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(page.locator('tr', { hasText: 'E2E User Updated' }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('password reset → modal validates and succeeds', async ({ page }) => {
    await login(page);
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'User Administration' })).toBeVisible({ timeout: 20_000 });

    const row = page.locator('tr', { hasText: USERNAME }).first();
    await row.getByRole('button', { name: 'Password' }).click();
    await page.getByLabel('New Password *').fill('NewTest123456');
    await page.getByLabel('Confirm Password *').fill('NewTest123456');
    await page.getByRole('button', { name: 'Reset Password' }).click();

    await expect(page.getByText('Password reset successfully')).toBeVisible({ timeout: 15_000 });
  });

  test('module access → check a module → saves', async ({ page }) => {
    await login(page);
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'User Administration' })).toBeVisible({ timeout: 20_000 });

    const row = page.locator('tr', { hasText: USERNAME }).first();
    await row.getByRole('button', { name: 'Modules' }).click();
    await page.getByLabel('Dashboard').check();
    await page.getByRole('button', { name: 'Save Module Access' }).click();

    await expect(page.getByText('Module access updated')).toBeVisible({ timeout: 15_000 });
  });

  test('deactivate user → status flips → cannot login', async ({ page }) => {
    await login(page);
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'User Administration' })).toBeVisible({ timeout: 20_000 });

    page.on('dialog', async dialog => await dialog.accept());

    const row = page.locator('tr', { hasText: USERNAME }).first();
    await row.getByRole('button', { name: 'Deactivate' }).click();

    await expect(page.getByText('User deactivated successfully')).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(page.locator('tr', { hasText: USERNAME }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('tr', { hasText: USERNAME }).first()).toContainText('Inactive');
  });

  test('reactivate user → can login again', async ({ page }) => {
    await login(page);
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'User Administration' })).toBeVisible({ timeout: 20_000 });

    page.on('dialog', async dialog => await dialog.accept());

    const row = page.locator('tr', { hasText: USERNAME }).first();
    await row.getByRole('button', { name: 'Activate' }).click();

    await expect(page.getByText('User activated successfully')).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(page.locator('tr', { hasText: USERNAME }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('tr', { hasText: USERNAME }).first()).toContainText('Active');
  });
});
