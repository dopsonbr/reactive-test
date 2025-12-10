import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product } from '../types/transaction';

// Mock product lookup (would be API call in production)
async function fetchProduct(sku: string): Promise<Product | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Mock product data
  const mockProducts: Record<string, Product> = {
    'SKU-001': {
      sku: 'SKU-001',
      name: 'Premium Widget',
      description: 'High-quality widget for all your needs',
      price: 29.99,
      category: 'Widgets',
      inStock: true,
      availableQuantity: 50,
    },
    'SKU-002': {
      sku: 'SKU-002',
      name: 'Standard Gadget',
      description: 'Reliable everyday gadget',
      price: 19.99,
      salePrice: 14.99,
      category: 'Gadgets',
      inStock: true,
      availableQuantity: 100,
    },
    'SKU-003': {
      sku: 'SKU-003',
      name: 'Deluxe Accessory',
      description: 'Premium accessory with advanced features',
      price: 49.99,
      category: 'Accessories',
      inStock: true,
      availableQuantity: 25,
    },
    'SKU-004': {
      sku: 'SKU-004',
      name: 'Basic Tool',
      description: 'Essential tool for DIY projects',
      price: 12.99,
      category: 'Tools',
      inStock: true,
      availableQuantity: 200,
    },
    'SKU-005': {
      sku: 'SKU-005',
      name: 'Professional Kit',
      description: 'Complete professional toolkit',
      price: 149.99,
      salePrice: 129.99,
      category: 'Kits',
      inStock: true,
      availableQuantity: 10,
    },
  };

  return mockProducts[sku.toUpperCase()] ?? null;
}

// Search products
async function searchProducts(query: string): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const mockProducts: Product[] = [
    {
      sku: 'SKU-001',
      name: 'Premium Widget',
      description: 'High-quality widget for all your needs',
      price: 29.99,
      category: 'Widgets',
      inStock: true,
      availableQuantity: 50,
    },
    {
      sku: 'SKU-002',
      name: 'Standard Gadget',
      description: 'Reliable everyday gadget',
      price: 19.99,
      salePrice: 14.99,
      category: 'Gadgets',
      inStock: true,
      availableQuantity: 100,
    },
    {
      sku: 'SKU-003',
      name: 'Deluxe Accessory',
      description: 'Premium accessory with advanced features',
      price: 49.99,
      category: 'Accessories',
      inStock: true,
      availableQuantity: 25,
    },
    {
      sku: 'SKU-004',
      name: 'Basic Tool',
      description: 'Essential tool for DIY projects',
      price: 12.99,
      category: 'Tools',
      inStock: true,
      availableQuantity: 200,
    },
    {
      sku: 'SKU-005',
      name: 'Professional Kit',
      description: 'Complete professional toolkit',
      price: 149.99,
      salePrice: 129.99,
      category: 'Kits',
      inStock: true,
      availableQuantity: 10,
    },
  ];

  const lowerQuery = query.toLowerCase();
  return mockProducts.filter(
    (p) =>
      p.sku.toLowerCase().includes(lowerQuery) ||
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
  );
}

export function useProductLookup(sku: string | null) {
  return useQuery({
    queryKey: ['product', sku],
    queryFn: () => (sku ? fetchProduct(sku) : null),
    enabled: !!sku && sku.length >= 3,
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
