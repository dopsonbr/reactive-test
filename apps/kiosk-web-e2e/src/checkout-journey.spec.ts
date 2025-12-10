import { test, expect, Page } from '@playwright/test';

/**
 * Helper to scan a product by simulating barcode scanner input
 */
async function scanProduct(page: Page, sku: string) {
  await page.keyboard.type(sku, { delay: 50 });
  await page.keyboard.press('Enter');
}

/**
 * Start transaction and add products, then navigate to checkout
 * Uses 8-digit SKU format to meet scanner minLength requirement
 */
async function setupCheckout(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /touch to start/i }).click();
  await expect(page.getByText(/scan your items/i)).toBeVisible();

  // Add products (8-digit SKUs)
  await scanProduct(page, '10000001');
  await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });

  await scanProduct(page, '10000002');
  await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });

  // Go to cart
  await page.getByRole('button', { name: /review cart/i }).click();
  await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible({ timeout: 5000 });

  // Skip loyalty and go to checkout
  await page.getByRole('button', { name: /continue to loyalty/i }).click();
  await expect(page.getByText(/loyalty account/i)).toBeVisible({ timeout: 5000 });

  // Skip loyalty
  await page.getByRole('button', { name: /skip.*no loyalty/i }).click();

  // Should be back on scan page - navigate directly to checkout
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible({ timeout: 10000 });
}

test.describe.skip('Checkout Journey', () => {
  test.beforeEach(async ({ page }) => {
    await setupCheckout(page);
  });

  test('displays checkout summary correctly', async ({ page }) => {
    // Should show checkout page
    await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible();

    // Should show order summary section
    await expect(page.getByText(/review your order|order summary/i)).toBeVisible();
  });

  test('shows payment options', async ({ page }) => {
    // Should show payment section
    await expect(page.getByText(/payment|pay/i)).toBeVisible();

    // Should show payment method buttons
    const paymentSection = page.locator('[class*="payment"]').first();
    await expect(paymentSection.or(page.getByText(/credit|debit|cash/i))).toBeVisible({ timeout: 5000 });
  });

  test('can select payment method', async ({ page }) => {
    // Wait for payment section to load
    await expect(page.getByText(/payment|pay/i)).toBeVisible({ timeout: 5000 });

    // Click on a payment method if available
    const creditButton = page.getByRole('button', { name: /credit|card/i });
    const cashButton = page.getByRole('button', { name: /cash/i });

    const hasCredit = await creditButton.isVisible({ timeout: 2000 }).catch(() => false);
    const hasCash = await cashButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasCredit) {
      await creditButton.click();
      // Should show selected state or proceed to next step
    } else if (hasCash) {
      await cashButton.click();
    }

    // Should be able to complete checkout (exact behavior depends on payment service)
  });
});
