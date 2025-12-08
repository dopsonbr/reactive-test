import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@reactive-platform/api-client';
import type { Cart, CartItem, AddToCartRequest, UpdateCartItemRequest } from '../types';

export const cartKeys = {
  all: ['cart'] as const,
  detail: (id: string) => [...cartKeys.all, id] as const,
};

// Backend cart response shape (different from frontend Cart type)
interface BackendCartProduct {
  sku: number;
  description: string;
  price: string;
  quantity: number;
  imageUrl?: string;
}

interface BackendCart {
  id: string;
  products?: BackendCartProduct[];
  totals?: {
    subtotal: number;
    tax: number;
    grandTotal: number;
  };
}

// Transform backend response to frontend Cart type
function mapBackendCart(backendCart: BackendCart): Cart {
  const items: CartItem[] = (backendCart.products || []).map((p) => ({
    sku: String(p.sku),
    name: p.description,
    price: Number(p.price),
    quantity: p.quantity,
    imageUrl: p.imageUrl || '',
  }));

  return {
    id: backendCart.id,
    items,
    subtotal: backendCart.totals?.subtotal || 0,
    tax: backendCart.totals?.tax || 0,
    total: backendCart.totals?.grandTotal || 0,
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
        const backendCart = await apiClient<BackendCart>(`/carts/${cartId}`);
        return mapBackendCart(backendCart);
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
    mutationFn: async (item: AddToCartRequest) => {
      const backendCart = await apiClient<BackendCart>(`/carts/${cartId}/products`, {
        method: 'POST',
        body: JSON.stringify(item),
      });
      return mapBackendCart(backendCart);
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
      const backendCart = await apiClient<BackendCart>(`/carts/${cartId}/products/${sku}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
      return mapBackendCart(backendCart);
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
    mutationFn: async (sku: string) => {
      const backendCart = await apiClient<BackendCart>(`/carts/${cartId}/products/${sku}`, {
        method: 'DELETE',
      });
      return mapBackendCart(backendCart);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.detail(cartId), data);
    },
  });
}
