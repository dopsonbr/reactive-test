import { test as base, expect, Page } from '@playwright/test';

// Test products with known SKUs (8-digit format for scanner)
export const TEST_PRODUCTS = {
  PRODUCT_001: { sku: '10000001', name: 'Widget Pro', price: 149.99 },
  PRODUCT_002: { sku: '10000002', name: 'Widget Standard', price: 79.99 },
  PRODUCT_003: { sku: '10000003', name: 'Accessory Kit', price: 29.99 },
};

// Helper to scan a product by simulating barcode scanner input
export async function scanProduct(page: Page, sku: string) {
  await page.keyboard.type(sku, { delay: 50 });
  await page.keyboard.press('Enter');
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
