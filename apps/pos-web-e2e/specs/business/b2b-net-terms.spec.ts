import { test, expect } from '@playwright/test';
import {
  loginAsEmployee,
  startTransaction,
  addItem,
  attachCustomer,
  processNetTermsPayment,
  TEST_PRODUCTS,
  TEST_CUSTOMERS,
  TEST_EMPLOYEES,
} from '../../fixtures';

/**
 * Scenario 3.1: B2B Order with Net Terms
 *
 * Tests B2B order workflow including credit checks, tier discounts,
 * PO number capture, and net terms payment processing.
 *
 * @see 045G_POS_E2E_TESTING.md - Scenario 3.1
 */
test.describe('B2B Order with Net Terms', () => {
  test.beforeEach(async ({ page }) => {
    // Login as B2B sales rep
    await loginAsEmployee(page, TEST_EMPLOYEES.B2B_SALES.id, TEST_EMPLOYEES.B2B_SALES.pin);
    await startTransaction(page);
  });

  test('B2B-001: Select B2B customer loads company profile', async ({ page }) => {
    // Given: On new order
    // When: Search company name
    await page.getByPlaceholder(/customer|company|search/i).fill(TEST_CUSTOMERS.B2B_PREMIER.name);
    await page.keyboard.press('Enter');

    // Then: B2B profile loads with company info
    await expect(page.getByTestId('customer-profile')).toBeVisible();
    await expect(page.getByTestId('customer-name')).toContainText(TEST_CUSTOMERS.B2B_PREMIER.name);
    await expect(page.getByTestId('customer-type')).toContainText(/b2b/i);
  });

  test('B2B-002: View credit status shows limit and available', async ({ page }) => {
    // Given: B2B customer selected
    await attachCustomer(page, TEST_CUSTOMERS.B2B_PREMIER.email);

    // Then: Credit panel shows limit/available
    await expect(page.getByTestId('credit-limit')).toContainText('$50,000');
    await expect(page.getByTestId('available-credit')).toContainText('$45,000');
  });

  test('B2B-003: B2B pricing applies tier discount', async ({ page }) => {
    // Given: B2B customer selected (PREMIER = 10%)
    await attachCustomer(page, TEST_CUSTOMERS.B2B_PREMIER.email);

    // When: Add items
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku); // $149.99

    // Then: Tier discount applied
    // PREMIER = 10% off, so $149.99 * 0.9 = ~$134.99
    const lineTotal = await page.getByTestId('line-total-0').textContent();
    expect(lineTotal).toMatch(/\$134\.99|\$135\.0{1,2}/);
  });

  test('B2B-004: Select NET 60 payment terms', async ({ page }) => {
    // Given: B2B order ready
    await attachCustomer(page, TEST_CUSTOMERS.B2B_PREMIER.email);
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku);

    // When: Checkout and select NET 60
    await page.getByRole('button', { name: /checkout/i }).click();
    await page.getByRole('button', { name: /net terms|invoice/i }).click();
    await page.getByLabel(/payment terms/i).selectOption('NET_60');

    // Then: NET 60 is selected with due date
    await expect(page.getByTestId('payment-terms')).toContainText(/net.60/i);
    await expect(page.getByTestId('due-date')).toBeVisible();
  });

  test('B2B-005: Enter PO number for order', async ({ page }) => {
    // Given: B2B customer selected
    await attachCustomer(page, TEST_CUSTOMERS.B2B_PREMIER.email);
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku);

    // When: Checkout and enter PO
    await page.getByRole('button', { name: /checkout/i }).click();
    await page.getByRole('button', { name: /net terms|invoice/i }).click();
    await page.getByPlaceholder(/po number|purchase order/i).fill('PO-TEST-2024-001');

    // Then: PO is recorded
    await expect(page.getByTestId('po-number')).toContainText('PO-TEST-2024-001');
  });

  test('B2B-006: Order exceeding credit shows error', async ({ page }) => {
    // Given: B2B customer with low credit
    await attachCustomer(page, TEST_CUSTOMERS.B2B_LOW_CREDIT.email);

    // When: Add items exceeding available credit ($500)
    await addItem(page, TEST_PRODUCTS.BULK.sku); // $1,199.88 exceeds $500 available

    await page.getByRole('button', { name: /checkout/i }).click();
    await page.getByRole('button', { name: /net terms|invoice/i }).click();

    // Try to complete
    await page.getByRole('button', { name: /complete|process/i }).click();

    // Then: Credit exceeded error
    await expect(page.getByText(/exceeds credit|insufficient credit/i)).toBeVisible();
  });

  test('B2B-007: Complete B2B order generates invoice', async ({ page }) => {
    // Given: B2B order with valid credit
    await attachCustomer(page, TEST_CUSTOMERS.B2B_PREMIER.email);
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku);

    // When: Complete with net terms
    await page.getByRole('button', { name: /checkout/i }).click();
    await processNetTermsPayment(page, 'NET_30', 'PO-TEST-001');

    // Then: Invoice generated
    await expect(page.getByText(/invoice.*generated|order complete/i)).toBeVisible();
    await expect(page.getByTestId('invoice-number')).toBeVisible();
  });
});

test.describe('B2B Enterprise Requirements', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.B2B_SALES.id, TEST_EMPLOYEES.B2B_SALES.pin);
    await startTransaction(page);
  });

  test('ENTERPRISE account requires PO number', async ({ page }) => {
    // Given: ENTERPRISE B2B customer
    await attachCustomer(page, TEST_CUSTOMERS.B2B_ENTERPRISE.email);
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku);

    // When: Try to checkout without PO
    await page.getByRole('button', { name: /checkout/i }).click();
    await page.getByRole('button', { name: /net terms|invoice/i }).click();

    // Leave PO blank and try to complete
    await page.getByRole('button', { name: /complete|process/i }).click();

    // Then: PO required error
    await expect(page.getByText(/po.*required|purchase order required/i)).toBeVisible();
  });

  test('ENTERPRISE tier gets 15% discount', async ({ page }) => {
    // Given: ENTERPRISE customer
    await attachCustomer(page, TEST_CUSTOMERS.B2B_ENTERPRISE.email);

    // When: Add items
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku); // $149.99

    // Then: 15% discount applied
    // $149.99 * 0.85 = ~$127.49
    const lineTotal = await page.getByTestId('line-total-0').textContent();
    expect(lineTotal).toMatch(/\$127\.49|\$127\.5/);
  });

  test('ENTERPRISE has higher credit limit', async ({ page }) => {
    // Given: ENTERPRISE customer
    await attachCustomer(page, TEST_CUSTOMERS.B2B_ENTERPRISE.email);

    // Then: Shows higher credit limit
    await expect(page.getByTestId('credit-limit')).toContainText('$200,000');
  });
});

test.describe('B2B Credit Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.B2B_SALES.id, TEST_EMPLOYEES.B2B_SALES.pin);
    await startTransaction(page);
  });

  test('Credit utilization updates after order', async ({ page }) => {
    // Given: B2B customer with known credit
    await attachCustomer(page, TEST_CUSTOMERS.B2B_PREMIER.email);
    const initialCredit = 45000; // Known from mock data

    // When: Add items and complete order
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku);
    await page.getByRole('button', { name: /checkout/i }).click();
    await processNetTermsPayment(page, 'NET_30', 'PO-CREDIT-TEST');

    // Start new transaction
    await startTransaction(page);
    await attachCustomer(page, TEST_CUSTOMERS.B2B_PREMIER.email);

    // Then: Available credit should be reduced
    const creditText = await page.getByTestId('available-credit').textContent();
    const currentCredit = parseFloat(creditText?.replace(/[^0-9.]/g, '') || '0');

    // Credit should be less than initial (order amount deducted)
    expect(currentCredit).toBeLessThan(initialCredit);
  });

  test('Shows credit warning when nearing limit', async ({ page }) => {
    // Given: Customer with low available credit
    await attachCustomer(page, TEST_CUSTOMERS.B2B_LOW_CREDIT.email);

    // Then: Credit warning displayed
    await expect(page.getByTestId('credit-warning')).toBeVisible();
    await expect(page.getByText(/low credit|credit limit/i)).toBeVisible();
  });
});
