export interface Product {
  sku: number;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  suggestedRetailPrice: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  sku: number;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  suggestedRetailPrice: number;
  currency?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  suggestedRetailPrice?: number;
  currency?: string;
}
