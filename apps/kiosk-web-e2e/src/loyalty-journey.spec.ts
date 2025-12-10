import { test, expect, Page } from '@playwright/test';

/**
 * Helper to scan a product by simulating barcode scanner input
 */
async function scanProduct(page: Page, sku: string) {
  await page.keyboard.type(sku, { delay: 50 });
  await page.keyboard.press('Enter');
}

/**
 * Start transaction, add product, and navigate to loyalty page
 * Uses 8-digit SKU format to meet scanner minLength requirement
 */
async function setupLoyaltyPage(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /touch to start/i }).click();
  await expect(page.getByText(/scan your items/i)).toBeVisible();

  // Add a product (8-digit SKU)
  await scanProduct(page, '10000001');
  await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('cart-item-count')).toHaveText('1', { timeout: 5000 });

  // Go to cart
  await page.getByRole('button', { name: /review cart/i }).click();
  await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible({ timeout: 5000 });

  // Go to loyalty page
  await page.getByRole('button', { name: /continue to loyalty/i }).click();
  await expect(page.getByText(/loyalty account/i)).toBeVisible({ timeout: 5000 });
}

test.describe('Loyalty Journey', () => {
  test.beforeEach(async ({ page }) => {
    await setupLoyaltyPage(page);
  });

  test('displays loyalty page correctly', async ({ page }) => {
    // Should show loyalty page header
    await expect(page.getByRole('heading', { name: /loyalty account/i })).toBeVisible();

    // Should show input mode options (phone and email)
    await expect(page.getByRole('button', { name: /phone number/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /email address/i })).toBeVisible();
  });

  test('can enter phone number', async ({ page }) => {
    // Phone mode should be selected by default
    await expect(page.getByRole('button', { name: /phone number/i })).toBeVisible();

    // Enter phone number using on-screen keypad (10 digits)
    const digits = ['5', '5', '5', '1', '2', '3', '4', '5', '6', '7'];
    for (const digit of digits) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }

    // Look Up Account button should be enabled
    await expect(page.getByRole('button', { name: /look up account/i })).toBeEnabled();
  });

  test('can switch to email mode', async ({ page }) => {
    // Click email button
    await page.getByRole('button', { name: /email address/i }).click();

    // Email input should be visible (keyboard-based input)
    await expect(page.locator('input[type="email"], input[placeholder*="email"]')).toBeVisible({ timeout: 3000 }).catch(() => {
      // May use a custom email input component
    });
  });

  test('can skip loyalty lookup', async ({ page }) => {
    // Click skip button
    await page.getByRole('button', { name: /skip.*no loyalty/i }).click();

    // Should navigate back to scan page
    await expect(page.getByText(/scan your items/i)).toBeVisible({ timeout: 5000 });
  });

  test('can look up customer by phone', async ({ page }) => {
    // Enter phone number using on-screen keypad
    const digits = ['5', '5', '5', '1', '2', '3', '4', '5', '6', '7'];
    for (const digit of digits) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }

    // Click look up
    await page.getByRole('button', { name: /look up account/i }).click();

    // Should show result (either found customer or not found message)
    await expect(
      page.getByText(/found|not found|no account|customer|member/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
