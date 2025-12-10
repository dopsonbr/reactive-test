import { test, expect } from '@playwright/test';
import { loginAsEmployee, startTransaction, addItem, processPayment, TEST_PRODUCTS } from '../../fixtures';

/**
 * Scenario 1.1: Quick Sale (Scan and Go)
 *
 * Tests the most common retail transaction: customer walks in,
 * associate scans items, customer pays with card, and leaves with items.
 *
 * @see 045G_POS_E2E_TESTING.md - Scenario 1.1
 */
test.describe('Quick Sale Transaction', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page, 'EMP001', '1234');
  });

  test('QS-001: Single item purchase adds item with correct price', async ({ page }) => {
    // Given: Cart is empty
    await startTransaction(page);

    // When: Scan SKU
    await page.getByPlaceholder(/scan|enter sku/i).fill(TEST_PRODUCTS.WIDGET_PRO.sku);
    await page.keyboard.press('Enter');

    // Then: Item appears with correct price
    await expect(page.getByTestId('cart-item-0')).toContainText(TEST_PRODUCTS.WIDGET_PRO.name);
    await expect(page.getByTestId('cart-item-0')).toContainText('$149.99');
    await expect(page.getByTestId('cart-total')).toContainText('$149.99');
  });

  test('QS-002: Multiple items updates cart correctly', async ({ page }) => {
    // Given: Cart has 1 item
    await startTransaction(page);
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku);

    // When: Scan 2 more items
    await addItem(page, TEST_PRODUCTS.WIDGET_STANDARD.sku);
    await addItem(page, TEST_PRODUCTS.ACCESSORY.sku);

    // Then: Cart shows 3 items
    const itemCount = await page.getByTestId('cart-item-count').textContent();
    expect(itemCount).toContain('3');

    // Verify subtotal (149.99 + 79.99 + 29.99 = 259.97)
    await expect(page.getByTestId('cart-subtotal')).toContainText('$259.97');
  });

  test('QS-003: Quantity adjustment updates line total', async ({ page }) => {
    // Given: Item in cart
    await startTransaction(page);
    await addItem(page, TEST_PRODUCTS.WIDGET_STANDARD.sku);

    // When: Change qty to 5
    await page.getByTestId('qty-input-0').fill('5');
    await page.getByTestId('qty-input-0').blur();

    // Then: Line total = unit price × 5 (79.99 × 5 = 399.95)
    await expect(page.getByTestId('line-total-0')).toContainText('$399.95');
  });

  test('QS-004: Card payment success completes transaction', async ({ page }) => {
    // Given: Cart has items
    await startTransaction(page);
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku);
    await page.getByRole('button', { name: /checkout/i }).click();

    // When: Process valid card
    await page.getByRole('button', { name: /card/i }).click();
    await processPayment(page, 'valid-card');

    // Then: Payment approved, receipt shown
    await expect(page.getByText(/payment approved|success/i)).toBeVisible();
    await expect(page.getByTestId('receipt')).toBeVisible();
  });

  test('QS-005: Card payment decline shows error with retry', async ({ page }) => {
    // Given: Cart has items
    await startTransaction(page);
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku);
    await page.getByRole('button', { name: /checkout/i }).click();

    // When: Process declined card
    await page.getByRole('button', { name: /card/i }).click();
    await processPayment(page, 'declined-card');

    // Then: Error message, retry option
    await expect(page.getByText(/declined|failed/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /try again|retry/i })).toBeVisible();
  });

  test('QS-006: Cash payment calculates change correctly', async ({ page }) => {
    // Given: Cart with items
    await startTransaction(page);
    await addItem(page, TEST_PRODUCTS.ACCESSORY.sku);
    await addItem(page, TEST_PRODUCTS.ACCESSORY.sku); // Total ~$65 with tax

    await page.getByRole('button', { name: /checkout/i }).click();

    // When: Tender $100 cash
    await page.getByRole('button', { name: /cash/i }).click();
    await page.getByPlaceholder(/amount tendered/i).fill('100');
    await page.getByRole('button', { name: /complete|process/i }).click();

    // Then: Change due shown
    await expect(page.getByTestId('change-due')).toBeVisible();
    // Change should be approximately $35 (100 - 65)
    const changeDue = await page.getByTestId('change-due').textContent();
    expect(changeDue).toMatch(/\$3\d\.\d{2}/); // Should be around $35
  });

  test('QS-007: Empty cart prevents checkout', async ({ page }) => {
    // Given: Cart is empty
    await startTransaction(page);

    // When: Check checkout button
    const checkoutButton = page.getByRole('button', { name: /checkout/i });

    // Then: Checkout disabled
    await expect(checkoutButton).toBeDisabled();
  });
});

test.describe('Quick Sale Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page, 'EMP001', '1234');
    await startTransaction(page);
  });

  test('QS-E01: Scan unknown item shows error', async ({ page }) => {
    // When: Scan unknown SKU
    await page.getByPlaceholder(/scan|enter sku/i).fill('UNKNOWN-SKU-999');
    await page.keyboard.press('Enter');

    // Then: Show error message
    await expect(page.getByText(/not found|invalid/i)).toBeVisible();
  });

  test('QS-E03: High quantity shows confirmation', async ({ page }) => {
    // Given: Item in cart
    await addItem(page, TEST_PRODUCTS.ACCESSORY.sku);

    // When: Enter high quantity
    await page.getByTestId('qty-input-0').fill('100');
    await page.getByTestId('qty-input-0').blur();

    // Then: Confirmation dialog or warning appears
    // Note: This behavior depends on implementation
    const confirmOrWarning = await Promise.race([
      page.waitForSelector('[role="dialog"]', { timeout: 2000 }).then(() => 'dialog'),
      page.waitForSelector('[data-testid="quantity-warning"]', { timeout: 2000 }).then(() => 'warning'),
    ]).catch(() => 'none');

    // Either confirmation dialog or inline warning should appear
    expect(['dialog', 'warning']).toContain(confirmOrWarning);
  });

  test('QS-004a: Adding same item twice updates quantity', async ({ page }) => {
    // Given: Item in cart
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku);

    // When: Scan same item again
    await page.getByPlaceholder(/scan|enter sku/i).fill(TEST_PRODUCTS.WIDGET_PRO.sku);
    await page.keyboard.press('Enter');

    // Then: Quantity is 2, not two separate line items
    await expect(page.getByTestId('qty-input-0')).toHaveValue('2');
    await expect(page.locator('[data-testid^="cart-item-"]')).toHaveCount(1);
  });
});
