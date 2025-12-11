/**
 * Test Data Management for E2E Tests
 *
 * This module provides utilities for creating isolated test data and cleaning up
 * after tests to prevent state pollution between test runs.
 *
 * Strategy:
 * 1. Use unique prefixes/suffixes for test data (timestamp-based SKUs)
 * 2. Track created resources for cleanup
 * 3. Use API calls for direct data manipulation when needed
 */

// Base URL for API calls (matches Docker compose services)
const MERCHANDISE_API = 'http://localhost:8091/api/merchandise';
const PRICE_API = 'http://localhost:8092/api/price';
const INVENTORY_API = 'http://localhost:8093/api/inventory';

// Generate unique SKU based on timestamp + random suffix
export function generateUniqueSku(): number {
  // Use last 9 digits of timestamp + random to avoid collision
  const base = Date.now() % 1_000_000_000;
  const random = Math.floor(Math.random() * 1000);
  return base + random;
}

// Generate a unique test prefix for naming
export function generateTestPrefix(): string {
  return `E2E-${Date.now().toString(36)}`;
}

/**
 * Test data cleanup tracker
 * Tracks created resources so they can be cleaned up after tests
 */
export class TestDataTracker {
  private createdSkus: number[] = [];

  trackSku(sku: number): void {
    this.createdSkus.push(sku);
  }

  getTrackedSkus(): number[] {
    return [...this.createdSkus];
  }

  async cleanup(): Promise<void> {
    console.log(`[TestDataTracker] Cleaning up ${this.createdSkus.length} test SKUs`);

    for (const sku of this.createdSkus) {
      try {
        // Try to delete from merchandise service (this is the source of truth)
        await fetch(`${MERCHANDISE_API}/${sku}`, { method: 'DELETE' });
      } catch (err) {
        console.warn(`[TestDataTracker] Failed to cleanup SKU ${sku}:`, err);
      }
    }

    this.createdSkus = [];
  }
}

/**
 * Direct API helpers for test setup/teardown
 * These bypass the UI to quickly set up test conditions
 */
export const testApi = {
  /**
   * Create a product directly via API
   */
  async createProduct(data: {
    sku: number;
    name: string;
    description?: string;
    category?: string;
    suggestedRetailPrice: number;
  }): Promise<boolean> {
    try {
      const response = await fetch(MERCHANDISE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Delete a product directly via API
   */
  async deleteProduct(sku: number): Promise<boolean> {
    try {
      const response = await fetch(`${MERCHANDISE_API}/${sku}`, {
        method: 'DELETE',
      });
      return response.ok || response.status === 404;
    } catch {
      return false;
    }
  },

  /**
   * Update inventory quantity directly via API
   */
  async setInventory(sku: number, quantity: number): Promise<boolean> {
    try {
      const response = await fetch(`${INVENTORY_API}/${sku}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableQuantity: quantity }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Update price directly via API
   */
  async setPrice(sku: number, price: number, originalPrice?: number): Promise<boolean> {
    try {
      const response = await fetch(`${PRICE_API}/${sku}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price,
          originalPrice: originalPrice ?? null,
          currency: 'USD',
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Get a product by SKU
   */
  async getProduct(sku: number): Promise<unknown | null> {
    try {
      const response = await fetch(`${MERCHANDISE_API}/${sku}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  },
};

/**
 * Seed data for known test scenarios
 * These SKUs are predictable and can be used across test runs
 */
export const KNOWN_TEST_DATA = {
  // SKU range reserved for E2E tests: 9000000-9999999
  E2E_PRODUCT_1: 9000001,
  E2E_PRODUCT_2: 9000002,
  E2E_PRODUCT_3: 9000003,
  E2E_LOW_STOCK: 9000010,
  E2E_OUT_OF_STOCK: 9000011,
  E2E_ON_SALE: 9000020,
};

/**
 * Ensure known test data exists before running tests
 */
export async function ensureTestDataExists(): Promise<void> {
  console.log('[TestData] Ensuring test data exists...');

  // Create standard test products if they don't exist
  const testProducts = [
    { sku: KNOWN_TEST_DATA.E2E_PRODUCT_1, name: 'E2E Test Product 1', suggestedRetailPrice: 19.99 },
    { sku: KNOWN_TEST_DATA.E2E_PRODUCT_2, name: 'E2E Test Product 2', suggestedRetailPrice: 29.99 },
    { sku: KNOWN_TEST_DATA.E2E_PRODUCT_3, name: 'E2E Test Product 3', suggestedRetailPrice: 39.99 },
    { sku: KNOWN_TEST_DATA.E2E_LOW_STOCK, name: 'E2E Low Stock Item', suggestedRetailPrice: 9.99 },
    { sku: KNOWN_TEST_DATA.E2E_OUT_OF_STOCK, name: 'E2E Out of Stock Item', suggestedRetailPrice: 14.99 },
    { sku: KNOWN_TEST_DATA.E2E_ON_SALE, name: 'E2E Sale Item', suggestedRetailPrice: 49.99 },
  ];

  for (const product of testProducts) {
    const exists = await testApi.getProduct(product.sku);
    if (!exists) {
      console.log(`[TestData] Creating test product: ${product.name}`);
      await testApi.createProduct(product);
    }
  }

  // Set up special inventory states
  await testApi.setInventory(KNOWN_TEST_DATA.E2E_LOW_STOCK, 5);
  await testApi.setInventory(KNOWN_TEST_DATA.E2E_OUT_OF_STOCK, 0);

  // Set up sale price
  await testApi.setPrice(KNOWN_TEST_DATA.E2E_ON_SALE, 24.99, 49.99);

  console.log('[TestData] Test data ready');
}
