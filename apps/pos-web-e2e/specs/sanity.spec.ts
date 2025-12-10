import { test, expect } from '@playwright/test';
import { loginAsEmployee, TEST_EMPLOYEES } from '../fixtures';

/**
 * Sanity Check E2E Tests for POS
 *
 * These tests verify that the basic POS flows work correctly.
 * Run these first to catch fundamental issues before running
 * the more comprehensive business scenario tests.
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
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByPlaceholder('Employee ID')).toBeVisible();
    await expect(page.getByPlaceholder('PIN')).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });

  test('employee can login successfully', async ({ page }) => {
    const { id, pin } = TEST_EMPLOYEES.ASSOCIATE;

    await page.goto('/');
    await page.getByPlaceholder('Employee ID').fill(id);
    await page.getByPlaceholder('PIN').fill(pin);
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should redirect to dashboard or transaction page
    await expect(page).toHaveURL(/\/(dashboard|transaction)/);
  });

  test('logged in user can navigate to transaction page', async ({ page }) => {
    const { id, pin } = TEST_EMPLOYEES.ASSOCIATE;
    await loginAsEmployee(page, id, pin);

    // Navigate to transaction page
    await page.goto('/transaction');

    // Verify transaction page elements
    await expect(page.getByPlaceholder(/scan|enter sku/i)).toBeVisible();
  });

  test('can scan product and add to cart', async ({ page }) => {
    const { id, pin } = TEST_EMPLOYEES.ASSOCIATE;
    await loginAsEmployee(page, id, pin);

    await page.goto('/transaction');

    // Scan a product
    await page.getByPlaceholder(/scan|enter sku/i).fill('SKU-WIDGET-001');
    await page.keyboard.press('Enter');

    // Verify product appears in cart
    await expect(page.getByTestId('cart-item-0')).toBeVisible();
    await expect(page.getByTestId('cart-item-0')).toContainText('Widget Pro XL');
    await expect(page.getByTestId('cart-item-0')).toContainText('$149.99');
  });

  test('cart total updates when item is added', async ({ page }) => {
    const { id, pin } = TEST_EMPLOYEES.ASSOCIATE;
    await loginAsEmployee(page, id, pin);

    await page.goto('/transaction');

    // Scan a product
    await page.getByPlaceholder(/scan|enter sku/i).fill('SKU-WIDGET-001');
    await page.keyboard.press('Enter');

    // Wait for cart to update
    await expect(page.getByTestId('cart-item-0')).toBeVisible();

    // Verify cart total shows the item price
    await expect(page.getByTestId('cart-total')).toContainText('$149.99');
  });

  test('scanning unknown SKU shows error', async ({ page }) => {
    const { id, pin } = TEST_EMPLOYEES.ASSOCIATE;
    await loginAsEmployee(page, id, pin);

    await page.goto('/transaction');

    // Scan unknown product
    await page.getByPlaceholder(/scan|enter sku/i).fill('UNKNOWN-SKU-999');
    await page.keyboard.press('Enter');

    // Verify error message appears
    await expect(page.getByText(/not found|invalid|error/i)).toBeVisible();
  });

  test('can update item quantity', async ({ page }) => {
    const { id, pin } = TEST_EMPLOYEES.ASSOCIATE;
    await loginAsEmployee(page, id, pin);

    await page.goto('/transaction');

    // Add item
    await page.getByPlaceholder(/scan|enter sku/i).fill('SKU-WIDGET-001');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('cart-item-0')).toBeVisible();

    // Update quantity
    const qtyInput = page.getByTestId('qty-input-0');
    await qtyInput.fill('2');
    await qtyInput.blur();

    // Verify line total updates (149.99 * 2 = 299.98)
    await expect(page.getByTestId('line-total-0')).toContainText('$299.98');
  });

  test('checkout button is disabled for empty cart', async ({ page }) => {
    const { id, pin } = TEST_EMPLOYEES.ASSOCIATE;
    await loginAsEmployee(page, id, pin);

    await page.goto('/transaction');

    // Checkout should be disabled with empty cart
    await expect(page.getByRole('button', { name: /checkout/i })).toBeDisabled();
  });

  test('can proceed to checkout with items', async ({ page }) => {
    const { id, pin } = TEST_EMPLOYEES.ASSOCIATE;
    await loginAsEmployee(page, id, pin);

    await page.goto('/transaction');

    // Add item
    await page.getByPlaceholder(/scan|enter sku/i).fill('SKU-WIDGET-001');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('cart-item-0')).toBeVisible();

    // Click checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Verify we're in checkout/payment mode
    await expect(page.getByTestId('payment-panel')).toBeVisible();
  });

  test('invalid login shows error', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Employee ID').fill('INVALID');
    await page.getByPlaceholder('PIN').fill('0000');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible();
  });
});
