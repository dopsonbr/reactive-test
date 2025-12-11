import type { Customer } from '@reactive-platform/commerce-hooks';

export const mockCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '555-0100',
    loyaltyTier: 'GOLD',
    loyaltyPoints: 1500,
  },
  {
    id: 'CUST-002',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '555-0101',
    loyaltyTier: 'PLATINUM',
    loyaltyPoints: 5000,
  },
  {
    id: 'CUST-003',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    phone: '555-0102',
    loyaltyTier: 'SILVER',
    loyaltyPoints: 800,
  },
  {
    id: 'CUST-004',
    name: 'Alice Williams',
    email: 'alice.williams@example.com',
    phone: '555-0103',
    loyaltyTier: 'BRONZE',
    loyaltyPoints: 250,
  },
  {
    id: 'CUST-005',
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    phone: '555-0104',
    loyaltyTier: undefined,
    loyaltyPoints: 0,
  },
];
