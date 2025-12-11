import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Order, OrderSearchParams, OrderSearchResult } from '../types/order';

// API-based order search - MSW intercepts in dev mode
async function searchOrders(params: OrderSearchParams): Promise<OrderSearchResult> {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set('q', params.q);
  if (params.orderNumber) searchParams.set('orderNumber', params.orderNumber);
  if (params.customerId) searchParams.set('customerId', params.customerId);
  if (params.customerEmail) searchParams.set('customerEmail', params.customerEmail);
  if (params.status) searchParams.set('status', params.status);
  searchParams.set('page', String((params.page || 0) + 1)); // API uses 1-based pages
  searchParams.set('limit', String(params.size || 10));

  const response = await fetch(`/api/orders/search?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to search orders');
  }

  const data = await response.json();

  // Transform API response to match OrderSearchResult format
  // Search returns summaries with itemCount, not full items array
  return {
    orders: data.orders.map(transformOrderSummary),
    totalCount: data.total,
    totalPages: data.totalPages,
    currentPage: data.page - 1, // Convert to 0-based
  };
}

async function getOrderById(orderId: string): Promise<Order | null> {
  const response = await fetch(`/api/orders/${orderId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch order');
  }

  const data = await response.json();
  return transformOrderResponse(data);
}

// Transform search summary response to Order type
// Search endpoint returns simplified summary with itemCount instead of full items array
function transformOrderSummary(data: Record<string, unknown>): Order {
  const itemCount = (data.itemCount as number) || 0;
  const grandTotal = parseFloat(String(data.grandTotal || '0'));

  return {
    id: data.id as string,
    orderNumber: data.orderNumber as string,
    status: data.status as Order['status'],
    customerId: (data.customerId as string) || '',
    customerName: data.customerName as string,
    customerEmail: '',
    customerPhone: '',
    isB2B: false,
    companyName: undefined,
    // Create placeholder items array from itemCount for display purposes
    items: Array.from({ length: itemCount }, (_, i) => ({
      id: `placeholder-${i}`,
      sku: '',
      name: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      lineTotal: 0,
      fulfillmentGroupId: '',
      returnableQuantity: 1,
      returnedQuantity: 0,
    })),
    fulfillmentGroups: [],
    subtotal: grandTotal,
    discountTotal: 0,
    taxTotal: 0,
    shippingTotal: 0,
    grandTotal,
    payments: [],
    amountPaid: grandTotal,
    amountRefunded: 0,
    balanceDue: 0,
    storeNumber: 0,
    storeName: '',
    employeeId: '',
    employeeName: '',
    createdAt: data.createdAt ? new Date(data.createdAt as string) : new Date(),
    updatedAt: data.createdAt ? new Date(data.createdAt as string) : new Date(),
    completedAt: undefined,
    timeline: [],
    notes: [],
  };
}

// Transform full API response to Order type (for order detail endpoint)
function transformOrderResponse(data: Record<string, unknown>): Order {
  return {
    id: data.id as string,
    orderNumber: data.orderNumber as string,
    status: data.status as Order['status'],
    customerId: (data.customerId as string) || '',
    customerName: data.customerName as string,
    customerEmail: (data.customerEmail as string) || '',
    customerPhone: (data.customerPhone as string) || '',
    isB2B: !!(data.poNumber),
    companyName: data.companyName as string | undefined,
    items: ((data.items as unknown[]) || []).map((item: unknown) => {
      const i = item as Record<string, unknown>;
      return {
        id: i.id as string,
        sku: i.sku as string,
        name: i.name as string,
        quantity: i.quantity as number,
        unitPrice: i.unitPrice as number,
        discount: (i.discount as number) || 0,
        lineTotal: i.lineTotal as number,
        fulfillmentGroupId: i.fulfillmentGroupId as string | undefined,
        returnableQuantity: (i.returnableQuantity as number) || i.quantity as number,
        returnedQuantity: (i.returnedQuantity as number) || 0,
      };
    }),
    fulfillmentGroups: ((data.shipments as unknown[]) || []).map((ship: unknown) => {
      const s = ship as Record<string, unknown>;
      return {
        id: s.id as string,
        type: s.type as 'PICKUP' | 'DELIVERY' || 'DELIVERY',
        status: s.status as string,
        items: (s.itemIds as string[]) || [],
        trackingNumber: s.trackingNumber as string | undefined,
        carrier: s.carrier as string | undefined,
        estimatedDelivery: s.estimatedDelivery ? new Date(s.estimatedDelivery as string) : undefined,
        actualDelivery: s.actualDelivery ? new Date(s.actualDelivery as string) : undefined,
      };
    }),
    subtotal: parseFloat((data.totals as Record<string, string>)?.subtotal || String(data.subtotal) || '0'),
    discountTotal: parseFloat((data.totals as Record<string, string>)?.discountTotal || '0'),
    taxTotal: parseFloat((data.totals as Record<string, string>)?.taxTotal || String(data.taxTotal) || '0'),
    shippingTotal: parseFloat((data.totals as Record<string, string>)?.shippingTotal || '0'),
    grandTotal: parseFloat((data.totals as Record<string, string>)?.grandTotal || String(data.grandTotal) || '0'),
    payments: ((data.payments as unknown[]) || []).map((pay: unknown) => {
      const p = pay as Record<string, unknown>;
      return {
        id: p.id as string,
        method: p.method as string,
        amount: parseFloat(String(p.amount)),
        status: p.status as string,
        lastFour: p.cardLast4 as string | undefined,
        cardBrand: p.cardBrand as string | undefined,
      };
    }),
    amountPaid: parseFloat(String(data.amountPaid || data.grandTotal || '0')),
    amountRefunded: parseFloat(String(data.amountRefunded || '0')),
    balanceDue: parseFloat(String(data.balanceDue || '0')),
    storeNumber: (data.storeNumber as number) || 0,
    storeName: (data.storeName as string) || `Store #${data.storeNumber}`,
    employeeId: (data.employeeId as string) || '',
    employeeName: (data.employeeName as string) || '',
    createdAt: new Date(data.createdAt as string),
    updatedAt: new Date(data.updatedAt as string),
    completedAt: data.completedAt ? new Date(data.completedAt as string) : undefined,
    timeline: [],
    notes: [],
  };
}

export function useOrderLookup() {
  const [searchParams, setSearchParams] = useState<OrderSearchParams>({
    page: 0,
    size: 10,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', 'search', searchParams],
    queryFn: () => searchOrders(searchParams),
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
