import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CheckoutSummary, OrderResponse } from '../types';
import { apiClient } from '../utils/apiClient';
import { cartKeys } from './useCart';

// Use empty string by default to leverage Vite proxy in development
// Set VITE_CHECKOUT_SERVICE_URL for production deployments
const API_BASE = import.meta.env.VITE_CHECKOUT_SERVICE_URL ?? '';

// Query key factories
export const checkoutKeys = {
  all: ['checkout'] as const,
  summary: (checkoutId: string) => [...checkoutKeys.all, 'summary', checkoutId] as const,
};

export const orderKeys = {
  all: ['orders'] as const,
  detail: (orderId: string) => [...orderKeys.all, orderId] as const,
};

export interface InitiateCheckoutRequest {
  cartId: string;
  customerId?: string;
  fulfillmentType: 'IMMEDIATE' | 'PICKUP' | 'DELIVERY';
  headers?: Record<string, string>;
}

/**
 * Hook to initiate checkout process
 */
export function useInitiateCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: InitiateCheckoutRequest) => {
      // Backend endpoint: POST /checkout/initiate
      const url = `${API_BASE}/api/checkout/initiate`;
      const body = {
        cartId: request.cartId,
        customerId: request.customerId,
        fulfillmentType: request.fulfillmentType,
      };
      return apiClient.post<CheckoutSummary>(url, body, { headers: request.headers });
    },
    onSuccess: (data) => {
      // Cache checkout summary
      queryClient.setQueryData(checkoutKeys.summary(data.checkoutSessionId), data);
    },
  });
}

export interface CompleteCheckoutRequest {
  checkoutSessionId: string;
  paymentMethod: 'CASH' | 'CREDIT' | 'DEBIT';
  headers?: Record<string, string>;
}

/**
 * Hook to complete checkout and create order
 */
export function useCompleteCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CompleteCheckoutRequest) => {
      // Backend endpoint: POST /checkout/complete
      // Note: checkoutId is passed in the request body, not the URL
      const url = `${API_BASE}/api/checkout/complete`;
      const body = {
        checkoutSessionId: request.checkoutSessionId,
        paymentMethod: request.paymentMethod,
      };
      return apiClient.post<OrderResponse>(url, body, { headers: request.headers });
    },
    onSuccess: (data, variables) => {
      // Cache order response
      queryClient.setQueryData(orderKeys.detail(data.orderId), data);

      // Get checkout summary to find cartId for invalidation
      const checkoutSummary = queryClient.getQueryData<CheckoutSummary>(
        checkoutKeys.summary(variables.checkoutSessionId)
      );

      // Invalidate cart cache if we have the cartId
      if (checkoutSummary?.cartId) {
        queryClient.invalidateQueries({
          queryKey: cartKeys.detail(checkoutSummary.cartId),
        });
      }
    },
  });
}

export interface UseOrderOptions {
  headers?: Record<string, string>;
  enabled?: boolean;
}

/**
 * Hook to fetch order details
 */
export function useOrder(orderId: string, options: UseOrderOptions = {}) {
  const { headers, enabled = true } = options;

  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: async () => {
      const url = `${API_BASE}/api/orders/${orderId}`;
      return apiClient.get<OrderResponse>(url, { headers });
    },
    enabled: enabled && Boolean(orderId),
  });
}
