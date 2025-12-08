export interface CartItem {
  sku: number;
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
  products: CartItem[];    // Note: backend uses 'products' not 'items'
  totals: CartTotals;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartRequest {
  sku: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  sku: number;
  quantity: number;
}
