import { test, expect, loginAs, testApi } from '../fixtures/test-base';

test.describe('Products Journey (Full-Stack)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin1');
  });

  test('can view products list', async ({ page }) => {
    // Navigate to products page
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL('/products');

    // Wait for products table to load
    await expect(page.getByTestId('products-table')).toBeVisible();

    // Should show table headers
    await expect(page.getByText('SKU')).toBeVisible();
    await expect(page.getByText('Name')).toBeVisible();
    await expect(page.getByText('MSRP')).toBeVisible();
  });

  test('can create a new product', async ({ page, uniqueSku, testData }) => {
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page.getByTestId('products-table')).toBeVisible();

    // Click add product button
    await page.getByTestId('add-product-btn').click();

    // Wait for create form to appear
    await expect(page.getByTestId('create-product-form')).toBeVisible();

    // Fill in product details with a unique SKU (tracked for cleanup)
    const sku = uniqueSku();
    testData.trackSku(sku);

    await page.getByTestId('create-sku-input').fill(sku.toString());
    await page.getByTestId('create-name-input').fill(`E2E Test Product ${sku}`);
    await page.getByTestId('create-description-input').fill('Created by E2E test');
    await page.getByTestId('create-category-input').fill('Test Category');
    await page.getByTestId('create-price-input').fill('29.99');

    // Click create button
    await page.getByTestId('save-new-product-btn').click();

    // Wait for form to close (indicates success)
    await expect(page.getByTestId('create-product-form')).not.toBeVisible({ timeout: 10000 });

    // Verify product appears in table
    await expect(page.getByText(`E2E Test Product ${sku}`)).toBeVisible();
  });

  test('can edit an existing product', async ({ page }) => {
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page.getByTestId('products-table')).toBeVisible();

    // Wait for at least one product row
    const firstRow = page.locator('[data-testid^="product-row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Click edit on the first product
    await firstRow.getByTestId('edit-product-btn').click();

    // Wait for edit inputs to appear
    await expect(page.getByTestId('edit-name-input')).toBeVisible();

    // Change the name
    const editNameInput = page.getByTestId('edit-name-input');
    await editNameInput.clear();
    await editNameInput.fill('Updated Product Name');

    // Save changes
    await page.getByTestId('save-edit-btn').click();

    // Wait for edit mode to close
    await expect(page.getByTestId('edit-name-input')).not.toBeVisible({ timeout: 10000 });

    // Verify the change persisted
    await expect(page.getByText('Updated Product Name')).toBeVisible();
  });

  test('can cancel editing without saving', async ({ page }) => {
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page.getByTestId('products-table')).toBeVisible();

    // Wait for at least one product row
    const firstRow = page.locator('[data-testid^="product-row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Get original name
    const originalName = await firstRow.locator('td').nth(1).textContent();

    // Click edit
    await firstRow.getByTestId('edit-product-btn').click();
    await expect(page.getByTestId('edit-name-input')).toBeVisible();

    // Change name but cancel
    const editNameInput = page.getByTestId('edit-name-input');
    await editNameInput.clear();
    await editNameInput.fill('Should Not Save');

    // Click cancel
    await page.getByTestId('cancel-edit-btn').click();

    // Verify original name is still shown
    await expect(page.getByTestId('edit-name-input')).not.toBeVisible();
    await expect(firstRow.locator('td').nth(1)).toHaveText(originalName || '');
  });

  test('can paginate through products', async ({ page }) => {
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page.getByTestId('products-table')).toBeVisible();

    // Verify page 1 is shown
    await expect(page.getByText('Page 1')).toBeVisible();

    // If next button is enabled, click it
    const nextBtn = page.getByTestId('next-page-btn');
    const isDisabled = await nextBtn.isDisabled();

    if (!isDisabled) {
      await nextBtn.click();
      // Should now show page 2
      await expect(page.getByText('Page 2')).toBeVisible();

      // Go back
      await page.getByTestId('prev-page-btn').click();
      await expect(page.getByText('Page 1')).toBeVisible();
    }
  });
});
