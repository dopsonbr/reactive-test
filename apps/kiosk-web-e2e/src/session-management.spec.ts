import { test, expect } from '@playwright/test';

test.describe('Session Management', () => {
  test('can start new transaction from idle', async ({ page }) => {
    await page.goto('/');

    // Should show idle/welcome screen
    await expect(page.getByText(/welcome|start transaction/i)).toBeVisible();

    // Click to start
    await page.getByRole('button', { name: /start transaction|begin/i }).click();

    // Should navigate to scan screen
    await expect(page.getByText(/scan or enter product/i)).toBeVisible();
    await expect(page.getByTestId('scan-input')).toBeVisible();
  });

  test('can cancel transaction and return to start', async ({ page }) => {
    await page.goto('/');

    // Start transaction
    await page.getByRole('button', { name: /start transaction/i }).click();

    // Add a product
    const scanInput = page.getByTestId('scan-input');
    await scanInput.fill('SKU-001');
    await scanInput.press('Enter');

    await expect(page.getByTestId('cart-item-count')).toHaveText('1', { timeout: 5000 });

    // Cancel transaction
    await page.getByRole('button', { name: /cancel|exit/i }).click();

    // Should show confirmation dialog
    await expect(page.getByText(/cancel transaction|are you sure/i)).toBeVisible();

    // Confirm cancellation
    await page.getByRole('button', { name: /yes|confirm/i }).click();

    // Should return to start screen
    await expect(page.getByText(/welcome|start transaction/i)).toBeVisible({ timeout: 5000 });
  });

  test('resets to start after completing transaction', async ({ page }) => {
    await page.goto('/');

    // Start transaction
    await page.getByRole('button', { name: /start transaction/i }).click();

    // Add a product
    const scanInput = page.getByTestId('scan-input');
    await scanInput.fill('SKU-001');
    await scanInput.press('Enter');

    await expect(page.getByTestId('cart-item-count')).toHaveText('1', { timeout: 5000 });

    // Complete checkout
    await page.getByRole('button', { name: /checkout|pay/i }).click();
    await page.getByRole('button', { name: /cash/i }).click();
    await page.getByRole('button', { name: /confirm|complete/i }).click();

    // Wait for confirmation screen
    await expect(page.getByText(/thank you|order complete/i)).toBeVisible({ timeout: 10000 });

    // Wait a moment for auto-return or click done
    const doneButton = page.getByRole('button', { name: /done|new transaction/i });
    if (await doneButton.isVisible()) {
      await doneButton.click();
    } else {
      // Wait for auto-return timeout
      await page.waitForTimeout(5000);
    }

    // Should return to start screen
    await expect(page.getByText(/welcome|start transaction/i)).toBeVisible({ timeout: 15000 });
  });

  test('maintains cart state during navigation', async ({ page }) => {
    await page.goto('/');

    // Start transaction
    await page.getByRole('button', { name: /start transaction/i }).click();

    // Add products
    const scanInput = page.getByTestId('scan-input');
    await scanInput.fill('SKU-001');
    await scanInput.press('Enter');
    await expect(page.getByTestId('cart-item-count')).toHaveText('1', { timeout: 5000 });

    await scanInput.fill('SKU-002');
    await scanInput.press('Enter');
    await expect(page.getByTestId('cart-item-count')).toHaveText('2', { timeout: 5000 });

    // Navigate to cart
    await page.getByRole('button', { name: /view cart|cart/i }).click();
    await expect(page.getByText(/bananas/i)).toBeVisible();

    // Navigate back to scan
    await page.getByRole('button', { name: /back|scan/i }).click();

    // Cart count should still be 2
    await expect(page.getByTestId('cart-item-count')).toHaveText('2');

    // Can add another item
    await scanInput.fill('SKU-003');
    await scanInput.press('Enter');
    await expect(page.getByTestId('cart-item-count')).toHaveText('3', { timeout: 5000 });
  });

  test('clears session data after transaction', async ({ page }) => {
    await page.goto('/');

    // Complete a full transaction
    await page.getByRole('button', { name: /start transaction/i }).click();

    const scanInput = page.getByTestId('scan-input');
    await scanInput.fill('SKU-001');
    await scanInput.press('Enter');
    await expect(page.getByTestId('cart-item-count')).toHaveText('1', { timeout: 5000 });

    await page.getByRole('button', { name: /checkout|pay/i }).click();
    await page.getByRole('button', { name: /cash/i }).click();
    await page.getByRole('button', { name: /confirm|complete/i }).click();

    await expect(page.getByText(/thank you|order complete/i)).toBeVisible({ timeout: 10000 });

    // Return to start
    const doneButton = page.getByRole('button', { name: /done|new transaction/i });
    if (await doneButton.isVisible()) {
      await doneButton.click();
    } else {
      await page.waitForTimeout(5000);
    }

    await expect(page.getByText(/welcome|start transaction/i)).toBeVisible({ timeout: 15000 });

    // Start new transaction - should have empty cart
    await page.getByRole('button', { name: /start transaction/i }).click();
    await expect(page.getByTestId('cart-item-count')).toHaveText('0');
  });
});
