import { test, expect, Page } from '@playwright/test';

/**
 * Helper to enter SKU using the manual entry dialog
 * More reliable than keyboard simulation for E2E testing
 */
async function enterSkuManually(page: Page, sku: string) {
  // Open manual SKU dialog
  await page.getByRole('button', { name: /enter sku manually/i }).click();
  
  // Wait for dialog to open
  await expect(page.getByRole('heading', { name: /enter sku manually/i })).toBeVisible({ timeout: 5000 });
  
  // Enter SKU digits using numeric keypad
  for (const char of sku) {
    await page.getByRole('button', { name: char, exact: true }).click();
  }
  
  // Submit
  await page.getByRole('button', { name: /submit/i }).click();
}

/**
 * Sanity check E2E test for the self-checkout kiosk
 *
 * This test verifies the complete happy path works end-to-end
 * without mocks, hitting real backend services.
 *
 * Flow:
 * 1. Start transaction
 * 2. Add product via manual SKU entry
 * 3. Search for "headphones" and add to cart
 * 4. Review cart and increment quantities
 * 5. Skip loyalty
 * 6. Complete checkout with simulated payment
 * 7. Verify confirmation page
 */
test.describe('Sanity Check - Full E2E Flow', () => {
  test('complete checkout flow without mocks', async ({ page }) => {
    // Increase timeout for full flow
    test.setTimeout(180000);

    // ========================================
    // STEP 1: Start Transaction
    // ========================================
    await page.goto('/');

    // Wait for welcome screen
    await expect(page.getByRole('button', { name: /touch to start/i })).toBeVisible({ timeout: 10000 });

    // Start transaction
    await page.getByRole('button', { name: /touch to start/i }).click();

    // Should be on scan page
    await expect(page.getByText(/scan your items/i)).toBeVisible({ timeout: 10000 });

    // ========================================
    // STEP 2: Add a product via manual SKU entry
    // ========================================
    // Using 8-digit SKU (10000002 = Smart Watch)
    await enterSkuManually(page, '10000002');

    // Wait for item added feedback
    await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 15000 });

    // Wait for cart state to propagate
    await page.waitForTimeout(2000);

    // ========================================
    // STEP 3: Search for "headphones" and add to cart
    // ========================================
    // Open product search dialog
    await page.getByRole('button', { name: /search products/i }).click();

    // Wait for search dialog to open
    await expect(page.getByRole('heading', { name: /search products/i })).toBeVisible({ timeout: 5000 });

    // Type search query
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('headphones');

    // Wait for search results
    await expect(page.getByText('Wireless Headphones')).toBeVisible({ timeout: 10000 });

    // Click on the Wireless Headphones product to add it
    await page.getByText('Wireless Headphones').click();

    // Wait for item added feedback (dialog should close after selection)
    await expect(page.getByText(/item added/i)).toBeVisible({ timeout: 15000 });

    // Wait for cart state to propagate
    await page.waitForTimeout(2000);

    // ========================================
    // STEP 4: Go to cart and increment quantities
    // ========================================
    // Navigate to cart
    await page.getByRole('button', { name: /review cart/i }).click();

    // Wait for cart page
    await expect(page.getByRole('heading', { name: /review your cart/i })).toBeVisible({ timeout: 10000 });

    // Should see items in cart
    await expect(page.getByText(/items? in cart/i)).toBeVisible({ timeout: 10000 });

    // Find increment buttons (+ buttons in QuantitySelector)
    const incrementButtons = page.locator('button:has-text("+")');

    // Increment first item quantity (if available)
    if ((await incrementButtons.count()) > 0) {
      await incrementButtons.nth(0).click();
      await page.waitForTimeout(1000); // Wait for mutation
    }

    // Increment second item quantity (if available)
    if ((await incrementButtons.count()) > 1) {
      await incrementButtons.nth(1).click();
      await page.waitForTimeout(1000); // Wait for mutation
    }

    // ========================================
    // STEP 5: Navigate to loyalty and skip
    // ========================================
    await page.getByRole('button', { name: /continue to loyalty/i }).click();

    // Wait for loyalty page (use heading role to be specific)
    await expect(page.getByRole('heading', { name: /loyalty account/i })).toBeVisible({ timeout: 10000 });

    // Skip loyalty - should navigate to checkout
    await page.getByRole('button', { name: /skip.*no loyalty/i }).click();

    // ========================================
    // STEP 6: Checkout and complete payment
    // ========================================
    // After skipping loyalty, should navigate to checkout
    await expect(page).toHaveURL(/\/checkout/, { timeout: 10000 });

    // Wait for checkout page to load
    await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible({ timeout: 15000 });

    // Wait for checkout to initialize (shows amount due)
    await expect(page.getByText(/amount due/i)).toBeVisible({ timeout: 15000 });

    // Wait for checkout to finish loading - the "Pay with Card" button should be enabled
    // (not showing "Loading Checkout...")
    const payButton = page.getByRole('button', { name: /pay with card/i });
    await expect(payButton).toBeEnabled({ timeout: 30000 });

    // Verify we have a non-zero total (grandTotal should be displayed)
    // Look for the bold total price which will be something like $199.98
    await expect(page.getByLabel(/Price: \$\d+\.\d{2}/).first()).toBeVisible({ timeout: 5000 });

    // Click "Pay with Card" button
    await payButton.click();

    // Wait for payment processing (the button shows "Processing Payment...")
    // This is a transient state that may pass quickly, so we wait for the result instead

    // ========================================
    // STEP 7: Verify confirmation page
    // ========================================
    // Wait for confirmation page (shows "Payment Successful!" with exclamation)
    await expect(page.getByText(/payment successful/i)).toBeVisible({ timeout: 60000 });

    // Verify order number is displayed (text "Order Number")
    await expect(page.getByText(/order number/i)).toBeVisible({ timeout: 10000 });

    // Verify "Done" button is present (shows "Done - Start New Transaction")
    await expect(page.getByRole('button', { name: /done.*start new transaction/i })).toBeVisible({ timeout: 5000 });

    // Click done to complete the flow
    await page.getByRole('button', { name: /done.*start new transaction/i }).click();

    // Should be back on welcome screen
    await expect(page.getByRole('button', { name: /touch to start/i })).toBeVisible({ timeout: 10000 });
  });
});
