import { test, expect, Page } from '@playwright/test';

/**
 * Helper to scan a product by simulating barcode scanner input
 * This mimics how a hardware barcode scanner works - rapid keyboard input followed by Enter
 */
async function scanProduct(page: Page, sku: string) {
  // Type the SKU (barcode scanner sends characters very quickly)
  await page.keyboard.type(sku, { delay: 50 });
  // Press Enter to submit (barcode scanners typically send Enter at the end)
  await page.keyboard.press('Enter');
}

test.describe.skip('Scan Journey', () => {
  test('can scan product and add to cart', async ({ page }) => {
    await page.goto('/');

    // Start transaction
    await page.getByRole('button', { name: /touch to start/i }).click();

    // Should show scan screen with "Scan Your Items" text
    await expect(page.getByText(/scan your items/i)).toBeVisible();

    // Scan product via keyboard (simulating barcode scanner)
    // Using 8-digit SKU format to meet minLength requirement
    await scanProduct(page, '10000001');

    // Should see product added feedback or cart update
    await expect(
      page.getByText(/item added/i)
    ).toBeVisible({ timeout: 10000 });

    // Check cart has item
    await expect(page.getByTestId('cart-item-count')).toHaveText('1', { timeout: 5000 });
  });

  test('shows error for unknown product', async ({ page }) => {
    await page.goto('/');

    // Start transaction
    await page.getByRole('button', { name: /touch to start/i }).click();

    // Wait for scan page
    await expect(page.getByText(/scan your items/i)).toBeVisible();

    // Try to scan unknown SKU (8+ characters to pass scanner validation)
    await scanProduct(page, '99999999');

    // Should show error message
    await expect(
      page.getByText(/not found|error|unable/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('can scan via barcode scanner input', async ({ page }) => {
    await page.goto('/');

    // Start transaction
    await page.getByRole('button', { name: /touch to start/i }).click();

    // Wait for scan page
    await expect(page.getByText(/scan your items/i)).toBeVisible();

    // Scan product (8-digit SKU)
    await scanProduct(page, '10000002');

    // Should see product added feedback
    await expect(
      page.getByText(/item added/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('can add multiple products', async ({ page }) => {
    await page.goto('/');

    // Start transaction
    await page.getByRole('button', { name: /touch to start/i }).click();

    // Wait for scan page
    await expect(page.getByText(/scan your items/i)).toBeVisible();

    // Scan multiple products (8-digit SKUs)
    const skus = ['10000001', '10000002', '10000003'];

    for (const sku of skus) {
      await scanProduct(page, sku);
      // Wait for item added feedback before scanning next
      await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 10000 });
      // Small delay between scans
      await page.waitForTimeout(500);
    }

    // Should have 3 items in cart
    await expect(page.getByTestId('cart-item-count')).toHaveText('3', { timeout: 10000 });
  });
});
