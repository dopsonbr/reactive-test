export interface Price {
  sku: number;
  storeNumber: number;
  regularPrice: number;
  salePrice: number | null;
  clearancePrice: number | null;
  currency: string;
  effectiveDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePriceRequest {
  regularPrice?: number;
  salePrice?: number | null;
  clearancePrice?: number | null;
  currency?: string;
  effectiveDate?: string;
  endDate?: string | null;
}

export interface PriceFilters {
  storeNumber?: number;
  onSale?: boolean;
  onClearance?: boolean;
}
