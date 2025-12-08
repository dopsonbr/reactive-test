import { test as base, expect, Page, Response } from '@playwright/test';

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
 * This helps catch backend issues early in E2E tests.
 */
export const test = base.extend<{
  apiErrors: ApiError[];
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
});

export { expect };
