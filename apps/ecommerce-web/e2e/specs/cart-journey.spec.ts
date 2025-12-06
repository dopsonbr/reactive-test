import { test, expect } from '@playwright/test';

test.describe('Cart Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session storage to start fresh
    await page.addInitScript(() => {
      sessionStorage.clear();
    });
  });

  test('user can add item to cart from product list', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await expect(page.getByTestId('product-card-SKU-001')).toBeVisible();

    // Add item to cart
    await page
      .getByTestId('product-card-SKU-001')
      .getByRole('button', { name: /add to cart/i })
      .click();

    // Cart icon should show count
    await expect(page.getByTestId('cart-count')).toHaveText('1');
  });

  test('user can add item to cart from product detail page', async ({
    page,
  }) => {
    await page.goto('/products/SKU-001');

    // Wait for product detail to load
    await expect(
      page.getByRole('heading', { name: 'Wireless Headphones' })
    ).toBeVisible();

    // Add to cart
    await page.getByRole('button', { name: /add to cart/i }).click();

    // Cart icon should show count
    await expect(page.getByTestId('cart-count')).toHaveText('1');
  });

  test('user can view cart and see items', async ({ page }) => {
    // First add an item
    await page.goto('/');
    await expect(page.getByTestId('product-card-SKU-001')).toBeVisible();
    await page
      .getByTestId('product-card-SKU-001')
      .getByRole('button', { name: /add to cart/i })
      .click();

    // Navigate to cart
    await page.getByTestId('cart-link').click();
    await expect(page).toHaveURL('/cart');

    // Verify item in cart
    await expect(page.getByTestId('cart-item-SKU-001')).toBeVisible();
    await expect(
      page.getByTestId('cart-item-SKU-001').getByText('Wireless Headphones')
    ).toBeVisible();
  });

  test('user can update cart item quantity', async ({ page }) => {
    // Add item first
    await page.goto('/');
    await expect(page.getByTestId('product-card-SKU-001')).toBeVisible();
    await page
      .getByTestId('product-card-SKU-001')
      .getByRole('button', { name: /add to cart/i })
      .click();

    // Navigate to cart
    await page.getByTestId('cart-link').click();

    // Increase quantity
    await page.getByRole('button', { name: 'Increase quantity' }).click();

    // Verify quantity updated
    await expect(page.getByTestId('item-quantity')).toHaveValue('2');

    // Verify total updated (299.99 * 2 = 599.98 + tax)
    await expect(page.getByTestId('cart-total')).toContainText('647.98');
  });

  test('user can remove item from cart', async ({ page }) => {
    // Add item first
    await page.goto('/');
    await expect(page.getByTestId('product-card-SKU-001')).toBeVisible();
    await page
      .getByTestId('product-card-SKU-001')
      .getByRole('button', { name: /add to cart/i })
      .click();

    // Navigate to cart
    await page.getByTestId('cart-link').click();
    await expect(page.getByTestId('cart-item-SKU-001')).toBeVisible();

    // Remove item
    await page.getByRole('button', { name: 'Remove' }).click();

    // Verify empty cart message
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('empty cart shows appropriate message', async ({ page }) => {
    await page.goto('/cart');

    // Verify empty cart UI
    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start Shopping' })).toBeVisible();
  });

  test('user can continue shopping from cart', async ({ page }) => {
    await page.goto('/cart');

    // Click continue shopping
    await page.getByRole('link', { name: 'Start Shopping' }).click();

    // Should navigate to product list
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('product-card-SKU-001')).toBeVisible();
  });

  test('adding same product twice increases quantity', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('product-card-SKU-001')).toBeVisible();

    // Add same product twice
    await page
      .getByTestId('product-card-SKU-001')
      .getByRole('button', { name: /add to cart/i })
      .click();

    // Wait for first add to complete
    await expect(page.getByTestId('cart-count')).toHaveText('1');

    await page
      .getByTestId('product-card-SKU-001')
      .getByRole('button', { name: /add to cart/i })
      .click();

    // Cart should show 2 items
    await expect(page.getByTestId('cart-count')).toHaveText('2');

    // Navigate to cart and verify single item with quantity 2
    await page.getByTestId('cart-link').click();
    await expect(page.getByTestId('item-quantity')).toHaveValue('2');
  });
});
