import { test, expect, TEST_EMPLOYEE, TEST_PRODUCTS } from '../fixtures';

/**
 * POS Sanity Check E2E Tests (Full-Stack)
 *
 * These tests run against REAL backend services (no MSW mocks).
 * They verify that basic POS flows work correctly before running
 * more comprehensive transaction journey tests.
 *
 * Prerequisites:
 * - All backend services must be running (use ./powerstart)
 * - Frontend must be started WITHOUT MSW
 *
 * Run with:
 *   pnpm nx e2e pos-fullstack-e2e
 */
test.describe('POS Sanity Checks', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('app loads and shows login form', async ({ page }) => {
    await page.goto('/');

    // Verify login form is displayed
    await expect(page.getByRole('heading', { name: 'POS Login' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter your username')).toBeVisible();
    await expect(page.getByPlaceholder('1-2000')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('employee can login successfully', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
    await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard - verify by welcome message
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');
  });

  test('logged in user can navigate to transaction page', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
    await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

    // Navigate via nav link (not page.goto which loses auth state)
    await page.getByRole('link', { name: 'New Transaction' }).click();

    // Verify transaction page elements
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add Items' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cart' })).toBeVisible();
  });

  test('can scan product and add to cart', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
    await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

    // Navigate to transaction
    await page.getByRole('link', { name: 'New Transaction' }).click();
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();

    // Scan a product using SKU input (real backend SKUs)
    const skuInput = page.getByPlaceholder('Scan or enter SKU...');
    await skuInput.fill(TEST_PRODUCTS.HEADPHONES.sku);
    await skuInput.press('Enter');

    // Verify cart shows items
    await expect(page.getByRole('heading', { name: /Cart 1 items?/i })).toBeVisible({ timeout: 10000 });
  });

  test('cart shows empty state initially', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
    await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

    await page.getByRole('link', { name: 'New Transaction' }).click();

    // Verify empty cart message
    await expect(page.getByText('Scan or search for items to add them to the cart')).toBeVisible();
  });

  test('checkout button is disabled for empty cart', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
    await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

    await page.getByRole('link', { name: 'New Transaction' }).click();

    // Wait for transaction page to load
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();

    // Checkout should be disabled with empty cart
    await expect(page.getByRole('button', { name: /checkout/i })).toBeDisabled();
  });

  test('suspend button is disabled for empty cart', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
    await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

    await page.getByRole('link', { name: 'New Transaction' }).click();

    // Wait for transaction page to load
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();

    // Suspend should be disabled with empty cart
    await expect(page.getByRole('button', { name: /suspend/i })).toBeDisabled();
  });

  test('invalid login shows error', async ({ page }) => {
    await page.goto('/');

    // Submit empty form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show validation error
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test('product search button opens search dialog', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
    await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

    await page.getByRole('link', { name: 'New Transaction' }).click();

    // Wait for transaction page to load
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();

    // Click search button
    await page.getByRole('button', { name: 'Search F3' }).click();

    // Search dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
