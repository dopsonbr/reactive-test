/**
 * Product type representing a product in the catalog
 */
export interface Product {
  sku: string;
  name: string;
  description?: string;
  basePrice: number;
  finalPrice: number;
  imageUrl?: string;
  category?: string;
  inStock: boolean;
  stockLevel?: number;
}
