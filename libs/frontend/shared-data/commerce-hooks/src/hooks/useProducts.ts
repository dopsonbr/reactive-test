import { useQuery } from '@tanstack/react-query';
import type { Product, ProductSearchParams, ProductSearchResult } from '../types';
import { apiClient } from '../utils/apiClient';

const API_BASE = import.meta.env.VITE_PRODUCT_SERVICE_URL || 'http://localhost:8090';

// Query key factories
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductSearchParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (sku: string) => [...productKeys.details(), sku] as const,
};

export interface UseProductsOptions {
  params?: ProductSearchParams;
  headers?: Record<string, string>;
  enabled?: boolean;
}

/**
 * Hook to fetch a paginated list of products
 */
export function useProducts(options: UseProductsOptions = {}) {
  const { params = {}, headers, enabled = true } = options;

  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.set('query', params.query);
      if (params.category) queryParams.set('category', params.category);
      if (params.page !== undefined) queryParams.set('page', String(params.page));
      if (params.limit !== undefined) queryParams.set('limit', String(params.limit));

      const url = `${API_BASE}/api/products?${queryParams.toString()}`;
      return apiClient.get<ProductSearchResult>(url, { headers });
    },
    enabled,
  });
}

export interface UseProductOptions {
  headers?: Record<string, string>;
  enabled?: boolean;
}

/**
 * Hook to fetch a single product by SKU
 */
export function useProduct(sku: string, options: UseProductOptions = {}) {
  const { headers, enabled = true } = options;

  return useQuery({
    queryKey: productKeys.detail(sku),
    queryFn: async () => {
      const url = `${API_BASE}/api/products/${sku}`;
      return apiClient.get<Product>(url, { headers });
    },
    enabled: enabled && Boolean(sku),
  });
}
