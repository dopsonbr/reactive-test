import { test, expect, loginAs } from '../fixtures/test-base';

test.describe('Inventory Journey (Full-Stack)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin1');
  });

  test('can view inventory list', async ({ page }) => {
    // Navigate to inventory page
    await page.getByRole('link', { name: 'Inventory' }).click();
    await expect(page).toHaveURL('/inventory');

    // Wait for inventory table to load
    await expect(page.getByTestId('inventory-table')).toBeVisible();

    // Should show table headers
    await expect(page.getByText('SKU')).toBeVisible();
    await expect(page.getByText('Available Quantity')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
    await expect(page.getByText('Last Updated')).toBeVisible();
  });

  test('can update inventory quantity', async ({ page }) => {
    await page.getByRole('link', { name: 'Inventory' }).click();
    await expect(page.getByTestId('inventory-table')).toBeVisible();

    // Wait for at least one inventory row
    const firstRow = page.locator('[data-testid^="inventory-row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Click edit on the first inventory item
    await firstRow.getByTestId('edit-inventory-btn').click();

    // Wait for edit input to appear
    await expect(page.getByTestId('edit-quantity-input')).toBeVisible();

    // Update the quantity
    const editQuantityInput = page.getByTestId('edit-quantity-input');
    await editQuantityInput.clear();
    await editQuantityInput.fill('50');

    // Save changes
    await page.getByTestId('save-inventory-btn').click();

    // Wait for edit mode to close
    await expect(page.getByTestId('edit-quantity-input')).not.toBeVisible({ timeout: 10000 });

    // Verify the change persisted
    await expect(firstRow.getByText('50')).toBeVisible();
  });

  test('shows correct stock status badges', async ({ page }) => {
    await page.getByRole('link', { name: 'Inventory' }).click();
    await expect(page.getByTestId('inventory-table')).toBeVisible();

    // Wait for rows to load
    await page.locator('[data-testid^="inventory-row-"]').first().waitFor({ timeout: 10000 });

    // Status badges should be one of: In Stock, Low Stock, Out of Stock
    const statusBadges = page.locator('[data-testid^="inventory-row-"] span').filter({
      hasText: /In Stock|Low Stock|Out of Stock/,
    });

    // At least one status badge should be visible
    await expect(statusBadges.first()).toBeVisible();
  });

  test('can filter to show only low stock items', async ({ page }) => {
    await page.getByRole('link', { name: 'Inventory' }).click();
    await expect(page.getByTestId('inventory-table')).toBeVisible();

    // Click the low stock filter checkbox
    await page.getByTestId('low-stock-filter').click();

    // Wait a moment for the query to update
    await page.waitForTimeout(500);

    // If there are low stock items, the warning banner should appear
    // or the table should show "No low stock items" if none exist
    const lowStockWarning = page.getByText(/item\(s\) below reorder threshold/);
    const noLowStock = page.getByText('No low stock items');

    // One of these should be visible
    await expect(lowStockWarning.or(noLowStock)).toBeVisible({ timeout: 10000 });

    // Uncheck the filter
    await page.getByTestId('low-stock-filter').click();

    // Should return to showing all items
    await expect(page.getByText('Page 1')).toBeVisible();
  });

  test('can cancel inventory edit without saving', async ({ page }) => {
    await page.getByRole('link', { name: 'Inventory' }).click();
    await expect(page.getByTestId('inventory-table')).toBeVisible();

    // Wait for at least one inventory row
    const firstRow = page.locator('[data-testid^="inventory-row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Get the original quantity
    const originalQuantity = await firstRow.locator('td').nth(1).textContent();

    // Click edit
    await firstRow.getByTestId('edit-inventory-btn').click();
    await expect(page.getByTestId('edit-quantity-input')).toBeVisible();

    // Change quantity but cancel
    const editQuantityInput = page.getByTestId('edit-quantity-input');
    await editQuantityInput.clear();
    await editQuantityInput.fill('9999');

    // Click cancel
    await page.getByTestId('cancel-edit-btn').click();

    // Verify original quantity is still shown
    await expect(page.getByTestId('edit-quantity-input')).not.toBeVisible();
    await expect(firstRow.locator('td').nth(1)).toHaveText(originalQuantity || '');
  });

  test('can paginate through inventory', async ({ page }) => {
    await page.getByRole('link', { name: 'Inventory' }).click();
    await expect(page.getByTestId('inventory-table')).toBeVisible();

    // Make sure low stock filter is off
    const lowStockCheckbox = page.getByTestId('low-stock-filter');
    if (await lowStockCheckbox.isChecked()) {
      await lowStockCheckbox.click();
    }

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
