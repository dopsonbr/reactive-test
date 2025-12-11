import { test as base, expect } from '@playwright/test';

// Test employee credentials that work with real backend
export const TEST_EMPLOYEE = {
  username: 'testassociate',
  storeNumber: '100',
};

// Test products with known SKUs
export const TEST_PRODUCTS = {
  SKU_001: { sku: 'SKU-001', name: 'Widget Pro', price: 149.99 },
  SKU_002: { sku: 'SKU-002', name: 'Widget Standard', price: 79.99 },
  SKU_003: { sku: 'SKU-003', name: 'Accessory Kit', price: 29.99 },
  HEADPHONES: { sku: '10000003', name: 'Wireless Headphones', price: 199.99 },
};

// Extended test with fixtures
export const test = base.extend<{
  loginAsEmployee: () => Promise<void>;
}>({
  loginAsEmployee: async ({ page }, use) => {
    const login = async () => {
      await page.goto('/');
      await page.getByPlaceholder('Enter your username').fill(TEST_EMPLOYEE.username);
      await page.getByPlaceholder('1-2000').fill(TEST_EMPLOYEE.storeNumber);
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');
    };
    await use(login);
  },
});

export { expect };
