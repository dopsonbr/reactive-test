/**
 * Order MSW handlers for POS E2E testing
 */

import { http, HttpResponse, delay } from 'msw';
import {
  findOrderById,
  findOrderByNumber,
  findOrdersByCustomer,
  searchOrders,
  mockOrders,
} from '../data/orders';

export const orderHandlers = [
  // Get order by ID
  http.get('*/api/orders/:id', async ({ params }) => {
    await delay(100);

    const id = params.id as string;
    const order = findOrderById(id);

    if (!order) {
      return HttpResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return HttpResponse.json(formatOrderResponse(order));
  }),

  // Get order by order number
  http.get('*/api/orders/by-number/:orderNumber', async ({ params }) => {
    await delay(100);

    const orderNumber = params.orderNumber as string;
    const order = findOrderByNumber(orderNumber);

    if (!order) {
      return HttpResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return HttpResponse.json(formatOrderResponse(order));
  }),

  // Search orders
  http.get('*/api/orders/search', async ({ request }) => {
    await delay(150);

    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const customerId = url.searchParams.get('customerId');
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    let results = query ? searchOrders(query) : [...mockOrders];

    if (customerId) {
      results = findOrdersByCustomer(customerId);
    }

    if (status) {
      results = results.filter((o) => o.status === status);
    }

    // Sort by date descending
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedResults = results.slice(start, start + limit);

    return HttpResponse.json({
      orders: paginatedResults.map(formatOrderSummary),
      total,
      page,
      totalPages,
    });
  }),

  // Get orders by customer
  http.get('*/api/customers/:customerId/orders', async ({ params, request }) => {
    await delay(100);

    const customerId = params.customerId as string;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    const orders = findOrdersByCustomer(customerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return HttpResponse.json({
      orders: orders.map(formatOrderSummary),
      total: orders.length,
    });
  }),

  // Get order timeline
  http.get('*/api/orders/:id/timeline', async ({ params }) => {
    await delay(100);

    const id = params.id as string;
    const order = findOrderById(id);

    if (!order) {
      return HttpResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Generate timeline from order data
    const timeline = generateOrderTimeline(order);

    return HttpResponse.json({
      orderId: order.id,
      timeline,
    });
  }),

  // Update order (limited fields)
  http.patch('*/api/orders/:id', async ({ params, request }) => {
    await delay(150);

    const id = params.id as string;
    const body = (await request.json()) as { notes?: string; tags?: string[] };
    const order = findOrderById(id);

    if (!order) {
      return HttpResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Apply limited updates
    order.updatedAt = new Date();

    return HttpResponse.json(formatOrderResponse(order));
  }),

  // Cancel order
  http.post('*/api/orders/:id/cancel', async ({ params, request }) => {
    await delay(300);

    const id = params.id as string;
    const body = (await request.json()) as { reason: string };
    const order = findOrderById(id);

    if (!order) {
      return HttpResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if order can be cancelled
    if (['COMPLETE', 'CANCELLED', 'REFUNDED'].includes(order.status)) {
      return HttpResponse.json(
        {
          error: 'Order cannot be cancelled',
          code: 'CANNOT_CANCEL',
          reason: `Order is already ${order.status}`,
        },
        { status: 400 }
      );
    }

    // Check if shipped
    const hasShipped = order.shipments.some((s) =>
      ['SHIPPED', 'DELIVERED'].includes(s.status)
    );
    if (hasShipped) {
      return HttpResponse.json(
        {
          error: 'Order cannot be cancelled',
          code: 'ALREADY_SHIPPED',
          reason: 'Order has already shipped. Please initiate a return instead.',
        },
        { status: 400 }
      );
    }

    order.status = 'CANCELLED';
    order.updatedAt = new Date();

    return HttpResponse.json({
      orderId: order.id,
      status: 'CANCELLED',
      cancelReason: body.reason,
      refundInitiated: true,
    });
  }),

  // Initiate return
  http.post('*/api/orders/:id/returns', async ({ params, request }) => {
    await delay(200);

    const id = params.id as string;
    const body = (await request.json()) as {
      items: { itemId: string; quantity: number; reason: string }[];
      refundMethod: 'ORIGINAL_PAYMENT' | 'STORE_CREDIT' | 'EXCHANGE';
    };
    const order = findOrderById(id);

    if (!order) {
      return HttpResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const returnId = `ret-${Date.now()}`;

    return HttpResponse.json({
      returnId,
      orderId: order.id,
      status: 'PENDING',
      items: body.items,
      refundMethod: body.refundMethod,
      returnLabel: body.refundMethod !== 'EXCHANGE' ? `LABEL-${returnId}` : null,
      createdAt: new Date().toISOString(),
    });
  }),

  // Get daily report (manager)
  http.get('*/api/reports/daily', async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const storeNumber = parseInt(url.searchParams.get('store') || '1234', 10);

    // Generate mock daily report
    return HttpResponse.json({
      date,
      storeNumber,
      summary: {
        transactionCount: 47,
        totalSales: 12450.0,
        averageTransaction: 264.89,
        itemsSold: 156,
      },
      paymentBreakdown: {
        card: { count: 38, total: 10250.0 },
        cash: { count: 9, total: 2200.0 },
        netTerms: { count: 0, total: 0 },
      },
      markdowns: {
        count: 5,
        totalDiscount: 175.5,
        reasons: {
          DAMAGED_ITEM: 2,
          PRICE_MATCH: 2,
          CUSTOMER_SERVICE: 1,
        },
      },
      returns: {
        count: 2,
        totalRefunded: 89.98,
      },
      topItems: [
        { sku: 'SKU-WIDGET-001', name: 'Widget Pro XL', quantity: 15, revenue: 2249.85 },
        { sku: 'SKU-WIDGET-002', name: 'Widget Standard', quantity: 28, revenue: 2239.72 },
        { sku: 'SKU-ACC-001', name: 'Widget Accessory Pack', quantity: 45, revenue: 1349.55 },
      ],
    });
  }),
];

function formatOrderResponse(order: (typeof mockOrders)[0]) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    customerName: order.customerName,
    storeNumber: order.storeNumber,
    employeeId: order.employeeId,
    status: order.status,
    items: order.items,
    payments: order.payments.map((p) => ({
      ...p,
      amount: p.amount.toFixed(2),
    })),
    shipments: order.shipments.map((s) => ({
      ...s,
      estimatedDelivery: s.estimatedDelivery?.toISOString(),
      actualDelivery: s.actualDelivery?.toISOString(),
    })),
    totals: {
      subtotal: order.subtotal.toFixed(2),
      taxTotal: order.taxTotal.toFixed(2),
      grandTotal: order.grandTotal.toFixed(2),
    },
    poNumber: order.poNumber,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function formatOrderSummary(order: (typeof mockOrders)[0]) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    status: order.status,
    itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
    grandTotal: order.grandTotal.toFixed(2),
    createdAt: order.createdAt.toISOString(),
  };
}

function generateOrderTimeline(order: (typeof mockOrders)[0]) {
  const timeline = [
    {
      id: `tl-${order.id}-1`,
      type: 'ORDER_PLACED',
      title: 'Order Placed',
      timestamp: order.createdAt.toISOString(),
    },
  ];

  // Add payment events
  for (const payment of order.payments) {
    if (payment.status === 'CAPTURED') {
      timeline.push({
        id: `tl-${payment.id}`,
        type: 'PAYMENT_CAPTURED',
        title: `Payment Captured - ${payment.method}`,
        timestamp: order.createdAt.toISOString(),
      });
    }
  }

  // Add shipment events
  for (const shipment of order.shipments) {
    if (shipment.status === 'SHIPPED') {
      timeline.push({
        id: `tl-${shipment.id}-shipped`,
        type: 'ITEM_SHIPPED',
        title: 'Items Shipped',
        description: `Tracking: ${shipment.trackingNumber}`,
        timestamp: order.updatedAt.toISOString(),
      });
    }
    if (shipment.status === 'DELIVERED' && shipment.actualDelivery) {
      timeline.push({
        id: `tl-${shipment.id}-delivered`,
        type: 'ITEM_DELIVERED',
        title: 'Items Delivered',
        timestamp: shipment.actualDelivery.toISOString(),
      });
    }
  }

  // Sort by timestamp
  timeline.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return timeline;
}
