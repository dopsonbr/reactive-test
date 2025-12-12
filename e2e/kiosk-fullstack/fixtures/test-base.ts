import { test as base, expect, Page } from '@playwright/test';

// Test products with known SKUs (matching real backend direct lookup API)
export const TEST_PRODUCTS = {
  HEADPHONES: { sku: '100001', name: 'Wireless Bluetooth Headphones', price: 129.99 },
  SMART_TV: { sku: '100002', name: '4K Ultra HD Smart TV 55"', price: 699.99 },
  SPEAKER: { sku: '100003', name: 'Portable Bluetooth Speaker', price: 59.99 },
};

// Helper to add a product by using the manual SKU entry dialog
export async function addProductBySku(page: Page, sku: string) {
  // Click "Enter SKU Manually" button
  await page.getByRole('button', { name: /enter sku manually/i }).click();

  // Wait for keypad dialog to appear (look for numeric keypad)
  await expect(page.getByRole('group', { name: /keypad/i })).toBeVisible();

  // Type SKU using the keypad buttons
  for (const digit of sku) {
    // Click the digit button within the keypad group
    await page.getByRole('group', { name: /keypad/i }).getByRole('button', { name: digit, exact: true }).click();
  }

  // Submit - wait for it to be enabled after entering digits
  const submitBtn = page.getByRole('button', { name: /submit/i });
  await expect(submitBtn).toBeEnabled({ timeout: 2000 });
  await submitBtn.click();

  // Wait for the keypad to close (cart should update)
  await expect(page.getByRole('group', { name: /keypad/i })).not.toBeVisible({ timeout: 10000 });
}

// Legacy helper - keep for compatibility but use addProductBySku instead
export async function scanProduct(page: Page, sku: string) {
  await addProductBySku(page, sku);
}

// Helper to start a kiosk session
export async function startSession(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /touch to start/i }).click();
  await expect(page.getByText(/scan your items/i)).toBeVisible();
}

// Extended test with fixtures
export const test = base.extend<{
  startSession: () => Promise<void>;
}>({
  startSession: async ({ page }, use) => {
    const start = async () => {
      await startSession(page);
    };
    await use(start);
  },
});

export { expect };
