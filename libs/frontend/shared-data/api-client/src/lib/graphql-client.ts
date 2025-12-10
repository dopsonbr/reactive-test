import { createClient } from 'graphql-sse';
import { ApiError } from './errors';

// Use empty string for same-origin requests (nginx proxy), or explicit URLs for dev server
const CART_SERVICE_URL = import.meta.env.VITE_CART_API_URL || '';
const GRAPHQL_URL = CART_SERVICE_URL ? `${CART_SERVICE_URL}/graphql` : '/api/cart/graphql';

function getSessionValue(key: string, defaultValue: string): string {
  if (typeof sessionStorage === 'undefined') {
    return defaultValue;
  }
  return sessionStorage.getItem(key) || defaultValue;
}

/**
 * Returns custom headers required for cart-service GraphQL requests.
 * Note: Does NOT include Content-Type as graphql-sse sets it automatically.
 */
export function getGraphQLHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'x-store-number': getSessionValue('storeNumber', '1'),
    'x-order-number': getSessionValue('orderNumber', crypto.randomUUID()),
    'x-userid': getSessionValue('userId', 'GUEST1'),
    'x-sessionid': getSessionValue('sessionId', crypto.randomUUID()),
  };

  // Add auth token if present
  const authToken = getSessionValue('authToken', '');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
}

/**
 * Executes a GraphQL query or mutation.
 *
 * Uses a simple fetch wrapper per TanStack Query best practices.
 * Surfaces GraphQL errors as ApiError.
 */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getGraphQLHeaders(),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (json.errors?.length) {
    const error = json.errors[0];
    const validationErrors = error.extensions?.validationErrors;
    throw new ApiError(
      error.message,
      response.status === 200 ? 400 : response.status, // GraphQL returns 200 even for validation errors
      validationErrors ? JSON.stringify(validationErrors) : undefined
    );
  }

  return json.data as T;
}

/**
 * SSE subscription client for GraphQL subscriptions.
 *
 * Uses graphql-sse for SSE transport (cart-service doesn't support WebSocket).
 */
export const subscriptionClient = createClient({
  url: GRAPHQL_URL,
  headers: getGraphQLHeaders, // Function called per-request for fresh headers
});

/**
 * Subscribes to cart updates via SSE.
 *
 * Returns an unsubscribe function that should be called on cleanup.
 */
export function subscribeToCart<T>(
  cartId: string,
  onData: (event: T) => void,
  onError?: (error: Error) => void
): () => void {
  const unsubscribe = subscriptionClient.subscribe(
    {
      query: `
        subscription CartUpdated($cartId: ID!) {
          cartUpdated(cartId: $cartId) {
            eventType
            cartId
            timestamp
            cart {
              id
              storeNumber
              customerId
              products {
                sku
                name
                description
                unitPrice
                originalUnitPrice
                quantity
                availableQuantity
                imageUrl
                category
                lineTotal
                inStock
              }
              totals {
                subtotal
                discountTotal
                fulfillmentTotal
                taxTotal
                grandTotal
              }
              createdAt
              updatedAt
            }
          }
        }
      `,
      variables: { cartId },
    },
    {
      next: (result) => {
        if (result.data) {
          onData(result.data as T);
        }
      },
      error: (err) =>
        onError?.(err instanceof Error ? err : new Error(String(err))),
      complete: () => {},
    }
  );

  return unsubscribe;
}
