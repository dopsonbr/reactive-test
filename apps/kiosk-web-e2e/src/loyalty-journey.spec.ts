import { test, expect } from '@playwright/test';

test.describe('Loyalty Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Start transaction
    await page.getByRole('button', { name: /start transaction/i }).click();

    // Add a product to cart
    const scanInput = page.getByTestId('scan-input');
    await scanInput.fill('SKU-001');
    await scanInput.press('Enter');
    await expect(page.getByTestId('cart-item-count')).toHaveText('1', { timeout: 5000 });
  });

  test('can look up customer by phone', async ({ page }) => {
    // Navigate to loyalty screen
    await page.getByRole('button', { name: /loyalty|customer/i }).click();

    // Enter phone number
    const phoneInput = page.getByTestId('loyalty-phone-input');
    await phoneInput.fill('555-0100');

    // Submit lookup
    await page.getByRole('button', { name: /look up|search/i }).click();

    // Should show customer found
    await expect(page.getByText(/john smith/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/gold/i)).toBeVisible();
  });

  test('can look up customer by email', async ({ page }) => {
    // Navigate to loyalty screen
    await page.getByRole('button', { name: /loyalty|customer/i }).click();

    // Switch to email input
    await page.getByRole('button', { name: /email/i }).click();

    // Enter email
    const emailInput = page.getByTestId('loyalty-email-input');
    await emailInput.fill('jane.doe@example.com');

    // Submit lookup
    await page.getByRole('button', { name: /look up|search/i }).click();

    // Should show customer found
    await expect(page.getByText(/jane doe/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/platinum/i)).toBeVisible();
  });

  test('shows not found for unknown customer', async ({ page }) => {
    // Navigate to loyalty screen
    await page.getByRole('button', { name: /loyalty|customer/i }).click();

    // Enter unknown phone
    const phoneInput = page.getByTestId('loyalty-phone-input');
    await phoneInput.fill('555-9999');

    // Submit lookup
    await page.getByRole('button', { name: /look up|search/i }).click();

    // Should show not found message
    await expect(page.getByText(/not found|no customer/i)).toBeVisible({ timeout: 5000 });
  });

  test('can skip loyalty lookup', async ({ page }) => {
    // Navigate to loyalty screen
    await page.getByRole('button', { name: /loyalty|customer/i }).click();

    // Click skip button
    await page.getByRole('button', { name: /skip|continue without/i }).click();

    // Should proceed to next screen (checkout or payment)
    await expect(page.getByText(/checkout|payment|total/i)).toBeVisible({ timeout: 5000 });
  });
});
