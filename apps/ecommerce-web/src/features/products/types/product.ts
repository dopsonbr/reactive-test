export interface Product {
  sku: number;
  name: string;
  description: string;
  price: string;           // String for BigDecimal precision
  originalPrice?: string;  // Nullable
  availableQuantity: number;
  imageUrl: string;
  category: string;
  inStock: boolean;        // Derived by backend
  onSale: boolean;         // Derived by backend
}

export interface ProductSearchParams {
  query?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}
