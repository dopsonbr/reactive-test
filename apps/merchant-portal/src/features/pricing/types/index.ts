export interface Price {
  sku: number;
  price: number;
  originalPrice: number | null;
  currency: string;
  updatedAt: string;
}

export interface UpdatePriceRequest {
  price: number;
  originalPrice?: number | null;
  currency?: string;
}
