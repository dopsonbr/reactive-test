export interface AppliedDiscount {
  discountId?: string;
  code?: string;
  type: 'loyalty' | 'promo' | 'markdown' | string;
  description?: string;
  appliedSavings: number;
}

export interface OrderLineItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discountAmount: number;
}

export interface CheckoutSummary {
  checkoutSessionId: string;
  cartId: string;
  orderNumber?: string;
  storeNumber?: number;
  lineItems: OrderLineItem[];
  appliedDiscounts?: AppliedDiscount[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  fulfillmentCost?: number;
  grandTotal: number;
  fulfillmentType?: 'IMMEDIATE' | 'PICKUP' | 'DELIVERY';
  expiresAt?: string;
}

export interface OrderResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  total: number;
}
