import { test, expect } from '@playwright/test';

test.describe('Product Flow (Full-Stack)', () => {
  test('loads product data from backend', async ({ page }) => {
    await page.goto('/');

    // Wait for real API response
    const response = await page.waitForResponse('**/products/search**');
    expect(response.status()).toBe(200);

    // Verify products loaded from real backend
    await expect(page.locator('[data-testid^="product-card-"]').first()).toBeVisible();
  });

  test('product detail shows real inventory status', async ({ page }) => {
    await page.goto('/');

    // Click on first product
    await page.locator('[data-testid^="product-card-"]').first().click();

    // Wait for product detail API call
    await page.waitForResponse('**/products/**');

    // Verify stock status is displayed (from real backend)
    await expect(
      page.getByText(/in stock/i).or(page.getByText(/out of stock/i))
    ).toBeVisible();
  });

  test('search queries real backend', async ({ page }) => {
    await page.goto('/');

    // Wait for initial load
    await page.waitForResponse('**/products/search**');

    // Search for a product
    await page.getByPlaceholder('Search products').fill('test');
    await page.getByRole('button', { name: 'Search' }).click();

    // Wait for search API call
    const searchResponse = await page.waitForResponse('**/products/search**');
    expect(searchResponse.status()).toBe(200);
  });
});
