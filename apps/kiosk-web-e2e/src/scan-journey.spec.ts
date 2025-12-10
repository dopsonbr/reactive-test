import { test, expect } from '@playwright/test';

test.describe('Scan Journey', () => {
  test('can scan product and add to cart', async ({ page }) => {
    await page.goto('/');

    // Start transaction
    await page.getByRole('button', { name: /start transaction/i }).click();

    // Should show scan screen
    await expect(page.getByText(/scan or enter product/i)).toBeVisible();

    // Simulate scanning by typing SKU and pressing Enter
    const scanInput = page.getByTestId('scan-input');
    await scanInput.fill('SKU-001');
    await scanInput.press('Enter');

    // Should see product added confirmation or cart update
    await expect(page.getByText(/bananas/i)).toBeVisible({ timeout: 5000 });

    // Check cart has item
    await expect(page.getByTestId('cart-item-count')).toHaveText('1');
  });

  test('shows error for unknown product', async ({ page }) => {
    await page.goto('/');

    // Start transaction
    await page.getByRole('button', { name: /start transaction/i }).click();

    // Try to scan unknown SKU
    const scanInput = page.getByTestId('scan-input');
    await scanInput.fill('SKU-INVALID');
    await scanInput.press('Enter');

    // Should show error message
    await expect(page.getByText(/product not found/i)).toBeVisible({ timeout: 5000 });
  });

  test('can enter SKU manually', async ({ page }) => {
    await page.goto('/');

    // Start transaction
    await page.getByRole('button', { name: /start transaction/i }).click();

    // Type SKU character by character
    const scanInput = page.getByTestId('scan-input');
    await scanInput.fill('SKU-002');
    await scanInput.press('Enter');

    // Should see milk product
    await expect(page.getByText(/milk/i)).toBeVisible({ timeout: 5000 });
  });

  test('can scan multiple products rapidly', async ({ page }) => {
    await page.goto('/');

    // Start transaction
    await page.getByRole('button', { name: /start transaction/i }).click();

    const scanInput = page.getByTestId('scan-input');

    // Scan multiple products
    const skus = ['SKU-001', 'SKU-002', 'SKU-003'];

    for (const sku of skus) {
      await scanInput.fill(sku);
      await scanInput.press('Enter');
      // Small delay between scans
      await page.waitForTimeout(300);
    }

    // Should have 3 items in cart
    await expect(page.getByTestId('cart-item-count')).toHaveText('3', { timeout: 5000 });
  });
});
