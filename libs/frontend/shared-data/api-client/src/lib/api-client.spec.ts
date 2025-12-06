import { apiClient } from './api-client';
import { ApiError } from './errors';

describe('apiClient', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = mockFetch;
  });

  it('should make GET request and return JSON data', async () => {
    const mockData = { id: 1, name: 'Test Product' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockData)),
    });

    const result = await apiClient<typeof mockData>('/products/1');

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/products/1',
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
  });

  it('should route cart endpoints to cart service', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('{}'),
    });

    await apiClient('/carts/123');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8081/carts/123',
      expect.any(Object)
    );
  });

  it('should append query params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('{}'),
    });

    await apiClient('/products/search', {
      params: { q: 'test', category: 'electronics' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/products/search?q=test&category=electronics',
      expect.any(Object)
    );
  });

  it('should throw ApiError on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ message: 'Product not found', code: 'PRODUCT_NOT_FOUND' }),
    });

    let thrownError: unknown;
    try {
      await apiClient('/products/999');
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(ApiError);
    expect(thrownError).toMatchObject({
      message: 'Product not found',
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
    });
  });

  it('should handle empty response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(''),
    });

    const result = await apiClient('/carts/123/products/SKU-001', {
      method: 'DELETE',
    });

    expect(result).toEqual({});
  });

  it('should set required headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('{}'),
    });

    await apiClient('/products/1');

    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs[1].headers;

    expect(headers.get('x-store-number')).toBe('1');
    expect(headers.get('x-userid')).toBe('GUEST1');
    expect(headers.has('x-order-number')).toBe(true);
    expect(headers.has('x-sessionid')).toBe(true);
  });
});
