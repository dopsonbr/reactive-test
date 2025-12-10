export interface CartItem {
  sku: string; // Changed from number to string to align with GraphQL schema
  name: string;
  description: string;
  unitPrice: string;
  originalUnitPrice?: string;
  quantity: number;
  availableQuantity: number;
  imageUrl: string;
  category: string;
  lineTotal: string;
  inStock: boolean;
}

export interface CartTotals {
  subtotal: string;
  discountTotal: string;
  fulfillmentTotal: string;
  taxTotal: string;
  grandTotal: string;
}

export interface Cart {
  id: string;
  storeNumber: number;
  customerId?: string;
  products: CartItem[];
  totals: CartTotals;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartRequest {
  sku: string; // Changed from number to string
  quantity: number;
}

export interface UpdateCartItemRequest {
  sku: string; // Changed from number to string
  quantity: number;
}

/** Event types for cart subscriptions */
export type CartEventType =
  | 'CART_CREATED'
  | 'CART_DELETED'
  | 'PRODUCT_ADDED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_REMOVED'
  | 'DISCOUNT_APPLIED'
  | 'DISCOUNT_REMOVED'
  | 'FULFILLMENT_ADDED'
  | 'FULFILLMENT_UPDATED'
  | 'FULFILLMENT_REMOVED'
  | 'CUSTOMER_SET'
  | 'CUSTOMER_REMOVED';

/** Event received from cartUpdated subscription */
export interface CartEvent {
  eventType: CartEventType;
  cartId: string;
  timestamp: string;
  cart: Cart;
}
