import { test, expect } from '@playwright/test';
import { loginAsEmployee, TEST_EMPLOYEES } from '../fixtures';

/**
 * Sanity Check E2E Tests for POS
 *
 * These tests verify that the basic POS flows work correctly.
 * Run these first to catch fundamental issues before running
 * the more comprehensive business scenario tests.
 *
 * Note: Navigation between pages uses clicks on nav links instead of
 * page.goto() because auth state is not persisted across page reloads.
 *
 * Similar to ecommerce-web/e2e journey tests pattern.
 * @see 044D_KIOSK_E2E_TESTING.md for pattern reference
 */
test.describe('POS Sanity Checks', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session storage to start fresh
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
    const { username, storeNumber } = TEST_EMPLOYEES.ASSOCIATE;

    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(username);
    await page.getByPlaceholder('1-2000').fill(storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard - verify by welcome message
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');
  });

  test('logged in user can navigate to transaction page', async ({ page }) => {
    const { username, storeNumber } = TEST_EMPLOYEES.ASSOCIATE;
    await loginAsEmployee(page, username, storeNumber);

    // Navigate via nav link (not page.goto which loses auth state)
    await page.getByRole('link', { name: 'New Transaction' }).click();

    // Verify transaction page elements
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add Items' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cart' })).toBeVisible();
  });

  test('can scan product and add to cart', async ({ page }) => {
    const { username, storeNumber } = TEST_EMPLOYEES.ASSOCIATE;
    await loginAsEmployee(page, username, storeNumber);
    await page.getByRole('link', { name: 'New Transaction' }).click();
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();

    // Scan a product using quick add buttons (known SKUs)
    await page.getByRole('button', { name: /SKU-001/i }).click();

    // Verify cart shows items badge
    await expect(page.getByText(/\d+ items?/i)).toBeVisible();
  });

  test('cart shows empty state initially', async ({ page }) => {
    const { username, storeNumber } = TEST_EMPLOYEES.ASSOCIATE;
    await loginAsEmployee(page, username, storeNumber);
    await page.getByRole('link', { name: 'New Transaction' }).click();

    // Verify empty cart message
    await expect(page.getByText('Scan or search for items to add them to the cart')).toBeVisible();
  });

  test('checkout button is disabled for empty cart', async ({ page }) => {
    const { username, storeNumber } = TEST_EMPLOYEES.ASSOCIATE;
    await loginAsEmployee(page, username, storeNumber);
    await page.getByRole('link', { name: 'New Transaction' }).click();

    // Wait for transaction page to load
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();

    // Checkout should be disabled with empty cart (button text is "Checkout F9")
    await expect(page.getByRole('button', { name: /checkout/i })).toBeDisabled();
  });

  test('suspend button is disabled for empty cart', async ({ page }) => {
    const { username, storeNumber } = TEST_EMPLOYEES.ASSOCIATE;
    await loginAsEmployee(page, username, storeNumber);
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
    const { username, storeNumber } = TEST_EMPLOYEES.ASSOCIATE;
    await loginAsEmployee(page, username, storeNumber);
    await page.getByRole('link', { name: 'New Transaction' }).click();

    // Wait for transaction page to load
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();

    // Click search button (specifically "Search F3", not the command palette)
    await page.getByRole('button', { name: 'Search F3' }).click();

    // Search dialog should open (look for dialog/modal elements)
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  /**
   * CRITICAL: Full Transaction Journey
   *
   * This test navigates through the entire transaction flow like a real user:
   * Login → Add Items → Checkout → Fulfillment → Payment → Complete
   *
   * We don't assert on every detail - we just want to make sure the
   * entire happy path works end-to-end without breaking.
   */
  test('complete transaction journey - login to receipt', async ({ page }) => {
    const { username, storeNumber } = TEST_EMPLOYEES.ASSOCIATE;

    // 1. LOGIN
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(username);
    await page.getByPlaceholder('1-2000').fill(storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for dashboard
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

    // 2. NAVIGATE TO TRANSACTION
    await page.getByRole('link', { name: 'New Transaction' }).click();
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();

    // 3. ADD ITEMS TO CART
    // Add first item
    await page.getByRole('button', { name: /SKU-001/i }).click();
    await expect(page.getByText(/1 item/i)).toBeVisible();

    // Add second item
    await page.getByRole('button', { name: /SKU-002/i }).click();
    await expect(page.getByText(/2 items/i)).toBeVisible();

    // 4. PROCEED TO CHECKOUT
    // Checkout button should now be enabled
    const checkoutBtn = page.getByRole('button', { name: /checkout/i });
    await expect(checkoutBtn).toBeEnabled();
    await checkoutBtn.click();

    // Should be on checkout page
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fulfillment Method' })).toBeVisible();

    // 5. SELECT FULFILLMENT
    // Click on "Take Now" fulfillment option
    await page.getByLabel(/take now/i).click();

    // 6. PROCEED TO PAYMENT
    await page.getByRole('button', { name: /proceed to payment/i }).click();

    // Should be on payment page (use exact match to avoid matching "Select Payment Method")
    await expect(page.getByRole('heading', { name: 'Payment', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Select Payment Method' })).toBeVisible();

    // 7. SELECT PAYMENT METHOD (Card - use exact to avoid matching "Gift Card")
    await page.getByRole('button', { name: 'Card', exact: true }).click();

    // 8. PROCESS PAYMENT
    // Click simulate card payment button
    await page.getByRole('button', { name: /simulate card payment/i }).click();

    // Wait for payment processing (button shows "Processing...")
    await expect(page.getByText(/payment complete/i)).toBeVisible({ timeout: 10000 });

    // 9. COMPLETE TRANSACTION
    await page.getByRole('button', { name: /complete transaction/i }).click();

    // 10. VERIFY COMPLETION
    await expect(page.getByRole('heading', { name: /transaction complete/i })).toBeVisible();

    // Should have option to start new transaction
    await expect(page.getByRole('button', { name: /new transaction/i })).toBeVisible();
  });
});
