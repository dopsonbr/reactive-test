/**
 * Mock customer data for POS E2E testing
 * @see 045G_POS_E2E_TESTING.md - Test Data Strategy
 */

export type CustomerType = 'D2C' | 'B2B';
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type B2BTier = 'STANDARD' | 'PREMIER' | 'ENTERPRISE';
export type PaymentTerms = 'NET_30' | 'NET_60' | 'NET_90';

export interface CustomerAddress {
  id: string;
  type: 'SHIPPING' | 'BILLING' | 'BOTH';
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}

export interface MockCustomer {
  id: string;
  type: CustomerType;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  loyaltyTier?: LoyaltyTier;
  loyaltyPoints?: number;
  b2bTier?: B2BTier;
  creditLimit?: number;
  availableCredit?: number;
  paymentTerms?: PaymentTerms;
  taxExempt?: boolean;
  taxExemptId?: string;
  addresses: CustomerAddress[];
  createdAt: Date;
}

export const mockCustomers: MockCustomer[] = [
  // D2C Customers
  {
    id: 'CUST-D2C-001',
    type: 'D2C',
    email: 'jane@email.com',
    phone: '555-123-4567',
    firstName: 'Jane',
    lastName: 'Consumer',
    loyaltyTier: 'GOLD',
    loyaltyPoints: 12500,
    addresses: [
      {
        id: 'addr-001',
        type: 'BOTH',
        name: 'Jane Consumer',
        line1: '123 Main Street',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62701',
        country: 'USA',
        isPrimary: true,
      },
    ],
    createdAt: new Date('2023-01-15'),
  },
  {
    id: 'CUST-D2C-002',
    type: 'D2C',
    email: 'bob.shopper@email.com',
    phone: '555-987-6543',
    firstName: 'Bob',
    lastName: 'Shopper',
    loyaltyTier: 'BRONZE',
    loyaltyPoints: 500,
    addresses: [
      {
        id: 'addr-002',
        type: 'SHIPPING',
        name: 'Bob Shopper',
        line1: '456 Oak Avenue',
        line2: 'Apt 2B',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'USA',
        isPrimary: true,
      },
    ],
    createdAt: new Date('2024-03-20'),
  },
  {
    id: 'CUST-D2C-003',
    type: 'D2C',
    email: 'newcustomer@email.com',
    phone: '555-111-2222',
    firstName: 'New',
    lastName: 'Customer',
    loyaltyTier: 'BRONZE',
    loyaltyPoints: 0,
    addresses: [],
    createdAt: new Date(),
  },

  // B2B Customers
  {
    id: 'CUST-B2B-001',
    type: 'B2B',
    email: 'purchasing@acmecorp.com',
    phone: '555-ACME-001',
    firstName: 'Purchasing',
    lastName: 'Manager',
    companyName: 'ACME Corp',
    b2bTier: 'PREMIER',
    creditLimit: 50000,
    availableCredit: 45000,
    paymentTerms: 'NET_30',
    taxExempt: false,
    addresses: [
      {
        id: 'addr-b2b-001',
        type: 'SHIPPING',
        name: 'ACME Corp Warehouse',
        line1: '1000 Industrial Blvd',
        city: 'Dallas',
        state: 'TX',
        postalCode: '75001',
        country: 'USA',
        isPrimary: true,
      },
      {
        id: 'addr-b2b-002',
        type: 'BILLING',
        name: 'ACME Corp HQ',
        line1: '500 Corporate Plaza',
        city: 'Dallas',
        state: 'TX',
        postalCode: '75002',
        country: 'USA',
        isPrimary: false,
      },
    ],
    createdAt: new Date('2022-06-01'),
  },
  {
    id: 'CUST-B2B-002',
    type: 'B2B',
    email: 'orders@techco.com',
    phone: '555-TECH-002',
    firstName: 'Order',
    lastName: 'Dept',
    companyName: 'TechCo Inc',
    b2bTier: 'ENTERPRISE',
    creditLimit: 200000,
    availableCredit: 175000,
    paymentTerms: 'NET_60',
    taxExempt: true,
    taxExemptId: 'TX-EX-123456',
    addresses: [
      {
        id: 'addr-b2b-003',
        type: 'BOTH',
        name: 'TechCo Distribution Center',
        line1: '2500 Tech Park Way',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'USA',
        isPrimary: true,
      },
    ],
    createdAt: new Date('2021-09-15'),
  },
  {
    id: 'CUST-B2B-003',
    type: 'B2B',
    email: 'admin@smallbiz.com',
    phone: '555-SMALL-03',
    firstName: 'Admin',
    lastName: 'User',
    companyName: 'SmallBiz LLC',
    b2bTier: 'STANDARD',
    creditLimit: 10000,
    availableCredit: 8500,
    paymentTerms: 'NET_30',
    taxExempt: false,
    addresses: [
      {
        id: 'addr-b2b-004',
        type: 'BOTH',
        name: 'SmallBiz LLC',
        line1: '789 Small Business Lane',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62702',
        country: 'USA',
        isPrimary: true,
      },
    ],
    createdAt: new Date('2024-01-10'),
  },
  // B2B customer with low credit
  {
    id: 'CUST-B2B-004',
    type: 'B2B',
    email: 'orders@lowcredit.com',
    phone: '555-LOW-0001',
    firstName: 'Credit',
    lastName: 'Limit',
    companyName: 'Low Credit Inc',
    b2bTier: 'STANDARD',
    creditLimit: 5000,
    availableCredit: 500, // Very low available credit
    paymentTerms: 'NET_30',
    taxExempt: false,
    addresses: [],
    createdAt: new Date('2024-06-01'),
  },
];

export function findCustomerById(id: string): MockCustomer | undefined {
  return mockCustomers.find((c) => c.id === id);
}

export function findCustomerByEmail(email: string): MockCustomer | undefined {
  return mockCustomers.find((c) => c.email.toLowerCase() === email.toLowerCase());
}

export function findCustomerByPhone(phone: string): MockCustomer | undefined {
  // Normalize phone for comparison
  const normalizedPhone = phone.replace(/\D/g, '');
  return mockCustomers.find((c) => c.phone.replace(/\D/g, '') === normalizedPhone);
}

export function searchCustomers(query: string): MockCustomer[] {
  const lowerQuery = query.toLowerCase();
  return mockCustomers.filter(
    (c) =>
      c.email.toLowerCase().includes(lowerQuery) ||
      c.phone.includes(query) ||
      c.firstName.toLowerCase().includes(lowerQuery) ||
      c.lastName.toLowerCase().includes(lowerQuery) ||
      c.companyName?.toLowerCase().includes(lowerQuery)
  );
}

export function getLoyaltyDiscount(tier: LoyaltyTier): number {
  const discounts: Record<LoyaltyTier, number> = {
    BRONZE: 0,
    SILVER: 5,
    GOLD: 10,
    PLATINUM: 15,
  };
  return discounts[tier];
}

export function getB2BDiscount(tier: B2BTier): number {
  const discounts: Record<B2BTier, number> = {
    STANDARD: 5,
    PREMIER: 10,
    ENTERPRISE: 15,
  };
  return discounts[tier];
}

export function calculateLoyaltyPoints(subtotal: number): number {
  // 1 point per dollar spent
  return Math.floor(subtotal);
}
