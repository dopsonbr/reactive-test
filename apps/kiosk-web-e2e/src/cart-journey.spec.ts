import { test, expect, Page } from '@playwright/test';

/**
 * Helper to scan a product by simulating barcode scanner input
 */
async function scanProduct(page: Page, sku: string) {
  await page.keyboard.type(sku, { delay: 50 });
  await page.keyboard.press('Enter');
}

/**
 * Start transaction and add a product
 * Uses 8-digit SKU format to meet scanner minLength requirement
 */
async function startAndAddProduct(page: Page, sku = '10000001') {
  await page.goto('/');
  await page.getByRole('button', { name: /touch to start/i }).click();
  await expect(page.getByText(/scan your items/i)).toBeVisible();

  await scanProduct(page, sku);
  await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('cart-item-count')).toHaveText('1', { timeout: 5000 });
}

test.describe('Cart Journey', () => {
  test.beforeEach(async ({ page }) => {
    await startAndAddProduct(page);
  });

  test('displays cart items correctly', async ({ page }) => {
    // Navigate to cart view
    await page.getByRole('button', { name: /review cart/i }).click();

    // Should show cart page
    await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible({ timeout: 5000 });

    // Should show cart item (product name comes from API)
    await expect(page.locator('[class*="border-b"]').first()).toBeVisible();
  });

  test('can navigate back to scanning', async ({ page }) => {
    // Navigate to cart view
    await page.getByRole('button', { name: /review cart/i }).click();
    await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible({ timeout: 5000 });

    // Click continue scanning
    await page.getByRole('button', { name: /continue scanning/i }).click();

    // Should be back on scan page
    await expect(page.getByText(/scan your items/i)).toBeVisible({ timeout: 5000 });
  });

  test('can remove item from cart', async ({ page }) => {
    // Navigate to cart view
    await page.getByRole('button', { name: /review cart/i }).click();
    await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible({ timeout: 5000 });

    // Click remove button (trash icon)
    await page.getByRole('button', { name: /remove/i }).first().click();

    // Confirm removal
    await expect(page.getByText(/remove.*from cart/i)).toBeVisible();
    await page.getByRole('button', { name: /remove/i, exact: false }).last().click();

    // Should show empty cart
    await expect(page.getByText(/cart is empty|no items/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows cart summary with totals', async ({ page }) => {
    // Navigate to cart view
    await page.getByRole('button', { name: /review cart/i }).click();
    await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible({ timeout: 5000 });

    // Should show subtotal, tax, and total
    await expect(page.getByText(/subtotal/i)).toBeVisible();
    await expect(page.getByText(/tax/i)).toBeVisible();
    await expect(page.getByText(/total/i)).toBeVisible();
  });

  test('can proceed to loyalty page', async ({ page }) => {
    // Navigate to cart view
    await page.getByRole('button', { name: /review cart/i }).click();
    await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible({ timeout: 5000 });

    // Click continue to loyalty
    await page.getByRole('button', { name: /continue to loyalty/i }).click();

    // Should be on loyalty page
    await expect(page.getByText(/loyalty|rewards|customer/i)).toBeVisible({ timeout: 5000 });
  });
});
