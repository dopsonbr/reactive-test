import { test, expect, Page } from '@playwright/test';

/**
 * Helper to scan a product by simulating barcode scanner input
 */
async function scanProduct(page: Page, sku: string) {
  await page.keyboard.type(sku, { delay: 50 });
  await page.keyboard.press('Enter');
}

test.describe('Session Management', () => {
  test('can start new transaction from idle', async ({ page }) => {
    await page.goto('/');

    // Should show idle/welcome screen
    await expect(page.getByText(/welcome|touch to start/i)).toBeVisible();

    // Click to start
    await page.getByRole('button', { name: /touch to start/i }).click();

    // Should navigate to scan screen
    await expect(page.getByText(/scan your items/i)).toBeVisible();
  });

  test('can add products to cart', async ({ page }) => {
    await page.goto('/');

    // Start transaction
    await page.getByRole('button', { name: /touch to start/i }).click();
    await expect(page.getByText(/scan your items/i)).toBeVisible();

    // Add a product (8-digit SKU)
    await scanProduct(page, '10000001');
    await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });

    // Cart should show 1 item
    await expect(page.getByTestId('cart-item-count')).toHaveText('1', { timeout: 5000 });
  });

  test('maintains cart state when navigating', async ({ page }) => {
    await page.goto('/');

    // Start transaction
    await page.getByRole('button', { name: /touch to start/i }).click();
    await expect(page.getByText(/scan your items/i)).toBeVisible();

    // Add products (8-digit SKUs)
    await scanProduct(page, '10000001');
    await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('cart-item-count')).toHaveText('1', { timeout: 5000 });

    await scanProduct(page, '10000002');
    await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('cart-item-count')).toHaveText('2', { timeout: 5000 });

    // Navigate to cart
    await page.getByRole('button', { name: /review cart/i }).click();
    await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible({ timeout: 5000 });

    // Navigate back to scan
    await page.getByRole('button', { name: /continue scanning/i }).click();

    // Cart count should still be 2
    await expect(page.getByTestId('cart-item-count')).toHaveText('2', { timeout: 5000 });

    // Can add another item (8-digit SKU)
    await scanProduct(page, '10000003');
    await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('cart-item-count')).toHaveText('3', { timeout: 10000 });
  });

  test('can navigate through full flow', async ({ page }) => {
    await page.goto('/');

    // Start transaction
    await page.getByRole('button', { name: /touch to start/i }).click();
    await expect(page.getByText(/scan your items/i)).toBeVisible();

    // Add a product (8-digit SKU)
    await scanProduct(page, '10000001');
    await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });

    // Go to cart
    await page.getByRole('button', { name: /review cart/i }).click();
    await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible({ timeout: 5000 });

    // Go to loyalty
    await page.getByRole('button', { name: /continue to loyalty/i }).click();
    await expect(page.getByText(/loyalty account/i)).toBeVisible({ timeout: 5000 });

    // Skip loyalty
    await page.getByRole('button', { name: /skip.*no loyalty/i }).click();

    // Should be back on scan page
    await expect(page.getByText(/scan your items/i)).toBeVisible({ timeout: 5000 });
  });
});
