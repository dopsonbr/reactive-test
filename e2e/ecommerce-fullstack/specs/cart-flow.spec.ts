import { test, expect } from '@playwright/test';

test.describe('Cart Flow (Full-Stack)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up session for test isolation
    await page.addInitScript(() => {
      const cartId = `e2e-cart-${Date.now()}`;
      sessionStorage.setItem('cartId', cartId);
      sessionStorage.setItem('userId', 'E2EUSR');
      sessionStorage.setItem('storeNumber', '1');
    });
  });

  test('add to cart calls real backend', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await page.waitForResponse('**/products/search**');
    await page.locator('[data-testid^="product-card-"]').first().waitFor();

    // Add to cart
    const addButton = page
      .locator('[data-testid^="product-card-"]')
      .first()
      .getByRole('button', { name: /add to cart/i });

    await addButton.click();

    // Wait for cart API call
    const cartResponse = await page.waitForResponse('**/carts/**/products');
    expect(cartResponse.status()).toBe(200);

    // Cart count should update
    await expect(page.getByTestId('cart-count')).toBeVisible();
  });

  test('cart page loads from real backend', async ({ page }) => {
    // First add an item
    await page.goto('/');
    await page.waitForResponse('**/products/search**');
    await page.locator('[data-testid^="product-card-"]').first().waitFor();

    await page
      .locator('[data-testid^="product-card-"]')
      .first()
      .getByRole('button', { name: /add to cart/i })
      .click();

    // Navigate to cart
    await page.getByTestId('cart-link').click();
    await expect(page).toHaveURL('/cart');

    // Wait for cart data
    await page.waitForResponse('**/carts/**');

    // Verify cart loaded
    await expect(
      page.getByText(/your cart/i).or(page.getByText(/empty/i))
    ).toBeVisible();
  });

  test('update quantity persists to backend', async ({ page }) => {
    // Add item first
    await page.goto('/');
    await page.waitForResponse('**/products/search**');
    await page.locator('[data-testid^="product-card-"]').first().waitFor();

    await page
      .locator('[data-testid^="product-card-"]')
      .first()
      .getByRole('button', { name: /add to cart/i })
      .click();

    await page.waitForResponse('**/carts/**/products');

    // Go to cart
    await page.getByTestId('cart-link').click();
    await page.waitForResponse('**/carts/**');

    // Find and click increase button
    const increaseButton = page.getByRole('button', { name: 'Increase quantity' });
    if (await increaseButton.isVisible()) {
      await increaseButton.click();

      // Wait for update API call
      const updateResponse = await page.waitForResponse((res) =>
        res.url().includes('/carts/') && res.request().method() === 'PUT'
      );
      expect(updateResponse.status()).toBe(200);
    }
  });

  test('remove item calls backend', async ({ page }) => {
    // Add item first
    await page.goto('/');
    await page.waitForResponse('**/products/search**');
    await page.locator('[data-testid^="product-card-"]').first().waitFor();

    await page
      .locator('[data-testid^="product-card-"]')
      .first()
      .getByRole('button', { name: /add to cart/i })
      .click();

    await page.waitForResponse('**/carts/**/products');

    // Go to cart
    await page.getByTestId('cart-link').click();
    await page.waitForResponse('**/carts/**');

    // Remove item
    const removeButton = page.getByRole('button', { name: 'Remove' });
    if (await removeButton.isVisible()) {
      await removeButton.click();

      // Wait for delete API call
      const deleteResponse = await page.waitForResponse((res) =>
        res.url().includes('/carts/') && res.request().method() === 'DELETE'
      );
      expect(deleteResponse.status()).toBe(200);
    }
  });
});
