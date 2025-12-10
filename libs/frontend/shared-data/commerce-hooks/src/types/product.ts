export interface Product {
  sku: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  imageUrl?: string;
  inStock: boolean;
  stockQuantity?: number;
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
