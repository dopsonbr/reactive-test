import { test as base, expect } from '@playwright/test';

// Test employee credentials that work with real backend
export const TEST_EMPLOYEE = {
  username: 'testassociate',
  storeNumber: '100',
};

// Test products with known SKUs (matching real backend direct lookup API)
export const TEST_PRODUCTS = {
  HEADPHONES: { sku: '100001', name: 'Wireless Bluetooth Headphones', price: 129.99 },
  SMART_TV: { sku: '100002', name: '4K Ultra HD Smart TV 55"', price: 699.99 },
  SPEAKER: { sku: '100003', name: 'Portable Bluetooth Speaker', price: 59.99 },
  KEYBOARD: { sku: '100004', name: 'Wireless Mechanical Keyboard', price: 89.99 },
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
