import { http, HttpResponse } from 'msw';
import type { CheckoutSummary, OrderResponse, AppliedDiscount } from '@reactive-platform/commerce-hooks';
import { mockCustomers } from '../data/customers';

const API_BASE = 'http://localhost:8087';

// In-memory storage for checkouts
const checkouts = new Map<string, CheckoutSummary>();

interface InitiateCheckoutRequest {
  cartId: string;
  customerId?: string;
  fulfillmentType: 'IMMEDIATE' | 'PICKUP' | 'DELIVERY';
}

interface CompleteCheckoutRequest {
  paymentMethod: 'CASH' | 'CREDIT' | 'DEBIT';
}

export const checkoutHandlers = [
  // POST /api/checkouts - Initiate checkout
  http.post(`${API_BASE}/api/checkouts`, async ({ request }) => {
    const body = (await request.json()) as InitiateCheckoutRequest;
    const checkoutId = `checkout-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Mock cart data (in real scenario, would fetch from cart service)
    const subtotal = 25.5;
    const discounts: AppliedDiscount[] = [];

    // Apply loyalty discount if customer exists
    if (body.customerId) {
      const customer = mockCustomers.find((c) => c.id === body.customerId);
      if (customer?.loyaltyTier) {
        const discountPercent = {
          BRONZE: 0.05,
          SILVER: 0.1,
          GOLD: 0.15,
          PLATINUM: 0.2,
        }[customer.loyaltyTier];

        discounts.push({
          type: 'loyalty',
          description: `${customer.loyaltyTier} Member Discount`,
          amount: subtotal * discountPercent,
        });
      }
    }

    const discountTotal = discounts.reduce((sum, d) => sum + d.amount, 0);
    const subtotalAfterDiscounts = subtotal - discountTotal;
    const tax = subtotalAfterDiscounts * 0.08; // 8% tax
    const total = subtotalAfterDiscounts + tax;

    const checkout: CheckoutSummary = {
      checkoutId,
      cartId: body.cartId,
      customerId: body.customerId,
      subtotal,
      discounts,
      discountTotal,
      tax,
      total,
      fulfillmentType: body.fulfillmentType,
    };

    checkouts.set(checkoutId, checkout);

    return HttpResponse.json<CheckoutSummary>(checkout);
  }),

  // POST /api/checkouts/:checkoutId/complete - Complete checkout
  http.post(`${API_BASE}/api/checkouts/:checkoutId/complete`, async ({ params, request }) => {
    const { checkoutId } = params;
    const checkout = checkouts.get(checkoutId as string);

    if (!checkout) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Checkout not found',
      });
    }

    const body = (await request.json()) as CompleteCheckoutRequest;

    // Simulate payment processing
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    const order: OrderResponse = {
      orderId,
      orderNumber,
      status: 'CONFIRMED',
      total: checkout.total,
    };

    // Clean up checkout
    checkouts.delete(checkoutId as string);

    return HttpResponse.json<OrderResponse>(order);
  }),
];
