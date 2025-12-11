/**
 * Mock product data for POS E2E testing
 * @see 045G_POS_E2E_TESTING.md - Test Data Strategy
 */

export interface MockProduct {
  sku: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  inventory: number;
  category: string;
  taxable: boolean;
  requiresAge?: number;
  serialRequired?: boolean;
  b2bPricing?: {
    tier: 'STANDARD' | 'PREMIER' | 'ENTERPRISE';
    discount: number; // Percentage
  }[];
}

export const mockProducts: MockProduct[] = [
  {
    sku: 'SKU-WIDGET-001',
    name: 'Widget Pro XL',
    description: 'Premium professional widget with extended features',
    price: 149.99,
    inventory: 50,
    category: 'Widgets',
    taxable: true,
    b2bPricing: [
      { tier: 'STANDARD', discount: 5 },
      { tier: 'PREMIER', discount: 10 },
      { tier: 'ENTERPRISE', discount: 15 },
    ],
  },
  {
    sku: 'SKU-WIDGET-002',
    name: 'Widget Standard',
    description: 'Everyday widget for common use',
    price: 79.99,
    inventory: 100,
    category: 'Widgets',
    taxable: true,
    b2bPricing: [
      { tier: 'STANDARD', discount: 5 },
      { tier: 'PREMIER', discount: 10 },
      { tier: 'ENTERPRISE', discount: 15 },
    ],
  },
  {
    sku: 'SKU-ACC-001',
    name: 'Widget Accessory Pack',
    description: 'Essential accessories for all widget models',
    price: 29.99,
    inventory: 200,
    category: 'Accessories',
    taxable: true,
  },
  {
    sku: 'SKU-BULK-001',
    name: 'Widget Case (24 units)',
    description: 'Bulk case of standard widgets',
    price: 1199.88,
    inventory: 10,
    category: 'Bulk',
    taxable: true,
    b2bPricing: [
      { tier: 'STANDARD', discount: 10 },
      { tier: 'PREMIER', discount: 15 },
      { tier: 'ENTERPRISE', discount: 20 },
    ],
  },
  {
    sku: 'SKU-INSTALL-001',
    name: 'Pro Installation Service',
    description: 'Professional on-site installation',
    price: 199.99,
    inventory: Infinity, // Service, unlimited
    category: 'Services',
    taxable: false,
  },
  {
    sku: 'SKU-DAMAGED-001',
    name: 'Widget Pro (Damaged Box)',
    description: 'Widget Pro with cosmetic damage to packaging',
    price: 149.99,
    originalPrice: 149.99,
    inventory: 3,
    category: 'Clearance',
    taxable: true,
  },
  {
    sku: 'SKU-CLEARANCE-001',
    name: 'Widget Classic (Discontinued)',
    description: 'Previous generation widget - clearance',
    price: 49.99,
    originalPrice: 99.99,
    inventory: 15,
    category: 'Clearance',
    taxable: true,
  },
  {
    sku: 'SKU-AGE-001',
    name: 'Premium Spray Paint',
    description: 'High-quality spray paint for industrial use',
    price: 12.99,
    inventory: 100,
    category: 'Industrial',
    taxable: true,
    requiresAge: 18,
  },
  {
    sku: 'SKU-SERIAL-001',
    name: 'High-Value Tool Set',
    description: 'Professional tool set requiring serial tracking',
    price: 599.99,
    inventory: 5,
    category: 'Tools',
    taxable: true,
    serialRequired: true,
  },
];

export function findProductBySku(sku: string): MockProduct | undefined {
  return mockProducts.find((p) => p.sku === sku);
}

export function searchProducts(query: string): MockProduct[] {
  const lowerQuery = query.toLowerCase();
  return mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.sku.toLowerCase().includes(lowerQuery)
  );
}
