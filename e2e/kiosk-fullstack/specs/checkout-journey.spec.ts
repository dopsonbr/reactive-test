import { test, expect, TEST_PRODUCTS, scanProduct, startSession } from '../fixtures';

/**
 * Full-Stack Kiosk Checkout Journey
 *
 * Tests the complete self-checkout flow against real backend services.
 *
 * Prerequisites:
 * - All backend services must be running (use ./powerstart)
 * - Kiosk frontend must be started WITHOUT MSW
 */

test.describe('Kiosk Checkout Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('complete self-checkout with multiple items', async ({ page }) => {
    // 1. START SESSION
    await startSession(page);

    // 2. SCAN ITEMS
    await scanProduct(page, TEST_PRODUCTS.PRODUCT_001.sku);
    await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });

    await scanProduct(page, TEST_PRODUCTS.PRODUCT_002.sku);
    await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });

    // 3. REVIEW CART
    await page.getByRole('button', { name: /review cart/i }).click();
    await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible();

    // Verify items are in cart
    await expect(page.getByText(TEST_PRODUCTS.PRODUCT_001.name)).toBeVisible();
    await expect(page.getByText(TEST_PRODUCTS.PRODUCT_002.name)).toBeVisible();

    // 4. PROCEED TO CHECKOUT
    await page.getByRole('button', { name: /continue|checkout/i }).click();

    // 5. HANDLE LOYALTY (skip)
    const skipLoyalty = page.getByRole('button', { name: /skip|no.*loyalty/i });
    if (await skipLoyalty.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipLoyalty.click();
    }

    // 6. PAYMENT
    await expect(page.getByText(/payment|pay/i)).toBeVisible({ timeout: 10000 });

    // Select payment method
    const cardButton = page.getByRole('button', { name: /card|credit|debit/i });
    if (await cardButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cardButton.click();
    }

    // 7. COMPLETE
    await expect(page.getByText(/complete|thank you|receipt/i)).toBeVisible({ timeout: 15000 });
  });

  test('can modify cart quantities before checkout', async ({ page }) => {
    // Start session and add item
    await startSession(page);
    await scanProduct(page, TEST_PRODUCTS.PRODUCT_001.sku);
    await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });

    // Go to cart
    await page.getByRole('button', { name: /review cart/i }).click();
    await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible();

    // Modify quantity if controls are available
    const increaseBtn = page.getByRole('button', { name: /\+|increase/i }).first();
    if (await increaseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await increaseBtn.click();
      // Verify quantity updated
      await expect(page.getByText(/qty.*2|quantity.*2/i)).toBeVisible();
    }
  });
});
