import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@reactive-platform/api-client';
import type { Cart, CartItem, AddToCartRequest, UpdateCartItemRequest } from '../types';

export const cartKeys = {
  all: ['cart'] as const,
  detail: (id: string) => [...cartKeys.all, id] as const,
};

function emptyCart(id: string): Cart {
  return {
    id,
    storeNumber: 0,
    products: [],
    totals: {
      subtotal: "0",
      discountTotal: "0",
      fulfillmentTotal: "0",
      taxTotal: "0",
      grandTotal: "0"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function getCartId(): string {
  if (typeof sessionStorage === 'undefined') {
    return 'server-cart';
  }
  let cartId = sessionStorage.getItem('cartId');
  if (!cartId) {
    cartId = crypto.randomUUID();
    sessionStorage.setItem('cartId', cartId);
  }
  return cartId;
}

export function useCart() {
  const cartId = getCartId();

  return useQuery({
    queryKey: cartKeys.detail(cartId),
    queryFn: async () => {
      try {
        // Backend now returns frontend-compatible shape
        const cart = await apiClient<Cart>(`/carts/${cartId}`);
        return cart;
      } catch (error) {
        // Return empty cart if not found
        if (error instanceof ApiError && error.status === 404) {
          return emptyCart(cartId);
        }
        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 3;
    },
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const cartId = getCartId();

  return useMutation({
    mutationFn: async (item: AddToCartRequest) => {
      const cart = await apiClient<Cart>(`/carts/${cartId}/products`, {
        method: 'POST',
        body: JSON.stringify(item),
      });
      return cart;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.detail(cartId), data);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const cartId = getCartId();

  return useMutation({
    mutationFn: async ({ sku, quantity }: UpdateCartItemRequest) => {
      const cart = await apiClient<Cart>(`/carts/${cartId}/products/${sku}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
      return cart;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.detail(cartId), data);
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const cartId = getCartId();

  return useMutation({
    mutationFn: async (sku: number) => {
      const cart = await apiClient<Cart>(`/carts/${cartId}/products/${sku}`, {
        method: 'DELETE',
      });
      return cart;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.detail(cartId), data);
    },
  });
}
