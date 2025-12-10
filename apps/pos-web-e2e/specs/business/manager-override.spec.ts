import { test, expect } from '@playwright/test';
import {
  loginAsEmployee,
  startTransaction,
  addItem,
  openMarkdownDialog,
  TEST_PRODUCTS,
  TEST_EMPLOYEES,
} from '../../fixtures';

/**
 * Scenario 1.4: Manager Override for Markdown
 *
 * Tests the workflow when an associate requests a markdown that exceeds
 * their permission tier, requiring manager authorization.
 *
 * @see 045G_POS_E2E_TESTING.md - Scenario 1.4
 */
test.describe('Manager Override for Markdown', () => {
  test.beforeEach(async ({ page }) => {
    // Login as ASSOCIATE (15% max markdown)
    await loginAsEmployee(page, TEST_EMPLOYEES.ASSOCIATE.id, TEST_EMPLOYEES.ASSOCIATE.pin);
    await startTransaction(page);
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku); // $149.99
  });

  test('MO-001: Exceeding limit triggers override dialog', async ({ page }) => {
    // Given: ASSOCIATE logged in (max 15%)
    await openMarkdownDialog(page, 0);

    // When: Request 25% markdown
    await page.getByLabel(/percentage/i).check();
    await page.getByPlaceholder(/enter percentage/i).fill('25');
    await page.getByLabel(/reason/i).selectOption('CUSTOMER_SERVICE');
    await page.getByRole('button', { name: /apply/i }).click();

    // Then: Override dialog appears
    await expect(page.getByText(/manager authorization required/i)).toBeVisible();
    await expect(page.getByText(/your limit.*15%/i)).toBeVisible();
    await expect(page.getByText(/requested.*25%/i)).toBeVisible();
  });

  test('MO-002: Valid manager credentials approve override', async ({ page }) => {
    // Given: Override dialog open
    await openMarkdownDialog(page, 0);
    await page.getByLabel(/percentage/i).check();
    await page.getByPlaceholder(/enter percentage/i).fill('25');
    await page.getByLabel(/reason/i).selectOption('CUSTOMER_SERVICE');
    await page.getByRole('button', { name: /apply/i }).click();

    // When: Enter valid manager credentials
    await page.getByPlaceholder(/manager id/i).fill(TEST_EMPLOYEES.MANAGER.id);
    await page.getByPlaceholder(/manager pin|pin/i).fill(TEST_EMPLOYEES.MANAGER.pin);
    await page.getByRole('button', { name: /authorize/i }).click();

    // Then: Authorization succeeds, markdown applied
    await expect(page.getByText(new RegExp(`authorized by.*${TEST_EMPLOYEES.MANAGER.name}`, 'i'))).toBeVisible();
    await expect(page.getByTestId('markdown-indicator-0')).toContainText('25%');
  });

  test('MO-003: Invalid manager ID shows error', async ({ page }) => {
    // Given: Override dialog open
    await openMarkdownDialog(page, 0);
    await page.getByLabel(/percentage/i).check();
    await page.getByPlaceholder(/enter percentage/i).fill('25');
    await page.getByLabel(/reason/i).selectOption('CUSTOMER_SERVICE');
    await page.getByRole('button', { name: /apply/i }).click();

    // When: Enter fake manager ID
    await page.getByPlaceholder(/manager id/i).fill('FAKEID');
    await page.getByPlaceholder(/manager pin|pin/i).fill('0000');
    await page.getByRole('button', { name: /authorize/i }).click();

    // Then: Error message
    await expect(page.getByText(/not found|invalid/i)).toBeVisible();
  });

  test('MO-004: Wrong PIN shows credential error', async ({ page }) => {
    // Given: Override dialog open
    await openMarkdownDialog(page, 0);
    await page.getByLabel(/percentage/i).check();
    await page.getByPlaceholder(/enter percentage/i).fill('25');
    await page.getByLabel(/reason/i).selectOption('CUSTOMER_SERVICE');
    await page.getByRole('button', { name: /apply/i }).click();

    // When: Enter wrong PIN
    await page.getByPlaceholder(/manager id/i).fill(TEST_EMPLOYEES.MANAGER.id);
    await page.getByPlaceholder(/manager pin|pin/i).fill('0000');
    await page.getByRole('button', { name: /authorize/i }).click();

    // Then: Error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('MO-005: Supervisor cannot approve beyond their tier', async ({ page }) => {
    // Given: Request 60% markdown (needs MANAGER or higher, Supervisor max is 25%)
    await openMarkdownDialog(page, 0);
    await page.getByLabel(/percentage/i).check();
    await page.getByPlaceholder(/enter percentage/i).fill('60');
    await page.getByLabel(/reason/i).selectOption('MANAGER_DISCRETION');
    await page.getByRole('button', { name: /apply/i }).click();

    // When: Supervisor tries to approve (max 25%)
    await page.getByPlaceholder(/manager id/i).fill(TEST_EMPLOYEES.SUPERVISOR.id);
    await page.getByPlaceholder(/manager pin|pin/i).fill(TEST_EMPLOYEES.SUPERVISOR.pin);
    await page.getByRole('button', { name: /authorize/i }).click();

    // Then: Error - exceeds supervisor authority
    await expect(page.getByText(/exceeds authority/i)).toBeVisible();
  });

  test('MO-006: Markdown within limit does not require override', async ({ page }) => {
    // Given: ASSOCIATE logged in (max 15%)
    await openMarkdownDialog(page, 0);

    // When: Request 10% markdown (within limit)
    await page.getByLabel(/percentage/i).check();
    await page.getByPlaceholder(/enter percentage/i).fill('10');
    await page.getByLabel(/reason/i).selectOption('DAMAGED_ITEM');
    await page.getByRole('button', { name: /apply/i }).click();

    // Then: Markdown applied directly without override dialog
    await expect(page.getByTestId('markdown-indicator-0')).toContainText('10%');
    // Override dialog should NOT appear
    await expect(page.getByText(/manager authorization required/i)).not.toBeVisible();
  });
});

test.describe('Manager Override - Manager Self-Approval', () => {
  test('MO-007: Manager can apply markdown within their limit directly', async ({ page }) => {
    // Given: Login as MANAGER (50% max)
    await loginAsEmployee(page, TEST_EMPLOYEES.MANAGER.id, TEST_EMPLOYEES.MANAGER.pin);
    await startTransaction(page);
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku);

    // When: Request 40% markdown (within Manager limit)
    await openMarkdownDialog(page, 0);
    await page.getByLabel(/percentage/i).check();
    await page.getByPlaceholder(/enter percentage/i).fill('40');
    await page.getByLabel(/reason/i).selectOption('MANAGER_DISCRETION');
    await page.getByRole('button', { name: /apply/i }).click();

    // Then: Markdown applied directly
    await expect(page.getByTestId('markdown-indicator-0')).toContainText('40%');
    // No override dialog
    await expect(page.getByText(/manager authorization required/i)).not.toBeVisible();
  });

  test('MO-008: Manager exceeding their limit needs higher approval', async ({ page }) => {
    // Given: Login as MANAGER (50% max)
    await loginAsEmployee(page, TEST_EMPLOYEES.MANAGER.id, TEST_EMPLOYEES.MANAGER.pin);
    await startTransaction(page);
    await addItem(page, TEST_PRODUCTS.WIDGET_PRO.sku);

    // When: Request 75% markdown (exceeds Manager limit of 50%)
    await openMarkdownDialog(page, 0);
    await page.getByLabel(/percentage/i).check();
    await page.getByPlaceholder(/enter percentage/i).fill('75');
    await page.getByLabel(/reason/i).selectOption('MANAGER_DISCRETION');
    await page.getByRole('button', { name: /apply/i }).click();

    // Then: Override dialog appears (needs ADMIN)
    await expect(page.getByText(/authorization required/i)).toBeVisible();
    await expect(page.getByText(/your limit.*50%/i)).toBeVisible();
  });
});
