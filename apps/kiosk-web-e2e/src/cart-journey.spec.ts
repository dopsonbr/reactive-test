import { test, expect } from '@playwright/test';

test.describe('Cart Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Start transaction
    await page.getByRole('button', { name: /start transaction/i }).click();

    // Add a product to cart
    const scanInput = page.getByTestId('scan-input');
    await scanInput.fill('SKU-001');
    await scanInput.press('Enter');

    // Wait for cart to update
    await expect(page.getByTestId('cart-item-count')).toHaveText('1', { timeout: 5000 });
  });

  test('displays cart items correctly', async ({ page }) => {
    // Navigate to cart view
    await page.getByRole('button', { name: /view cart|cart/i }).click();

    // Should show cart item
    await expect(page.getByText(/bananas/i)).toBeVisible();
    await expect(page.getByText(/\$2\.99/)).toBeVisible();
  });

  test('can increase quantity', async ({ page }) => {
    // Navigate to cart view
    await page.getByRole('button', { name: /view cart|cart/i }).click();

    // Find increase button for the item
    const increaseButton = page.getByTestId('increase-quantity').first();
    await increaseButton.click();

    // Should show quantity as 2
    await expect(page.getByTestId('item-quantity')).toHaveText('2', { timeout: 5000 });
  });

  test('can decrease quantity', async ({ page }) => {
    // Navigate to cart view
    await page.getByRole('button', { name: /view cart|cart/i }).click();

    // First increase to 2
    const increaseButton = page.getByTestId('increase-quantity').first();
    await increaseButton.click();
    await expect(page.getByTestId('item-quantity')).toHaveText('2', { timeout: 5000 });

    // Then decrease back to 1
    const decreaseButton = page.getByTestId('decrease-quantity').first();
    await decreaseButton.click();
    await expect(page.getByTestId('item-quantity')).toHaveText('1', { timeout: 5000 });
  });

  test('can remove item from cart', async ({ page }) => {
    // Navigate to cart view
    await page.getByRole('button', { name: /view cart|cart/i }).click();

    // Remove the item
    const removeButton = page.getByTestId('remove-item').first();
    await removeButton.click();

    // Cart should be empty
    await expect(page.getByText(/cart is empty|no items/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('cart-item-count')).toHaveText('0');
  });

  test('shows correct totals', async ({ page }) => {
    // Add another item
    const scanInput = page.getByTestId('scan-input');
    await scanInput.fill('SKU-002');
    await scanInput.press('Enter');

    await expect(page.getByTestId('cart-item-count')).toHaveText('2', { timeout: 5000 });

    // Navigate to cart view
    await page.getByRole('button', { name: /view cart|cart/i }).click();

    // Should show correct subtotal (2.99 + 4.49 = 7.48)
    await expect(page.getByTestId('cart-subtotal')).toContainText('7.48');

    // Should show tax
    await expect(page.getByTestId('cart-tax')).toBeVisible();

    // Should show total
    await expect(page.getByTestId('cart-total')).toBeVisible();
  });
});
