import { test, expect, loginAs } from '../fixtures/test-base';

test.describe('Form Validation (Full-Stack)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin1');
  });

  test.describe('Products - Create Validation', () => {
    test('shows error when SKU is empty', async ({ page }) => {
      await page.getByRole('link', { name: 'Products' }).click();
      await expect(page.getByTestId('products-table')).toBeVisible();

      await page.getByTestId('add-product-btn').click();
      await expect(page.getByTestId('create-product-form')).toBeVisible();

      // Fill name and price but leave SKU empty
      await page.getByTestId('create-name-input').fill('Test Product');
      await page.getByTestId('create-price-input').fill('19.99');

      await page.getByTestId('save-new-product-btn').click();

      // Should show validation error
      await expect(page.getByTestId('create-error-message')).toBeVisible();
      await expect(page.getByTestId('create-error-message')).toHaveText(/SKU/i);

      // Form should still be open
      await expect(page.getByTestId('create-product-form')).toBeVisible();
    });

    test('shows error when name is empty', async ({ page }) => {
      await page.getByRole('link', { name: 'Products' }).click();
      await expect(page.getByTestId('products-table')).toBeVisible();

      await page.getByTestId('add-product-btn').click();
      await expect(page.getByTestId('create-product-form')).toBeVisible();

      // Fill SKU and price but leave name empty
      await page.getByTestId('create-sku-input').fill('99999');
      await page.getByTestId('create-price-input').fill('19.99');

      await page.getByTestId('save-new-product-btn').click();

      await expect(page.getByTestId('create-error-message')).toBeVisible();
      await expect(page.getByTestId('create-error-message')).toHaveText(/Name/i);
    });

    test('shows error when MSRP is empty', async ({ page }) => {
      await page.getByRole('link', { name: 'Products' }).click();
      await expect(page.getByTestId('products-table')).toBeVisible();

      await page.getByTestId('add-product-btn').click();
      await expect(page.getByTestId('create-product-form')).toBeVisible();

      // Fill SKU and name but leave price empty
      await page.getByTestId('create-sku-input').fill('99999');
      await page.getByTestId('create-name-input').fill('Test Product');

      await page.getByTestId('save-new-product-btn').click();

      await expect(page.getByTestId('create-error-message')).toBeVisible();
      await expect(page.getByTestId('create-error-message')).toHaveText(/MSRP/i);
    });

    test('shows error when MSRP is too low', async ({ page }) => {
      await page.getByRole('link', { name: 'Products' }).click();
      await expect(page.getByTestId('products-table')).toBeVisible();

      await page.getByTestId('add-product-btn').click();
      await expect(page.getByTestId('create-product-form')).toBeVisible();

      await page.getByTestId('create-sku-input').fill('99999');
      await page.getByTestId('create-name-input').fill('Test Product');
      await page.getByTestId('create-price-input').fill('0');

      await page.getByTestId('save-new-product-btn').click();

      await expect(page.getByTestId('create-error-message')).toBeVisible();
      await expect(page.getByTestId('create-error-message')).toHaveText(/at least/i);
    });

    test('clears error when user starts typing', async ({ page }) => {
      await page.getByRole('link', { name: 'Products' }).click();
      await expect(page.getByTestId('products-table')).toBeVisible();

      await page.getByTestId('add-product-btn').click();
      await expect(page.getByTestId('create-product-form')).toBeVisible();

      // Trigger validation error
      await page.getByTestId('save-new-product-btn').click();
      await expect(page.getByTestId('create-error-message')).toBeVisible();

      // Start typing - error should clear
      await page.getByTestId('create-sku-input').fill('12345');
      await expect(page.getByTestId('create-error-message')).not.toBeVisible();
    });
  });

  test.describe('Products - Edit Validation', () => {
    test('shows error when name is cleared', async ({ page }) => {
      await page.getByRole('link', { name: 'Products' }).click();
      await expect(page.getByTestId('products-table')).toBeVisible();

      const firstRow = page.locator('[data-testid^="product-row-"]').first();
      await expect(firstRow).toBeVisible({ timeout: 10000 });

      await firstRow.getByTestId('edit-product-btn').click();
      await expect(page.getByTestId('edit-name-input')).toBeVisible();

      // Clear the name
      await page.getByTestId('edit-name-input').clear();
      await page.getByTestId('save-edit-btn').click();

      await expect(page.getByTestId('edit-error-message')).toBeVisible();
      await expect(page.getByTestId('edit-error-message')).toHaveText(/Name/i);
    });

    test('shows error when MSRP is invalid', async ({ page }) => {
      await page.getByRole('link', { name: 'Products' }).click();
      await expect(page.getByTestId('products-table')).toBeVisible();

      const firstRow = page.locator('[data-testid^="product-row-"]').first();
      await expect(firstRow).toBeVisible({ timeout: 10000 });

      await firstRow.getByTestId('edit-product-btn').click();
      await expect(page.getByTestId('edit-price-input')).toBeVisible();

      // Set price to 0
      await page.getByTestId('edit-price-input').clear();
      await page.getByTestId('edit-price-input').fill('0');
      await page.getByTestId('save-edit-btn').click();

      await expect(page.getByTestId('edit-error-message')).toBeVisible();
      await expect(page.getByTestId('edit-error-message')).toHaveText(/at least/i);
    });
  });

  test.describe('Pricing - Edit Validation', () => {
    test('shows error when price is empty', async ({ page }) => {
      await page.getByRole('link', { name: 'Pricing' }).click();
      await expect(page.getByTestId('pricing-table')).toBeVisible();

      const firstRow = page.locator('[data-testid^="price-row-"]').first();
      await expect(firstRow).toBeVisible({ timeout: 10000 });

      await firstRow.getByTestId('edit-price-btn').click();
      await expect(page.getByTestId('edit-price-input')).toBeVisible();

      // Clear the price
      await page.getByTestId('edit-price-input').clear();
      await page.getByTestId('save-price-btn').click();

      await expect(page.getByTestId('edit-error-message')).toBeVisible();
      await expect(page.getByTestId('edit-error-message')).toHaveText(/Price/i);
    });

    test('shows error when price is too low', async ({ page }) => {
      await page.getByRole('link', { name: 'Pricing' }).click();
      await expect(page.getByTestId('pricing-table')).toBeVisible();

      const firstRow = page.locator('[data-testid^="price-row-"]').first();
      await expect(firstRow).toBeVisible({ timeout: 10000 });

      await firstRow.getByTestId('edit-price-btn').click();
      await expect(page.getByTestId('edit-price-input')).toBeVisible();

      await page.getByTestId('edit-price-input').clear();
      await page.getByTestId('edit-price-input').fill('0');
      await page.getByTestId('save-price-btn').click();

      await expect(page.getByTestId('edit-error-message')).toBeVisible();
      await expect(page.getByTestId('edit-error-message')).toHaveText(/at least/i);
    });

    test('clears error when user modifies input', async ({ page }) => {
      await page.getByRole('link', { name: 'Pricing' }).click();
      await expect(page.getByTestId('pricing-table')).toBeVisible();

      const firstRow = page.locator('[data-testid^="price-row-"]').first();
      await expect(firstRow).toBeVisible({ timeout: 10000 });

      await firstRow.getByTestId('edit-price-btn').click();
      await expect(page.getByTestId('edit-price-input')).toBeVisible();

      // Trigger error
      await page.getByTestId('edit-price-input').clear();
      await page.getByTestId('save-price-btn').click();
      await expect(page.getByTestId('edit-error-message')).toBeVisible();

      // Fix the input
      await page.getByTestId('edit-price-input').fill('9.99');
      await expect(page.getByTestId('edit-error-message')).not.toBeVisible();
    });
  });

  test.describe('Inventory - Edit Validation', () => {
    test('shows error when quantity is empty', async ({ page }) => {
      await page.getByRole('link', { name: 'Inventory' }).click();
      await expect(page.getByTestId('inventory-table')).toBeVisible();

      const firstRow = page.locator('[data-testid^="inventory-row-"]').first();
      await expect(firstRow).toBeVisible({ timeout: 10000 });

      await firstRow.getByTestId('edit-inventory-btn').click();
      await expect(page.getByTestId('edit-quantity-input')).toBeVisible();

      // Clear the quantity
      await page.getByTestId('edit-quantity-input').clear();
      await page.getByTestId('save-inventory-btn').click();

      await expect(page.getByTestId('edit-error-message')).toBeVisible();
      await expect(page.getByTestId('edit-error-message')).toHaveText(/Quantity/i);
    });

    test('shows error when quantity is negative', async ({ page }) => {
      await page.getByRole('link', { name: 'Inventory' }).click();
      await expect(page.getByTestId('inventory-table')).toBeVisible();

      const firstRow = page.locator('[data-testid^="inventory-row-"]').first();
      await expect(firstRow).toBeVisible({ timeout: 10000 });

      await firstRow.getByTestId('edit-inventory-btn').click();
      await expect(page.getByTestId('edit-quantity-input')).toBeVisible();

      await page.getByTestId('edit-quantity-input').clear();
      await page.getByTestId('edit-quantity-input').fill('-5');
      await page.getByTestId('save-inventory-btn').click();

      await expect(page.getByTestId('edit-error-message')).toBeVisible();
      await expect(page.getByTestId('edit-error-message')).toHaveText(/negative/i);
    });

    test('clears error when user modifies input', async ({ page }) => {
      await page.getByRole('link', { name: 'Inventory' }).click();
      await expect(page.getByTestId('inventory-table')).toBeVisible();

      const firstRow = page.locator('[data-testid^="inventory-row-"]').first();
      await expect(firstRow).toBeVisible({ timeout: 10000 });

      await firstRow.getByTestId('edit-inventory-btn').click();
      await expect(page.getByTestId('edit-quantity-input')).toBeVisible();

      // Trigger error
      await page.getByTestId('edit-quantity-input').clear();
      await page.getByTestId('save-inventory-btn').click();
      await expect(page.getByTestId('edit-error-message')).toBeVisible();

      // Fix the input
      await page.getByTestId('edit-quantity-input').fill('25');
      await expect(page.getByTestId('edit-error-message')).not.toBeVisible();
    });
  });
});
