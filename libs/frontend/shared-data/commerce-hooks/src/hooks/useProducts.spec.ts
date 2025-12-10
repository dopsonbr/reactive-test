import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient, createWrapper } from '../test-utils';
import { useProducts, useProduct, productKeys } from './useProducts';
import type { Product, ProductSearchResult } from '../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('useProducts', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('should fetch products list', async () => {
    const mockResult: ProductSearchResult = {
      products: [
        {
          sku: 'SKU-001',
          name: 'Test Product',
          description: 'Test Description',
          price: 9.99,
          category: 'test',
          inStock: true,
        },
      ],
      total: 1,
      page: 0,
      totalPages: 1,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResult);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/products'),
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should use correct query key', () => {
    const params = { category: 'electronics', page: 1 };
    const key = productKeys.list(params);
    expect(key).toEqual(['products', 'list', params]);
  });
});

describe('useProduct', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('should fetch single product', async () => {
    const mockProduct: Product = {
      sku: 'SKU-001',
      name: 'Test Product',
      description: 'Test Description',
      price: 9.99,
      category: 'test',
      inStock: true,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProduct,
    });

    const { result } = renderHook(() => useProduct('SKU-001'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockProduct);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/products/SKU-001'),
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should use correct query key', () => {
    const sku = 'SKU-001';
    const key = productKeys.detail(sku);
    expect(key).toEqual(['products', 'detail', sku]);
  });
});
