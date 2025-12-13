import { test, expect, TEST_PRODUCTS, scanProduct, startSession } from '../fixtures';

/**
 * Full-Stack Kiosk Checkout Journey
 *
 * Tests the complete self-checkout flow against real backend services.
 *
 * Prerequisites:
 * - All backend services must be running (use ./powerstart)
 * - Kiosk frontend must be running (pnpm nx serve kiosk-web)
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

    // 2. ADD ITEMS via manual SKU entry
    await scanProduct(page, TEST_PRODUCTS.HEADPHONES.sku);
    // Wait for first item to be added (check cart count or item feedback)
    await page.waitForTimeout(1000); // Allow cart update

    await scanProduct(page, TEST_PRODUCTS.SMART_TV.sku);
    // Wait for second item
    await page.waitForTimeout(1000);

    // 3. REVIEW CART
    await page.getByRole('button', { name: /review cart/i }).click();
    await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible();

    // Verify items are in cart (2 items total)
    await expect(page.getByText(/2 items in cart/i)).toBeVisible();

    // 4. PROCEED TO CHECKOUT (via Loyalty step)
    await page.getByRole('button', { name: /continue to loyalty/i }).click();

    // 5. HANDLE LOYALTY (skip)
    const skipLoyalty = page.getByRole('button', { name: /skip|no.*loyalty/i });
    if (await skipLoyalty.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipLoyalty.click();
    }

    // 6. PAYMENT
    await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible({ timeout: 10000 });

    // Wait for checkout to load (button becomes enabled)
    const payButton = page.getByRole('button', { name: /pay|complete|tap to pay/i });
    await expect(payButton).toBeEnabled({ timeout: 15000 });
    await payButton.click();

    // 7. COMPLETE
    await expect(page.getByText(/complete|thank you|receipt|order confirmed/i)).toBeVisible({ timeout: 15000 });
  });

  test('can modify cart quantities before checkout', async ({ page }) => {
    // Start session and add item
    await startSession(page);
    await scanProduct(page, TEST_PRODUCTS.HEADPHONES.sku);
    await page.waitForTimeout(1000); // Allow cart update

    // Go to cart
    await page.getByRole('button', { name: /review cart/i }).click();
    await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible();

    // Wait for cart to load with quantity showing "1"
    await expect(page.getByRole('status', { name: /quantity: 1/i })).toBeVisible({ timeout: 10000 });

    // Click increase quantity button
    const increaseBtn = page.getByRole('button', { name: /increase quantity/i }).first();
    await expect(increaseBtn).toBeVisible();
    await increaseBtn.click();

    // Verify quantity updated to "2" - wait for backend cart update
    await expect(page.getByRole('status', { name: /quantity: 2/i })).toBeVisible({ timeout: 10000 });
  });
});
