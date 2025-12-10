import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Order, OrderSearchParams, OrderSearchResult } from '../types/order';

// Mock order data
const mockOrders: Order[] = [
  {
    id: 'order-001',
    orderNumber: 'ORD-2024-001234',
    status: 'DELIVERED',
    customerId: 'cust-001',
    customerName: 'Jane Smith',
    customerEmail: 'jane@email.com',
    customerPhone: '(555) 123-4567',
    isB2B: false,
    items: [
      {
        id: 'item-001',
        sku: 'WIDGET-PRO-001',
        name: 'Widget Pro XL',
        quantity: 2,
        unitPrice: 149.99,
        discount: 0,
        lineTotal: 299.98,
        fulfillmentGroupId: 'fg-001',
        returnableQuantity: 2,
        returnedQuantity: 0,
      },
    ],
    fulfillmentGroups: [
      {
        id: 'fg-001',
        type: 'DELIVERY',
        status: 'DELIVERED',
        items: ['item-001'],
        address: {
          name: 'Jane Smith',
          line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'US',
        },
        trackingNumber: '1Z999AA10123456784',
        carrier: 'UPS',
        actualDelivery: new Date('2024-12-05'),
        cost: 9.99,
      },
    ],
    subtotal: 299.98,
    discountTotal: 0,
    taxTotal: 24.75,
    shippingTotal: 9.99,
    grandTotal: 334.72,
    payments: [
      {
        id: 'pay-001',
        method: 'CARD',
        amount: 334.72,
        status: 'CAPTURED',
        lastFour: '4242',
        cardBrand: 'Visa',
        capturedAt: new Date('2024-12-01'),
      },
    ],
    amountPaid: 334.72,
    amountRefunded: 0,
    balanceDue: 0,
    storeNumber: 1234,
    storeName: 'Downtown Store',
    employeeId: 'emp-001',
    employeeName: 'John Associate',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-05'),
    completedAt: new Date('2024-12-05'),
    timeline: [
      { id: 't1', timestamp: new Date('2024-12-01T10:00:00'), type: 'ORDER_PLACED', title: 'Order placed' },
      { id: 't2', timestamp: new Date('2024-12-01T10:01:00'), type: 'PAYMENT_CAPTURED', title: 'Payment captured', description: 'Visa ****4242' },
      { id: 't3', timestamp: new Date('2024-12-02T14:00:00'), type: 'ITEM_SHIPPED', title: 'Shipped', description: 'Tracking: 1Z999AA10123456784' },
      { id: 't4', timestamp: new Date('2024-12-05T11:30:00'), type: 'ITEM_DELIVERED', title: 'Delivered' },
    ],
    notes: [],
  },
];

async function searchOrders(params: OrderSearchParams): Promise<OrderSearchResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filtered = [...mockOrders];

  if (params.q) {
    const query = params.q.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query) ||
        o.customerEmail.toLowerCase().includes(query)
    );
  }

  if (params.orderNumber) {
    filtered = filtered.filter((o) =>
      o.orderNumber.toLowerCase().includes(params.orderNumber!.toLowerCase())
    );
  }

  if (params.customerId) {
    filtered = filtered.filter((o) => o.customerId === params.customerId);
  }

  if (params.customerEmail) {
    filtered = filtered.filter((o) =>
      o.customerEmail.toLowerCase() === params.customerEmail!.toLowerCase()
    );
  }

  if (params.status) {
    filtered = filtered.filter((o) => o.status === params.status);
  }

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / params.size);
  const start = params.page * params.size;
  const orders = filtered.slice(start, start + params.size);

  return {
    orders,
    totalCount,
    totalPages,
    currentPage: params.page,
  };
}

async function getOrderById(orderId: string): Promise<Order | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockOrders.find((o) => o.id === orderId || o.orderNumber === orderId) || null;
}

export function useOrderLookup() {
  const [searchParams, setSearchParams] = useState<OrderSearchParams>({
    page: 0,
    size: 10,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', 'search', searchParams],
    queryFn: () => searchOrders(searchParams),
    enabled: Object.keys(searchParams).some((k) => k !== 'page' && k !== 'size' && searchParams[k as keyof OrderSearchParams]),
  });

  const search = useCallback((query: string) => {
    setSearchParams((prev) => ({ ...prev, q: query, page: 0 }));
  }, []);

  const searchByOrderNumber = useCallback((orderNumber: string) => {
    setSearchParams((prev) => ({ ...prev, orderNumber, page: 0 }));
  }, []);

  const searchByCustomer = useCallback((identifier: { email?: string; phone?: string; id?: string }) => {
    setSearchParams((prev) => ({
      ...prev,
      customerEmail: identifier.email,
      customerPhone: identifier.phone,
      customerId: identifier.id,
      page: 0,
    }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchParams({ page: 0, size: 10 });
  }, []);

  return {
    orders: data?.orders ?? [],
    totalCount: data?.totalCount ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 0,
    isLoading,
    error,
    search,
    searchByOrderNumber,
    searchByCustomer,
    clearSearch,
    refresh: refetch,
  };
}

export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => (orderId ? getOrderById(orderId) : null),
    enabled: !!orderId,
  });
}
