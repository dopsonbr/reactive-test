import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Cart, AddToCartRequest, UpdateCartItemRequest } from '../types';
import { apiClient } from '../utils/apiClient';

// Use empty string by default to leverage Vite proxy in development
// Set VITE_CART_SERVICE_URL for production deployments
const API_BASE = import.meta.env.VITE_CART_SERVICE_URL ?? '';

// Query key factories
export const cartKeys = {
  all: ['cart'] as const,
  detail: (id: string) => [...cartKeys.all, id] as const,
};

export interface CartScope {
  cartId: string;
  headers?: Record<string, string>;
}

export interface UseCartOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch cart data
 * Callers must provide cartId via scope - does NOT read from sessionStorage
 */
export function useCart(scope: CartScope, options: UseCartOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: cartKeys.detail(scope.cartId),
    queryFn: async () => {
      const url = `${API_BASE}/api/carts/${scope.cartId}`;
      return apiClient.get<Cart>(url, { headers: scope.headers });
    },
    enabled: enabled && Boolean(scope.cartId),
  });
}

export interface CreateCartRequest {
  headers?: Record<string, string>;
}

/**
 * Hook to create a new cart
 */
export function useCreateCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateCartRequest = {}) => {
      const url = `${API_BASE}/api/carts`;
      return apiClient.post<Cart>(url, {}, { headers: request.headers });
    },
    onSuccess: (data) => {
      // Cache the newly created cart
      queryClient.setQueryData(cartKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to add item to cart
 */
export function useAddToCart(scope: CartScope) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: AddToCartRequest) => {
      const url = `${API_BASE}/api/carts/${scope.cartId}/items`;
      return apiClient.post<Cart>(url, request, { headers: scope.headers });
    },
    onSuccess: (data) => {
      // Update cart cache
      queryClient.setQueryData(cartKeys.detail(scope.cartId), data);
    },
  });
}

/**
 * Hook to update cart item quantity
 */
export function useUpdateCartItem(scope: CartScope) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sku, quantity }: { sku: string; quantity: number }) => {
      const url = `${API_BASE}/api/carts/${scope.cartId}/items/${sku}`;
      const request: UpdateCartItemRequest = { quantity };
      return apiClient.put<Cart>(url, request, { headers: scope.headers });
    },
    onSuccess: (data) => {
      // Update cart cache
      queryClient.setQueryData(cartKeys.detail(scope.cartId), data);
    },
  });
}

/**
 * Hook to remove item from cart
 */
export function useRemoveFromCart(scope: CartScope) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sku: string) => {
      const url = `${API_BASE}/api/carts/${scope.cartId}/items/${sku}`;
      return apiClient.delete<Cart>(url, { headers: scope.headers });
    },
    onSuccess: (data) => {
      // Update cart cache
      queryClient.setQueryData(cartKeys.detail(scope.cartId), data);
    },
  });
}

/**
 * Hook to clear all items from cart
 */
export function useClearCart(scope: CartScope) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const url = `${API_BASE}/api/carts/${scope.cartId}/clear`;
      return apiClient.post<Cart>(url, {}, { headers: scope.headers });
    },
    onSuccess: (data) => {
      // Update cart cache
      queryClient.setQueryData(cartKeys.detail(scope.cartId), data);
    },
  });
}
