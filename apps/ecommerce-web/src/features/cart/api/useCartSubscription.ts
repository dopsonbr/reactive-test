import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToCart } from '@reactive-platform/api-client';
import type { CartEvent } from '../types';
import { cartKeys } from './useCart';

interface CartUpdatedResponse {
  cartUpdated: CartEvent;
}

/**
 * Subscribes to real-time cart updates via GraphQL SSE subscription.
 *
 * When a cart event is received, the TanStack Query cache is updated
 * with the new cart data, causing UI components to re-render.
 *
 * @param cartId - The cart ID to subscribe to, or undefined to skip subscription
 */
export function useCartSubscription(cartId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!cartId) return;

    const unsubscribe = subscribeToCart<CartUpdatedResponse>(
      cartId,
      (data) => {
        // Update cache with new cart data from subscription
        queryClient.setQueryData(cartKeys.detail(cartId), data.cartUpdated.cart);
      },
      (error) => {
        console.error('Cart subscription error:', error);
        // Optionally: Could invalidate queries to force refetch
        // queryClient.invalidateQueries({ queryKey: cartKeys.detail(cartId) });
      }
    );

    return unsubscribe;
  }, [cartId, queryClient]);
}
