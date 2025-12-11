import { test, expect, TEST_EMPLOYEE, TEST_PRODUCTS } from '../fixtures';

/**
 * Full-Stack Transaction Journey Test
 *
 * This test runs against REAL backend services (no MSW mocks).
 * It navigates through the entire transaction flow like a real user:
 * Login -> Add Items -> Checkout -> Fulfillment -> Payment -> Complete
 *
 * Prerequisites:
 * - All backend services must be running (use ./powerstart)
 * - Frontend must be started WITHOUT MSW
 *
 * Run with:
 *   pnpm nx e2e pos-fullstack-e2e
 */

test.describe('Full-Stack Transaction Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to start fresh
    await page.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('complete transaction from login to receipt (real services)', async ({ page }) => {
    // 1. LOGIN
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
    await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for dashboard
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

    // 2. NAVIGATE TO TRANSACTION
    await page.getByRole('link', { name: 'New Transaction' }).click();
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();

    // 3. ADD ITEMS TO CART
    await page.getByRole('button', { name: /SKU-001/i }).click();
    await expect(page.getByText(/1 item/i)).toBeVisible();

    await page.getByRole('button', { name: /SKU-002/i }).click();
    await expect(page.getByText(/2 items/i)).toBeVisible();

    // 4. PROCEED TO CHECKOUT
    const checkoutBtn = page.getByRole('button', { name: /checkout/i });
    await expect(checkoutBtn).toBeEnabled();
    await checkoutBtn.click();

    // Should be on checkout page
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fulfillment Method' })).toBeVisible();

    // 5. SELECT FULFILLMENT (Take Now)
    await page.getByLabel(/take now/i).click();

    // 6. PROCEED TO PAYMENT
    await page.getByRole('button', { name: /proceed to payment/i }).click();

    // Should be on payment page
    await expect(page.getByRole('heading', { name: 'Payment', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Select Payment Method' })).toBeVisible();

    // 7. SELECT PAYMENT METHOD (Card)
    await page.getByRole('button', { name: 'Card', exact: true }).click();

    // 8. PROCESS PAYMENT
    await page.getByRole('button', { name: /simulate card payment/i }).click();

    // Wait for payment to complete
    await expect(page.getByText(/payment complete/i)).toBeVisible({ timeout: 15000 });

    // 9. COMPLETE TRANSACTION
    await page.getByRole('button', { name: /complete transaction/i }).click();

    // 10. VERIFY COMPLETION
    await expect(page.getByRole('heading', { name: /transaction complete/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /new transaction/i })).toBeVisible();
  });

  test('search for headphones and add to cart', async ({ page }) => {
    // 1. LOGIN
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
    await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

    // 2. NAVIGATE TO TRANSACTION
    await page.getByRole('link', { name: 'New Transaction' }).click();
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();

    // 3. OPEN SEARCH DIALOG
    await page.getByRole('button', { name: 'Search F3' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 4. SEARCH FOR HEADPHONES
    await page.getByPlaceholder(/search by sku/i).fill('headphones');

    // 5. WAIT FOR SEARCH RESULTS
    await expect(page.getByText(/wireless headphones/i)).toBeVisible({ timeout: 10000 });

    // 6. ADD HEADPHONES TO CART
    await page.getByRole('button', { name: 'Add' }).first().click();

    // 7. VERIFY DIALOG CLOSED AND ITEM ADDED
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText(/1 item/i)).toBeVisible();
    await expect(page.getByText(/headphones/i)).toBeVisible();
  });

  test('can start new transaction after completing one', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
    await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

    // Quick transaction
    await page.getByRole('link', { name: 'New Transaction' }).click();
    await page.getByRole('button', { name: /SKU-001/i }).click();
    await page.getByRole('button', { name: /checkout/i }).click();
    await page.getByLabel(/take now/i).click();
    await page.getByRole('button', { name: /proceed to payment/i }).click();
    await page.getByRole('button', { name: 'Card', exact: true }).click();
    await page.getByRole('button', { name: /simulate card payment/i }).click();
    await expect(page.getByText(/payment complete/i)).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /complete transaction/i }).click();

    // Complete - now start new transaction
    await expect(page.getByRole('heading', { name: /transaction complete/i })).toBeVisible();
    await page.getByRole('button', { name: /new transaction/i }).click();

    // Should be back at transaction page with empty cart
    await expect(page.getByPlaceholder('Scan or enter SKU...')).toBeVisible();
    await expect(page.getByText('Scan or search for items to add them to the cart')).toBeVisible();
  });
});
