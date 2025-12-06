import { test, expect } from '@playwright/test';

test.describe('Product Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session storage to start fresh
    await page.addInitScript(() => {
      sessionStorage.clear();
    });
  });

  test('user can browse products on home page', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await expect(page.getByTestId('product-card-SKU-001')).toBeVisible();
    await expect(page.getByTestId('product-card-SKU-002')).toBeVisible();

    // Verify product details are displayed (use heading role to be specific)
    await expect(
      page.getByTestId('product-card-SKU-001').locator('h3')
    ).toContainText('Wireless Headphones');
    await expect(page.getByText('$299.99').first()).toBeVisible();
  });

  test('user can click on product to view details', async ({ page }) => {
    await page.goto('/');

    // Wait for product list
    await expect(page.getByTestId('product-card-SKU-001')).toBeVisible();

    // Click on product image/link
    await page.getByTestId('product-card-SKU-001').locator('a').first().click();

    // Verify navigation to product detail page
    await expect(page).toHaveURL('/products/SKU-001');
    await expect(
      page.getByRole('heading', { name: 'Wireless Headphones', level: 1 })
    ).toBeVisible();
  });

  test('user can search for products', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load first
    await expect(page.getByTestId('product-card-SKU-001')).toBeVisible();

    // Search for a product
    await page.getByPlaceholder('Search products').fill('watch');
    await page.getByRole('button', { name: 'Search' }).click();

    // Wait for search results
    await expect(page.getByTestId('product-card-SKU-002')).toBeVisible();
    await expect(
      page.getByTestId('product-card-SKU-002').locator('h3')
    ).toContainText('Smart Watch');
  });

  test('user can filter by category', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await expect(page.getByTestId('product-card-SKU-001')).toBeVisible();

    // Click on Sports category
    await page.getByRole('button', { name: 'Sports' }).click();

    // Verify sports products are shown
    await expect(page.getByTestId('product-card-SKU-005')).toBeVisible();
    await expect(
      page.getByTestId('product-card-SKU-005').locator('h3')
    ).toContainText('Running Shoes');
  });

  test('product detail shows stock status', async ({ page }) => {
    await page.goto('/products/SKU-001');

    // Wait for product to load
    await expect(
      page.getByRole('heading', { name: 'Wireless Headphones', level: 1 })
    ).toBeVisible();

    // Verify stock status is displayed
    await expect(page.getByText('In Stock')).toBeVisible();
    await expect(page.getByText('50 available')).toBeVisible();
  });

  test('out of stock product shows disabled add to cart', async ({ page }) => {
    await page.goto('/products/SKU-008');

    // Wait for product to load
    await expect(
      page.getByRole('heading', { name: 'Denim Jacket', level: 1 })
    ).toBeVisible();

    // Verify out of stock status
    await expect(page.getByText('Out of Stock').first()).toBeVisible();

    // Add to cart button should be disabled
    await expect(
      page.getByRole('button', { name: /out of stock/i })
    ).toBeDisabled();
  });
});
