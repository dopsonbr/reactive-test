export interface CartProduct {
  sku: number;
  name: string;
  description?: string;
  unitPrice: number;
  originalUnitPrice?: number;
  quantity: number;
  availableQuantity?: number;
  imageUrl?: string;
  category?: string;
  lineTotal: number;
  inStock?: boolean;
}

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  fulfillmentTotal: number;
  taxTotal: number;
  grandTotal: number;
}

export interface Cart {
  id: string;
  storeNumber?: number;
  customerId?: string;
  products: CartProduct[];
  totals: CartTotals;
}

// Legacy alias for backwards compatibility during migration
export type CartItem = CartProduct;

export interface AddToCartRequest {
  sku: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
