import { test as base, expect, Response, Request } from '@playwright/test';

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
 * Interface for tracking GraphQL requests
 */
interface GraphQLRequest {
  url: string;
  operationName?: string;
  query?: string;
  timestamp: number;
}

/**
 * Interface for tracking SSE connections
 */
interface SSEConnection {
  url: string;
  timestamp: number;
  events: string[];
}

/**
 * Extended test fixture that automatically fails tests when API errors (5xx) occur.
 * Also provides GraphQL and SSE monitoring helpers for subscription testing.
 */
export const test = base.extend<{
  apiErrors: ApiError[];
  graphqlRequests: GraphQLRequest[];
  sseConnections: SSEConnection[];
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

  graphqlRequests: async ({ page }, use) => {
    const requests: GraphQLRequest[] = [];

    // Monitor GraphQL requests
    const requestHandler = async (request: Request) => {
      const url = request.url();
      if (url.includes('/graphql') && request.method() === 'POST') {
        try {
          const postData = request.postData();
          if (postData) {
            const parsed = JSON.parse(postData);
            requests.push({
              url,
              operationName: parsed.operationName,
              query: parsed.query?.substring(0, 200), // Truncate for logging
              timestamp: Date.now(),
            });
          }
        } catch {
          requests.push({ url, timestamp: Date.now() });
        }
      }
    };

    page.on('request', requestHandler);
    await use(requests);
  },

  sseConnections: async ({ page }, use) => {
    const connections: SSEConnection[] = [];

    // Monitor SSE connections (EventSource)
    const requestHandler = (request: Request) => {
      const acceptHeader = request.headers()['accept'];
      const url = request.url();

      // SSE connections typically have text/event-stream accept header
      // or use GET method to /graphql with subscription query
      if (
        acceptHeader?.includes('text/event-stream') ||
        (url.includes('/graphql') && request.method() === 'GET')
      ) {
        connections.push({
          url,
          timestamp: Date.now(),
          events: [],
        });
        console.log(`[SSE] Connection established: ${url}`);
      }
    };

    page.on('request', requestHandler);
    await use(connections);
  },
});

export { expect };
