import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@reactive-platform/api-client';
import type { Cart, AddToCartRequest, UpdateCartItemRequest } from '../types';

export const cartKeys = {
  all: ['cart'] as const,
  detail: (id: string) => [...cartKeys.all, id] as const,
};

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
        return await apiClient<Cart>(`/carts/${cartId}`);
      } catch (error) {
        // Return empty cart if not found
        if (error instanceof ApiError && error.status === 404) {
          return {
            id: cartId,
            items: [],
            subtotal: 0,
            tax: 0,
            total: 0,
          } as Cart;
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
    mutationFn: (item: AddToCartRequest) =>
      apiClient<Cart>(`/carts/${cartId}/products`, {
        method: 'POST',
        body: JSON.stringify(item),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.detail(cartId), data);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const cartId = getCartId();

  return useMutation({
    mutationFn: ({ sku, quantity }: UpdateCartItemRequest) =>
      apiClient<Cart>(`/carts/${cartId}/products/${sku}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.detail(cartId), data);
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const cartId = getCartId();

  return useMutation({
    mutationFn: (sku: string) =>
      apiClient<Cart>(`/carts/${cartId}/products/${sku}`, {
        method: 'DELETE',
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.detail(cartId), data);
    },
  });
}
