import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@reactive-platform/api-client';
import type { Product, ProductSearchParams, ProductSearchResult } from '../types';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductSearchParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (sku: string) => [...productKeys.details(), sku] as const,
};

export function useProducts(params: ProductSearchParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () =>
      apiClient<ProductSearchResult>('/products/search', {
        params: {
          // Only include query and category if they have values
          ...(params.query ? { q: params.query } : {}),
          ...(params.category ? { category: params.category } : {}),
          page: String(params.page || 1),
          limit: String(params.limit || 20),
        },
      }),
  });
}

export function useProduct(sku: string) {
  return useQuery({
    queryKey: productKeys.detail(sku),
    queryFn: () => apiClient<Product>(`/products/${sku}`),
    enabled: !!sku,
  });
}
