export interface AppliedDiscount {
  type: 'loyalty' | 'promo' | 'markdown';
  description: string;
  amount: number;
}

export interface CheckoutSummary {
  checkoutId: string;
  cartId: string;
  customerId?: string;
  subtotal: number;
  discounts: AppliedDiscount[];
  discountTotal: number;
  tax: number;
  total: number;
  fulfillmentType: 'IMMEDIATE' | 'PICKUP' | 'DELIVERY';
}

export interface OrderResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  total: number;
}
