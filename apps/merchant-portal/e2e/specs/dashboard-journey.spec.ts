import { test, expect } from '@playwright/test';

test.describe('Dashboard Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session storage to start fresh
    await page.addInitScript(() => {
      sessionStorage.clear();
    });
  });

  test('dashboard shows welcome message with username', async ({ page }) => {
    await page.goto('/login');

    // Login as merchant1
    await page.getByRole('button').filter({ hasText: 'merchant1' }).click();
    await expect(page).toHaveURL('/');

    // Verify welcome message with username
    await expect(page.getByText('Welcome back, merchant1')).toBeVisible();
  });

  test('dashboard shows placeholder metrics cards', async ({ page }) => {
    await page.goto('/login');

    // Login as admin1
    await page.getByRole('button').filter({ hasText: 'admin1' }).click();
    await expect(page).toHaveURL('/');

    // Verify all three metrics cards are visible
    await expect(page.getByRole('heading', { name: 'Products', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Low Stock', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'On Sale', level: 3 })).toBeVisible();

    // Verify placeholder values (--) are shown
    const placeholderValues = page.getByText('--');
    await expect(placeholderValues).toHaveCount(3);
  });

  test('dashboard is accessible after login', async ({ page }) => {
    await page.goto('/login');

    // Login as pricer1
    await page.getByRole('button').filter({ hasText: 'pricer1' }).click();

    // Should land on dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Welcome back, pricer1')).toBeVisible();
  });

  test('dashboard can be accessed from other pages', async ({ page }) => {
    await page.goto('/login');

    // Login as admin1
    await page.getByRole('button').filter({ hasText: 'admin1' }).click();
    await expect(page).toHaveURL('/');

    // Navigate to Products
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL('/products');

    // Click Dashboard link to return
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Welcome back, admin1')).toBeVisible();
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    // Try to access dashboard directly without logging in
    await page.goto('/');

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Merchant Portal' })).toBeVisible();
    await expect(page.getByText('Sign in to continue')).toBeVisible();
  });
});
