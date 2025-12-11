import { test, expect, loginAs } from '../fixtures/test-base';

test.describe('Pricing Journey (Full-Stack)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin1');
  });

  test('can view pricing list', async ({ page }) => {
    // Navigate to pricing page
    await page.getByRole('link', { name: 'Pricing' }).click();
    await expect(page).toHaveURL('/pricing');

    // Wait for pricing table to load
    await expect(page.getByTestId('pricing-table')).toBeVisible();

    // Should show table headers
    await expect(page.getByText('SKU')).toBeVisible();
    await expect(page.getByText('Current Price')).toBeVisible();
    await expect(page.getByText('Original Price')).toBeVisible();
    await expect(page.getByText('Currency')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
  });

  test('can update a price', async ({ page }) => {
    await page.getByRole('link', { name: 'Pricing' }).click();
    await expect(page.getByTestId('pricing-table')).toBeVisible();

    // Wait for at least one price row
    const firstRow = page.locator('[data-testid^="price-row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Click edit on the first price
    await firstRow.getByTestId('edit-price-btn').click();

    // Wait for edit inputs to appear
    await expect(page.getByTestId('edit-price-input')).toBeVisible();

    // Update the price
    const editPriceInput = page.getByTestId('edit-price-input');
    await editPriceInput.clear();
    await editPriceInput.fill('19.99');

    // Save changes
    await page.getByTestId('save-price-btn').click();

    // Wait for edit mode to close
    await expect(page.getByTestId('edit-price-input')).not.toBeVisible({ timeout: 10000 });

    // Verify the change persisted
    await expect(page.getByText('$19.99')).toBeVisible();
  });

  test('can set a sale price', async ({ page }) => {
    await page.getByRole('link', { name: 'Pricing' }).click();
    await expect(page.getByTestId('pricing-table')).toBeVisible();

    // Wait for at least one price row
    const firstRow = page.locator('[data-testid^="price-row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Click edit
    await firstRow.getByTestId('edit-price-btn').click();
    await expect(page.getByTestId('edit-price-input')).toBeVisible();

    // Set current price lower than original to create a sale
    const editPriceInput = page.getByTestId('edit-price-input');
    const editOriginalPriceInput = page.getByTestId('edit-original-price-input');

    await editPriceInput.clear();
    await editPriceInput.fill('14.99');

    await editOriginalPriceInput.clear();
    await editOriginalPriceInput.fill('24.99');

    // Save changes
    await page.getByTestId('save-price-btn').click();

    // Wait for edit mode to close
    await expect(page.getByTestId('edit-price-input')).not.toBeVisible({ timeout: 10000 });

    // Verify the sale price and "On Sale" badge appear
    await expect(page.getByText('$14.99')).toBeVisible();
    await expect(page.getByText('On Sale').first()).toBeVisible();
  });

  test('can cancel price edit without saving', async ({ page }) => {
    await page.getByRole('link', { name: 'Pricing' }).click();
    await expect(page.getByTestId('pricing-table')).toBeVisible();

    // Wait for at least one price row
    const firstRow = page.locator('[data-testid^="price-row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Get the original price text
    const originalPrice = await firstRow.locator('td').nth(1).textContent();

    // Click edit
    await firstRow.getByTestId('edit-price-btn').click();
    await expect(page.getByTestId('edit-price-input')).toBeVisible();

    // Change price but cancel
    const editPriceInput = page.getByTestId('edit-price-input');
    await editPriceInput.clear();
    await editPriceInput.fill('999.99');

    // Click cancel
    await page.getByTestId('cancel-edit-btn').click();

    // Verify original price is still shown
    await expect(page.getByTestId('edit-price-input')).not.toBeVisible();
    await expect(firstRow.locator('td').nth(1)).toHaveText(originalPrice || '');
  });

  test('can paginate through prices', async ({ page }) => {
    await page.getByRole('link', { name: 'Pricing' }).click();
    await expect(page.getByTestId('pricing-table')).toBeVisible();

    // Verify page 1 is shown
    await expect(page.getByText('Page 1')).toBeVisible();

    // Check if next button is enabled
    const nextBtn = page.getByTestId('next-page-btn');
    const isDisabled = await nextBtn.isDisabled();

    if (!isDisabled) {
      await nextBtn.click();
      await expect(page.getByText('Page 2')).toBeVisible();

      await page.getByTestId('prev-page-btn').click();
      await expect(page.getByText('Page 1')).toBeVisible();
    }
  });
});
