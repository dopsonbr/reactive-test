import { useQuery } from '@tanstack/react-query';
import type { Customer, CustomerStats, LoyaltyDetails, Order, CustomerActivity, CreditUtilization } from '../types/customer';

// Mock customer data
const mockCustomers: Record<string, Customer> = {
  'cust-001': {
    id: 'cust-001',
    type: 'CONSUMER',
    status: 'ACTIVE',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@email.com',
    phone: '(555) 123-4567',
    addresses: [
      {
        id: 'addr-001',
        type: 'BOTH',
        name: 'Home',
        line1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'US',
        isPrimary: true,
      },
      {
        id: 'addr-001b',
        type: 'SHIPPING',
        name: 'Work',
        line1: '456 Office Blvd',
        line2: 'Suite 200',
        city: 'Austin',
        state: 'TX',
        postalCode: '78702',
        country: 'US',
        isPrimary: false,
      },
    ],
    communicationPreferences: {
      emailPromotions: true,
      smsAlerts: true,
      directMail: false,
    },
    loyalty: {
      tier: 'GOLD',
      currentPoints: 2500,
      lifetimePoints: 8500,
      multiplier: 1.5,
      enrollmentDate: new Date('2022-01-15'),
    },
    createdAt: new Date('2022-01-15'),
    updatedAt: new Date('2024-03-10'),
  },
  'cust-002': {
    id: 'cust-002',
    type: 'BUSINESS',
    status: 'ACTIVE',
    firstName: 'John',
    lastName: 'Anderson',
    email: 'orders@acme.com',
    phone: '(555) 987-6543',
    addresses: [
      {
        id: 'addr-002',
        type: 'BILLING',
        name: 'Corporate HQ',
        line1: '456 Corporate Blvd',
        line2: 'Suite 100',
        city: 'Dallas',
        state: 'TX',
        postalCode: '75201',
        country: 'US',
        isPrimary: true,
      },
    ],
    communicationPreferences: {
      emailPromotions: true,
      smsAlerts: false,
      directMail: true,
    },
    b2bInfo: {
      companyName: 'ACME Corporation',
      taxId: '12-3456789',
      industry: 'Manufacturing',
      website: 'https://acme.com',
      accountTier: 'PREMIER',
      creditLimit: 200000,
      paymentTerms: 'NET_60',
      salesRepId: 'rep-001',
      salesRepName: 'Mike Johnson',
    },
    createdAt: new Date('2021-06-20'),
    updatedAt: new Date('2024-02-28'),
  },
};

// Mock stats
const mockStats: Record<string, CustomerStats> = {
  'cust-001': {
    totalOrders: 24,
    totalSpent: 3450.99,
    averageOrderValue: 143.79,
    lastOrderDate: new Date('2024-03-05'),
    lifetimePoints: 8500,
    currentPoints: 2500,
  },
  'cust-002': {
    totalOrders: 156,
    totalSpent: 125000.00,
    averageOrderValue: 801.28,
    lastOrderDate: new Date('2024-03-08'),
    lifetimePoints: 0,
    currentPoints: 0,
  },
};

// Mock loyalty details
const mockLoyaltyDetails: Record<string, LoyaltyDetails> = {
  'cust-001': {
    tier: 'GOLD',
    currentPoints: 2500,
    lifetimePoints: 8500,
    pointsToNextTier: 2500,
    nextTier: 'PLATINUM',
    multiplier: 1.5,
    tierExpiration: new Date('2025-01-15'),
    pointsHistory: [
      { id: 'pts-001', type: 'EARN', points: 150, balance: 2500, description: 'Purchase #12345', orderId: 'ord-12345', date: new Date('2024-03-05') },
      { id: 'pts-002', type: 'REDEEM', points: -500, balance: 2350, description: 'Redeemed for $5 discount', date: new Date('2024-02-28') },
      { id: 'pts-003', type: 'EARN', points: 200, balance: 2850, description: 'Purchase #12340', orderId: 'ord-12340', date: new Date('2024-02-20') },
    ],
  },
};

// Mock orders
const mockOrders: Record<string, Order[]> = {
  'cust-001': [
    { id: 'ord-12345', orderNumber: 'ORD-12345', customerId: 'cust-001', status: 'DELIVERED', total: 149.99, itemCount: 3, createdAt: new Date('2024-03-05'), storeNumber: 101 },
    { id: 'ord-12340', orderNumber: 'ORD-12340', customerId: 'cust-001', status: 'DELIVERED', total: 89.50, itemCount: 2, createdAt: new Date('2024-02-20'), storeNumber: 101 },
    { id: 'ord-12335', orderNumber: 'ORD-12335', customerId: 'cust-001', status: 'DELIVERED', total: 250.00, itemCount: 5, createdAt: new Date('2024-02-01'), storeNumber: 102 },
  ],
  'cust-002': [
    { id: 'ord-22345', orderNumber: 'ORD-22345', customerId: 'cust-002', status: 'SHIPPED', total: 5499.99, itemCount: 50, createdAt: new Date('2024-03-08'), storeNumber: 201 },
    { id: 'ord-22340', orderNumber: 'ORD-22340', customerId: 'cust-002', status: 'DELIVERED', total: 3200.00, itemCount: 32, createdAt: new Date('2024-02-25'), storeNumber: 201 },
  ],
};

// Mock activity
const mockActivity: Record<string, CustomerActivity[]> = {
  'cust-001': [
    { id: 'act-001', type: 'ORDER_PLACED', description: 'Placed order #ORD-12345', metadata: { orderId: 'ord-12345' }, userId: 'emp-001', timestamp: new Date('2024-03-05') },
    { id: 'act-002', type: 'POINTS_EARNED', description: 'Earned 150 points from purchase', metadata: { points: 150 }, userId: 'system', timestamp: new Date('2024-03-05') },
    { id: 'act-003', type: 'POINTS_REDEEMED', description: 'Redeemed 500 points for $5 discount', metadata: { points: 500 }, userId: 'emp-002', timestamp: new Date('2024-02-28') },
  ],
};

// Mock credit utilization
const mockCreditUtilization: Record<string, CreditUtilization> = {
  'cust-002': {
    creditLimit: 200000,
    currentBalance: 45000,
    availableCredit: 155000,
    utilizationPercent: 22.5,
    lastPaymentDate: new Date('2024-02-15'),
    nextPaymentDue: new Date('2024-04-15'),
  },
};

// API functions
async function fetchCustomer(customerId: string): Promise<Customer> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const customer = mockCustomers[customerId];
  if (!customer) throw new Error('Customer not found');
  return customer;
}

async function fetchCustomerStats(customerId: string): Promise<CustomerStats> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return mockStats[customerId] || {
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    lastOrderDate: null,
    lifetimePoints: 0,
    currentPoints: 0,
  };
}

async function fetchLoyaltyDetails(customerId: string): Promise<LoyaltyDetails | null> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return mockLoyaltyDetails[customerId] || null;
}

async function fetchCustomerOrders(customerId: string): Promise<Order[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockOrders[customerId] || [];
}

async function fetchCustomerActivity(customerId: string): Promise<CustomerActivity[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockActivity[customerId] || [];
}

async function fetchCreditUtilization(customerId: string): Promise<CreditUtilization | null> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return mockCreditUtilization[customerId] || null;
}

// Hooks
export function useCustomer(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => fetchCustomer(customerId),
    enabled: !!customerId,
  });
}

export function useCustomerStats(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId, 'stats'],
    queryFn: () => fetchCustomerStats(customerId),
    enabled: !!customerId,
  });
}

export function useLoyaltyDetails(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId, 'loyalty'],
    queryFn: () => fetchLoyaltyDetails(customerId),
    enabled: !!customerId,
  });
}

export function useCustomerOrders(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId, 'orders'],
    queryFn: () => fetchCustomerOrders(customerId),
    enabled: !!customerId,
  });
}

export function useCustomerActivity(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId, 'activity'],
    queryFn: () => fetchCustomerActivity(customerId),
    enabled: !!customerId,
  });
}

export function useCreditUtilization(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId, 'credit'],
    queryFn: () => fetchCreditUtilization(customerId),
    enabled: !!customerId,
  });
}
