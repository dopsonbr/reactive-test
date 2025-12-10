import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient, createWrapper } from '../test-utils';
import { useCart, useAddToCart, cartKeys, type CartScope } from './useCart';
import type { Cart } from '../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('useCart', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  const scope: CartScope = {
    cartId: 'cart-123',
    headers: { 'x-store-number': '1' },
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('should fetch cart data', async () => {
    const mockCart: Cart = {
      id: 'cart-123',
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      itemCount: 0,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCart,
    });

    const { result } = renderHook(() => useCart(scope), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCart);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/carts/cart-123'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-store-number': '1',
        }),
      })
    );
  });

  it('should not fetch if cartId is empty', () => {
    const emptyScope: CartScope = { cartId: '' };

    const { result } = renderHook(() => useCart(emptyScope), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should use correct query key', () => {
    const cartId = 'cart-123';
    const key = cartKeys.detail(cartId);
    expect(key).toEqual(['cart', cartId]);
  });
});

describe('useAddToCart', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  const scope: CartScope = {
    cartId: 'cart-123',
    headers: { 'x-store-number': '1' },
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('should add item to cart', async () => {
    const mockCart: Cart = {
      id: 'cart-123',
      items: [
        {
          sku: 'SKU-001',
          name: 'Test Product',
          price: 9.99,
          quantity: 1,
          lineTotal: 9.99,
        },
      ],
      subtotal: 9.99,
      tax: 0.8,
      total: 10.79,
      itemCount: 1,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCart,
    });

    const { result } = renderHook(() => useAddToCart(scope), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ sku: 'SKU-001', quantity: 1 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCart);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/carts/cart-123/items'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ sku: 'SKU-001', quantity: 1 }),
      })
    );
  });
});
