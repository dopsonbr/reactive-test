/**
 * Transaction E2E test fixtures for POS
 * @see 045G_POS_E2E_TESTING.md
 */

import type { Page, Locator } from '@playwright/test';

/**
 * Test product SKUs
 */
export const TEST_PRODUCTS = {
  WIDGET_PRO: { sku: 'SKU-WIDGET-001', name: 'Widget Pro XL', price: 149.99 },
  WIDGET_STANDARD: { sku: 'SKU-WIDGET-002', name: 'Widget Standard', price: 79.99 },
  ACCESSORY: { sku: 'SKU-ACC-001', name: 'Widget Accessory Pack', price: 29.99 },
  BULK: { sku: 'SKU-BULK-001', name: 'Widget Case (24 units)', price: 1199.88 },
  SERVICE: { sku: 'SKU-INSTALL-001', name: 'Pro Installation Service', price: 199.99 },
  DAMAGED: { sku: 'SKU-DAMAGED-001', name: 'Widget Pro (Damaged Box)', price: 149.99 },
  CLEARANCE: { sku: 'SKU-CLEARANCE-001', name: 'Widget Classic (Discontinued)', price: 49.99 },
} as const;

/**
 * Start a new transaction
 */
export async function startTransaction(page: Page): Promise<void> {
  // Navigate to transaction page if not already there
  if (!page.url().includes('/transaction')) {
    await page.goto('/transaction');
  }

  // Check if there's an existing transaction that needs to be cleared
  const existingItems = page.getByTestId('cart-item-count');
  if ((await existingItems.count()) > 0) {
    const count = await existingItems.textContent();
    if (count && parseInt(count) > 0) {
      // Clear existing transaction
      await page.getByRole('button', { name: /new|clear/i }).click();
      // Confirm if dialog appears
      const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
      if ((await confirmButton.count()) > 0) {
        await confirmButton.click();
      }
    }
  }

  // Wait for empty cart state
  await page.waitForSelector('[data-testid="empty-cart"]', { timeout: 3000 }).catch(() => {
    // Cart might already be empty
  });
}

/**
 * Add item to cart by SKU
 */
export async function addItem(page: Page, sku: string, quantity = 1): Promise<void> {
  const skuInput = page.getByPlaceholder(/scan|enter sku/i);

  // Enter SKU
  await skuInput.fill(sku);
  await page.keyboard.press('Enter');

  // Wait for item to appear in cart
  await page.waitForSelector(`[data-testid="cart-item"][data-sku="${sku}"]`, {
    timeout: 3000,
  });

  // Adjust quantity if needed
  if (quantity > 1) {
    const qtyInput = page.locator(`[data-testid="qty-input"][data-sku="${sku}"]`);
    await qtyInput.fill(String(quantity));
    await qtyInput.blur();
  }
}

/**
 * Update item quantity
 */
export async function updateQuantity(
  page: Page,
  itemIndex: number,
  quantity: number
): Promise<void> {
  const qtyInput = page.getByTestId(`qty-input-${itemIndex}`);
  await qtyInput.fill(String(quantity));
  await qtyInput.blur();

  // Wait for total to update
  await page.waitForTimeout(200);
}

/**
 * Remove item from cart
 */
export async function removeItem(page: Page, itemIndex: number): Promise<void> {
  await page.getByTestId(`remove-item-${itemIndex}`).click();

  // Confirm if dialog appears
  const confirmButton = page.getByRole('button', { name: /confirm|remove|yes/i });
  if ((await confirmButton.count()) > 0) {
    await confirmButton.click();
  }
}

/**
 * Get cart totals
 */
export async function getCartTotals(page: Page): Promise<{
  subtotal: string;
  tax: string;
  total: string;
  itemCount: number;
}> {
  const subtotal = (await page.getByTestId('cart-subtotal').textContent()) || '$0.00';
  const tax = (await page.getByTestId('cart-tax').textContent()) || '$0.00';
  const total = (await page.getByTestId('cart-total').textContent()) || '$0.00';
  const itemCountText = (await page.getByTestId('cart-item-count').textContent()) || '0';
  const itemCount = parseInt(itemCountText.replace(/\D/g, '')) || 0;

  return { subtotal, tax, total, itemCount };
}

/**
 * Get cart item locator
 */
export function getCartItem(page: Page, index: number): Locator {
  return page.getByTestId(`cart-item-${index}`);
}

/**
 * Open markdown dialog for item
 */
export async function openMarkdownDialog(page: Page, itemIndex: number): Promise<void> {
  await page.getByTestId(`markdown-button-${itemIndex}`).click();
  await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
}

/**
 * Apply markdown to item
 */
export async function applyMarkdown(
  page: Page,
  itemIndex: number,
  type: 'PERCENTAGE' | 'FIXED_AMOUNT',
  value: number,
  reason: string
): Promise<void> {
  await openMarkdownDialog(page, itemIndex);

  // Select type
  if (type === 'PERCENTAGE') {
    await page.getByLabel('Percentage').check();
  } else {
    await page.getByLabel('Fixed Amount').check();
  }

  // Enter value
  await page.getByPlaceholder(/enter (percentage|amount)/i).fill(String(value));

  // Select reason
  await page.getByLabel('Reason').selectOption(reason);

  // Apply
  await page.getByRole('button', { name: 'Apply' }).click();
}

/**
 * Proceed to checkout
 */
export async function proceedToCheckout(page: Page): Promise<void> {
  await page.getByRole('button', { name: /checkout|pay/i }).click();
  await page.waitForSelector('[data-testid="payment-panel"]', { timeout: 3000 });
}

/**
 * Void current transaction
 */
export async function voidTransaction(page: Page, reason: string): Promise<void> {
  await page.getByRole('button', { name: /void|cancel/i }).click();

  // Enter reason
  await page.getByPlaceholder(/reason/i).fill(reason);

  // Confirm
  await page.getByRole('button', { name: /confirm|void/i }).click();
}
