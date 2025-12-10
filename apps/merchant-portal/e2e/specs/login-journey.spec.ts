import { test, expect } from '@playwright/test';

test.describe('Login Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session storage to start fresh
    await page.addInitScript(() => {
      sessionStorage.clear();
    });
  });

  test('can see login page with test user options', async ({ page }) => {
    await page.goto('/login');

    // Wait for page to load and verify login page header
    await expect(page.getByRole('heading', { name: 'Merchant Portal' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Sign in to continue')).toBeVisible();

    // Verify all test user options are visible
    await expect(page.getByText('merchant1')).toBeVisible();
    await expect(page.getByText('Product management')).toBeVisible();

    await expect(page.getByText('pricer1')).toBeVisible();
    await expect(page.getByText('Price management')).toBeVisible();

    await expect(page.getByText('inventory1')).toBeVisible();
    await expect(page.getByText('Inventory management')).toBeVisible();

    await expect(page.getByText('admin1')).toBeVisible();
    await expect(page.getByText('Full access')).toBeVisible();
  });

  test('can login as merchant1 user', async ({ page }) => {
    await page.goto('/login');

    // Wait for login page to load
    await expect(page.getByRole('heading', { name: 'Merchant Portal' })).toBeVisible();

    // Click on merchant1 user
    await page.getByRole('button').filter({ hasText: 'merchant1' }).click();

    // Should navigate to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Verify sidebar shows username
    await expect(page.getByText('merchant1')).toBeVisible();
  });

  test('can login as admin1 user', async ({ page }) => {
    await page.goto('/login');

    // Wait for login page to load
    await expect(page.getByRole('heading', { name: 'Merchant Portal' })).toBeVisible();

    // Click on admin1 user
    await page.getByRole('button').filter({ hasText: 'admin1' }).click();

    // Should navigate to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Verify sidebar shows username
    await expect(page.getByText('admin1')).toBeVisible();
  });

  test('logout returns to login page', async ({ page }) => {
    await page.goto('/login');

    // Login as merchant1
    await expect(page.getByRole('heading', { name: 'Merchant Portal' })).toBeVisible();
    await page.getByRole('button').filter({ hasText: 'merchant1' }).click();

    // Wait for dashboard
    await expect(page).toHaveURL('/');

    // Click logout button
    await page.getByRole('button', { name: /logout/i }).click();

    // Should return to login page
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Merchant Portal' })).toBeVisible();
    await expect(page.getByText('Sign in to continue')).toBeVisible();
  });
});
