import { test as base, expect, Response } from '@playwright/test';
import { TestDataTracker, generateUniqueSku, generateTestPrefix } from './test-data';

/**
 * Interface for tracking API errors during tests
 */
interface ApiError {
  url: string;
  status: number;
  statusText: string;
  method: string;
  body?: string;
}

/**
 * Extended test fixture that automatically fails tests when API errors (5xx) occur.
 * Provides a logged-in session for all tests.
 * Includes test data tracking for cleanup.
 */
export const test = base.extend<{
  apiErrors: ApiError[];
  authenticatedPage: typeof base;
  testData: TestDataTracker;
  uniqueSku: () => number;
  testPrefix: string;
}>({
  apiErrors: async ({ page }, use) => {
    const errors: ApiError[] = [];

    // Monitor all responses for server errors
    const responseHandler = async (response: Response) => {
      const status = response.status();
      if (status >= 500) {
        let body: string | undefined;
        try {
          body = await response.text();
        } catch {
          // Response body might not be readable
        }

        const error: ApiError = {
          url: response.url(),
          status,
          statusText: response.statusText(),
          method: response.request().method(),
          body,
        };

        errors.push(error);
        console.error(
          `[API ERROR] ${error.method} ${error.url} - ${error.status} ${error.statusText}`,
          body ? `\nResponse: ${body}` : ''
        );
      }
    };

    page.on('response', responseHandler);

    // Run the test
    await use(errors);

    // After test completes, fail if any API errors occurred
    if (errors.length > 0) {
      const errorSummary = errors
        .map(
          (e) =>
            `  - ${e.method} ${e.url}: ${e.status} ${e.statusText}${e.body ? `\n    Response: ${e.body}` : ''}`
        )
        .join('\n');

      throw new Error(
        `Test failed due to ${errors.length} API error(s):\n${errorSummary}\n\n` +
          'Fix the backend errors or update the test to handle expected error scenarios.'
      );
    }
  },

  authenticatedPage: async ({ page }, use) => {
    // Navigate to login and authenticate as admin
    await page.goto('/login');

    // Wait for login page to load
    await expect(page.getByRole('heading', { name: 'Merchant Portal' })).toBeVisible({ timeout: 30000 });

    // Click on admin1 user (full access)
    await page.getByRole('button').filter({ hasText: 'admin1' }).click();

    // Wait for navigation to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await use(base);
  },

  /**
   * Test data tracker for cleanup after tests
   * Tracks created SKUs and cleans them up after the test completes
   */
  testData: async ({}, use) => {
    const tracker = new TestDataTracker();
    await use(tracker);
    // Cleanup after test completes
    await tracker.cleanup();
  },

  /**
   * Generate unique SKUs for test isolation
   * Each call returns a new unique SKU
   */
  uniqueSku: async ({}, use) => {
    await use(generateUniqueSku);
  },

  /**
   * Unique prefix for this test run
   * Use for naming test entities to identify them
   */
  testPrefix: async ({}, use) => {
    await use(generateTestPrefix());
  },
});

export { expect };

// Re-export test data utilities
export { testApi, KNOWN_TEST_DATA, ensureTestDataExists } from './test-data';

/**
 * Helper to login as a specific user type
 */
export async function loginAs(page: import('@playwright/test').Page, userType: 'merchant1' | 'pricer1' | 'inventory1' | 'admin1') {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Merchant Portal' })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button').filter({ hasText: userType }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}
