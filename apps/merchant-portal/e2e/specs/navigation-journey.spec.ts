import { test, expect } from '@playwright/test';

test.describe('Navigation Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session storage to start fresh
    await page.addInitScript(() => {
      sessionStorage.clear();
    });
  });

  test('merchant1 sees Products in sidebar but not Pricing/Inventory', async ({ page }) => {
    await page.goto('/login');

    // Login as merchant1
    await page.getByRole('button').filter({ hasText: 'merchant1' }).click();
    await expect(page).toHaveURL('/');

    // Verify Dashboard link is visible
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

    // Verify Products link is visible
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();

    // Verify Pricing and Inventory are NOT visible
    await expect(page.getByRole('link', { name: 'Pricing' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Inventory' })).not.toBeVisible();
  });

  test('pricer1 sees Pricing but not Products (write access)', async ({ page }) => {
    await page.goto('/login');

    // Login as pricer1
    await page.getByRole('button').filter({ hasText: 'pricer1' }).click();
    await expect(page).toHaveURL('/');

    // Verify Dashboard link is visible
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

    // Verify Pricing link is visible
    await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible();

    // Verify Products and Inventory are NOT visible
    await expect(page.getByRole('link', { name: 'Products' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Inventory' })).not.toBeVisible();
  });

  test('admin1 sees all navigation items', async ({ page }) => {
    await page.goto('/login');

    // Login as admin1
    await page.getByRole('button').filter({ hasText: 'admin1' }).click();
    await expect(page).toHaveURL('/');

    // Verify all navigation links are visible
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Inventory' })).toBeVisible();
  });

  test('clicking sidebar links navigates correctly', async ({ page }) => {
    await page.goto('/login');

    // Login as admin1 (has access to all pages)
    await page.getByRole('button').filter({ hasText: 'admin1' }).click();
    await expect(page).toHaveURL('/');

    // Click on Products
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL('/products');
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();

    // Click on Pricing
    await page.getByRole('link', { name: 'Pricing' }).click();
    await expect(page).toHaveURL('/pricing');
    await expect(page.getByRole('heading', { name: 'Pricing' })).toBeVisible();

    // Click on Inventory
    await page.getByRole('link', { name: 'Inventory' }).click();
    await expect(page).toHaveURL('/inventory');
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();

    // Click on Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('active navigation item is highlighted', async ({ page }) => {
    await page.goto('/login');

    // Login as admin1
    await page.getByRole('button').filter({ hasText: 'admin1' }).click();
    await expect(page).toHaveURL('/');

    // Dashboard should be highlighted (active)
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    await expect(dashboardLink).toHaveClass(/bg-primary/);

    // Navigate to Products
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL('/products');

    // Products should be highlighted now
    const productsLink = page.getByRole('link', { name: 'Products' });
    await expect(productsLink).toHaveClass(/bg-primary/);
  });
});
