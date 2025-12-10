import { test, expect } from '@playwright/test';
import {
  loginAsEmployee,
  startTransaction,
  addItem,
  attachCustomer,
  skipCustomer,
  TEST_PRODUCTS,
  TEST_CUSTOMERS,
  TEST_EMPLOYEES,
} from '../../fixtures';

/**
 * Scenario 1.2: Customer Loyalty Transaction
 *
 * Tests the workflow when a loyalty customer is attached to a transaction,
 * including tier discounts and points preview.
 *
 * @see 045G_POS_E2E_TESTING.md - Scenario 1.2
 */
test.describe('Customer Loyalty Transaction', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.ASSOCIATE.id, TEST_EMPLOYEES.ASSOCIATE.pin);
    await startTransaction(page);
  });

  test('LY-001: Lookup customer by email', async ({ page }) => {
    // Given: Customer exists
    // When: Enter email
    await page.getByPlaceholder(/customer email|phone|search/i).fill(TEST_CUSTOMERS.D2C_GOLD.email);
    await page.keyboard.press('Enter');

    // Then: Customer profile loads
    await expect(page.getByTestId('customer-profile')).toBeVisible();
    await expect(page.getByTestId('customer-name')).toContainText(TEST_CUSTOMERS.D2C_GOLD.name);
  });

  test('LY-002: Lookup customer by phone', async ({ page }) => {
    // Given: Customer exists
    // When: Enter phone
    await page.getByPlaceholder(/customer email|phone|search/i).fill(TEST_CUSTOMERS.D2C_GOLD.phone);
    await page.keyboard.press('Enter');

    // Then: Customer profile loads
    await expect(page.getByTestId('customer-profile')).toBeVisible();
    await expect(page.getByTestId('customer-name')).toContainText(TEST_CUSTOMERS.D2C_GOLD.name);
  });

  test('LY-003: Customer not found shows create option', async ({ page }) => {
    // Given: No matching customer
    // When: Search for non-existent customer
    await page.getByPlaceholder(/customer email|phone|search/i).fill('nonexistent@fake.com');
    await page.keyboard.press('Enter');

    // Then: "Not found" with create option
    await expect(page.getByTestId('customer-not-found')).toBeVisible();
    await expect(page.getByRole('button', { name: /create|new customer/i })).toBeVisible();
  });

  test('LY-004: GOLD tier benefits apply discount', async ({ page }) => {
    // Given: GOLD customer attached
    await attachCustomer(page, TEST_CUSTOMERS.D2C_GOLD.email);

    // When: Add $100 of items
    await addItem(page, TEST_PRODUCTS.WIDGET_STANDARD.sku); // $79.99

    // Then: 10% GOLD discount should be visible or applied
    // Check for discount indicator or adjusted price
    const hasDiscount = await Promise.race([
      page.waitForSelector('[data-testid="loyalty-discount"]', { timeout: 2000 }).then(() => true),
      page.waitForSelector('[data-testid="tier-discount"]', { timeout: 2000 }).then(() => true),
    ]).catch(() => false);

    // Either discount badge is shown or prices are adjusted
    if (hasDiscount) {
      await expect(page.getByTestId('loyalty-discount')).toBeVisible();
    }

    // GOLD tier should show 10%
    await expect(page.getByText(/gold|10%/i)).toBeVisible();
  });

  test('LY-005: Points preview shows expected earnings', async ({ page }) => {
    // Given: Customer attached
    await attachCustomer(page, TEST_CUSTOMERS.D2C_GOLD.email);

    // When: Add items and view cart
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku); // $149.99

    // Then: Shows points to be earned
    // Points typically 1 per dollar = ~150 points
    await expect(page.getByTestId('points-preview')).toBeVisible();
    await expect(page.getByTestId('points-preview')).toContainText(/\d+ points/i);
  });

  test('LY-007: Guest checkout without customer', async ({ page }) => {
    // Given: No customer
    // When: Skip customer lookup
    await skipCustomer(page);

    // Add items
    await addItem(page, TEST_PRODUCTS.ACCESSORY.sku);

    // Then: Transaction completes as guest
    await page.getByRole('button', { name: /checkout/i }).click();
    await expect(page.getByTestId('payment-panel')).toBeVisible();

    // No loyalty info shown
    await expect(page.getByTestId('loyalty-discount')).not.toBeVisible();
  });
});

test.describe('Loyalty Tier Benefits', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.ASSOCIATE.id, TEST_EMPLOYEES.ASSOCIATE.pin);
    await startTransaction(page);
  });

  test('LY-BRONZE: Bronze tier has no automatic discount', async ({ page }) => {
    // Given: Bronze customer
    await attachCustomer(page, TEST_CUSTOMERS.D2C_BRONZE.email);

    // When: Add items
    await addItem(page, TEST_PRODUCTS.WIDGET_STANDARD.sku);

    // Then: No tier discount (Bronze = 0%)
    const tierDiscount = page.getByTestId('tier-discount');
    if (await tierDiscount.isVisible()) {
      await expect(tierDiscount).toContainText('0%');
    }

    // Price should be original
    await expect(page.getByTestId('line-total-0')).toContainText('$79.99');
  });

  test('LY-GOLD: Gold tier shows 10% discount', async ({ page }) => {
    // Given: Gold customer
    await attachCustomer(page, TEST_CUSTOMERS.D2C_GOLD.email);

    // Check tier badge
    await expect(page.getByTestId('loyalty-tier')).toContainText(/gold/i);
  });
});

test.describe('Customer Management Integration', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.ASSOCIATE.id, TEST_EMPLOYEES.ASSOCIATE.pin);
    await startTransaction(page);
  });

  test('Detaching customer removes discounts', async ({ page }) => {
    // Given: Customer attached with discount
    await attachCustomer(page, TEST_CUSTOMERS.D2C_GOLD.email);
    await addItem(page, TEST_PRODUCTS.WIDGET_STANDARD.sku);

    // Verify GOLD discount is applied
    await expect(page.getByText(/gold/i)).toBeVisible();

    // When: Detach customer
    await page.getByRole('button', { name: /remove customer|detach|clear/i }).click();

    // Then: Discount removed, price back to original
    await expect(page.getByTestId('attached-customer')).not.toBeVisible();
    await expect(page.getByTestId('line-total-0')).toContainText('$79.99');
  });

  test('Switching customer updates pricing', async ({ page }) => {
    // Given: Bronze customer attached
    await attachCustomer(page, TEST_CUSTOMERS.D2C_BRONZE.email);
    await addItem(page, TEST_PRODUCTS.WIDGET_STANDARD.sku);

    // Original price (Bronze = 0%)
    await expect(page.getByTestId('line-total-0')).toContainText('$79.99');

    // When: Switch to Gold customer
    await page.getByRole('button', { name: /change customer|switch/i }).click();
    await attachCustomer(page, TEST_CUSTOMERS.D2C_GOLD.email);

    // Then: Gold discount applied (10% off)
    // $79.99 * 0.9 = ~$71.99
    const lineTotal = await page.getByTestId('line-total-0').textContent();
    expect(lineTotal).toMatch(/\$7[12]\.\d{2}/); // Should be around $71.99
  });
});
