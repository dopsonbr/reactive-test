import { ApiError } from './errors';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

const PRODUCT_SERVICE_URL = import.meta.env.VITE_PRODUCT_API_URL || 'http://localhost:8080';
const CART_SERVICE_URL = import.meta.env.VITE_CART_API_URL || 'http://localhost:8081';

function getSessionValue(key: string, defaultValue: string): string {
  if (typeof sessionStorage === 'undefined') {
    return defaultValue;
  }
  return sessionStorage.getItem(key) || defaultValue;
}

function getBaseUrl(endpoint: string): string {
  // Route to appropriate backend service based on endpoint
  if (endpoint.startsWith('/carts')) {
    return CART_SERVICE_URL;
  }
  return PRODUCT_SERVICE_URL;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  const baseUrl = getBaseUrl(endpoint);
  const url = new URL(endpoint, baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
  }

  // Add required headers
  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('x-store-number', getSessionValue('storeNumber', '1'));
  headers.set('x-order-number', getSessionValue('orderNumber', crypto.randomUUID()));
  headers.set('x-userid', getSessionValue('userId', 'GUEST1'));
  headers.set('x-sessionid', getSessionValue('sessionId', crypto.randomUUID()));

  const response = await fetch(url.toString(), { ...fetchOptions, headers });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      body.message || response.statusText,
      response.status,
      body.code
    );
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}
