import { test, expect } from '@playwright/test';

test.describe('Checkout Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Start transaction
    await page.getByRole('button', { name: /start transaction/i }).click();

    // Add products to cart
    const scanInput = page.getByTestId('scan-input');
    await scanInput.fill('SKU-001');
    await scanInput.press('Enter');
    await expect(page.getByTestId('cart-item-count')).toHaveText('1', { timeout: 5000 });

    await scanInput.fill('SKU-002');
    await scanInput.press('Enter');
    await expect(page.getByTestId('cart-item-count')).toHaveText('2', { timeout: 5000 });
  });

  test('displays checkout summary correctly', async ({ page }) => {
    // Navigate to checkout
    await page.getByRole('button', { name: /checkout|pay/i }).click();

    // Should show summary
    await expect(page.getByText(/checkout summary|order summary/i)).toBeVisible();

    // Should show items
    await expect(page.getByText(/bananas/i)).toBeVisible();
    await expect(page.getByText(/milk/i)).toBeVisible();

    // Should show totals
    await expect(page.getByTestId('checkout-subtotal')).toBeVisible();
    await expect(page.getByTestId('checkout-tax')).toBeVisible();
    await expect(page.getByTestId('checkout-total')).toBeVisible();
  });

  test('can complete payment with cash', async ({ page }) => {
    // Navigate to checkout
    await page.getByRole('button', { name: /checkout|pay/i }).click();

    // Select cash payment
    await page.getByRole('button', { name: /cash/i }).click();

    // Confirm payment
    await page.getByRole('button', { name: /confirm|complete/i }).click();

    // Should show confirmation screen
    await expect(page.getByText(/thank you|order complete/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/ORD-/i)).toBeVisible();
  });

  test('can complete payment with card', async ({ page }) => {
    // Navigate to checkout
    await page.getByRole('button', { name: /checkout|pay/i }).click();

    // Select card payment
    await page.getByRole('button', { name: /credit|debit|card/i }).click();

    // Confirm payment
    await page.getByRole('button', { name: /confirm|complete/i }).click();

    // Should show confirmation screen
    await expect(page.getByText(/thank you|order complete/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/ORD-/i)).toBeVisible();
  });

  test('shows confirmation with order number', async ({ page }) => {
    // Navigate to checkout
    await page.getByRole('button', { name: /checkout|pay/i }).click();

    // Complete payment
    await page.getByRole('button', { name: /cash/i }).click();
    await page.getByRole('button', { name: /confirm|complete/i }).click();

    // Wait for confirmation
    await expect(page.getByText(/thank you|order complete/i)).toBeVisible({ timeout: 10000 });

    // Should show order number
    const orderNumberElement = page.getByTestId('order-number');
    await expect(orderNumberElement).toBeVisible();

    const orderNumber = await orderNumberElement.textContent();
    expect(orderNumber).toMatch(/ORD-\d{5}/);
  });

  test('applies loyalty discount when customer is identified', async ({ page }) => {
    // Add loyalty customer
    await page.getByRole('button', { name: /loyalty|customer/i }).click();

    const phoneInput = page.getByTestId('loyalty-phone-input');
    await phoneInput.fill('555-0100');
    await page.getByRole('button', { name: /look up|search/i }).click();

    await expect(page.getByText(/john smith/i)).toBeVisible({ timeout: 5000 });

    // Continue to checkout
    await page.getByRole('button', { name: /continue|next/i }).click();

    // Navigate to checkout if not already there
    const checkoutButton = page.getByRole('button', { name: /checkout|pay/i });
    if (await checkoutButton.isVisible()) {
      await checkoutButton.click();
    }

    // Should show loyalty discount
    await expect(page.getByText(/gold.*discount|loyalty.*discount/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('checkout-discount')).toBeVisible();
  });
});
