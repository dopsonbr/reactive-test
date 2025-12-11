import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product } from '../types/transaction';

// API response types matching product-service
interface SearchProductResponse {
  sku: number;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  availableQuantity: number;
  imageUrl: string | null;
  category: string;
  relevanceScore: number;
  inStock: boolean;
  onSale: boolean;
}

interface ProductSearchResponse {
  products: SearchProductResponse[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  query: string;
  searchTimeMs: number;
}

interface ProductDetailResponse {
  sku: number;
  name: string;
  description: string;
  price: number;
  basePrice: number;
  availability: number;
  imageUrl: string | null;
  category: string;
}

// Transform API response to frontend Product type
function transformSearchProduct(apiProduct: SearchProductResponse): Product {
  return {
    sku: String(apiProduct.sku),
    name: apiProduct.name,
    description: apiProduct.description,
    price: apiProduct.onSale && apiProduct.originalPrice
      ? apiProduct.originalPrice
      : apiProduct.price,
    salePrice: apiProduct.onSale ? apiProduct.price : undefined,
    category: apiProduct.category,
    inStock: apiProduct.inStock,
    availableQuantity: apiProduct.availableQuantity,
  };
}

function transformDetailProduct(apiProduct: ProductDetailResponse): Product {
  return {
    sku: String(apiProduct.sku),
    name: apiProduct.name,
    description: apiProduct.description,
    price: apiProduct.basePrice,
    salePrice:
      apiProduct.price !== apiProduct.basePrice ? apiProduct.price : undefined,
    category: apiProduct.category,
    inStock: apiProduct.availability > 0,
    availableQuantity: apiProduct.availability,
  };
}

// Fetch single product by SKU
async function fetchProduct(sku: string): Promise<Product | null> {
  try {
    const response = await fetch(`/products/${sku}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-store-number': '1',
        'x-order-number': crypto.randomUUID(),
        'x-userid': 'pos-user',
        'x-sessionid': crypto.randomUUID(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    const data: ProductDetailResponse = await response.json();
    return transformDetailProduct(data);
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Search products by query
async function searchProducts(query: string): Promise<Product[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      page: '0',
      size: '20',
    });

    const response = await fetch(`/products/search?${params}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-store-number': '1',
        'x-order-number': crypto.randomUUID(),
        'x-userid': 'pos-user',
        'x-sessionid': crypto.randomUUID(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search products: ${response.statusText}`);
    }

    const data: ProductSearchResponse = await response.json();
    return data.products.map(transformSearchProduct);
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

export function useProductLookup(sku: string | null) {
  return useQuery({
    queryKey: ['product', sku],
    queryFn: () => (sku ? fetchProduct(sku) : null),
    enabled: !!sku && sku.length >= 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => searchProducts(query),
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  return (sku: string) => {
    queryClient.prefetchQuery({
      queryKey: ['product', sku],
      queryFn: () => fetchProduct(sku),
      staleTime: 5 * 60 * 1000,
    });
  };
}
