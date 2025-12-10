/**
 * Mock order data for POS E2E testing
 * @see 045G_POS_E2E_TESTING.md - Test Data Strategy
 */

import type { OrderStatus, ShipmentStatus } from '../../features/orders/types/order';

export interface MockOrderItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  markdown?: {
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    reason: string;
  };
}

export interface MockOrderPayment {
  id: string;
  method: 'CARD' | 'CASH' | 'NET_TERMS' | 'GIFT_CARD';
  amount: number;
  status: 'CAPTURED' | 'AUTHORIZED' | 'REFUNDED' | 'PENDING';
  cardLast4?: string;
  authCode?: string;
}

export interface MockShipment {
  id: string;
  status: ShipmentStatus;
  itemIds: string[];
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  storeNumber: number;
  employeeId: string;
  status: OrderStatus;
  items: MockOrderItem[];
  payments: MockOrderPayment[];
  shipments: MockShipment[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  poNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const mockOrders: MockOrder[] = [
  // Completed in-store transaction
  {
    id: 'order-001',
    orderNumber: 'POS-2024-001234',
    customerId: 'CUST-D2C-001',
    customerName: 'Jane Consumer',
    storeNumber: 1234,
    employeeId: 'EMP001',
    status: 'COMPLETE',
    items: [
      {
        id: 'item-001',
        sku: 'SKU-WIDGET-001',
        name: 'Widget Pro XL',
        quantity: 1,
        unitPrice: 149.99,
        lineTotal: 149.99,
      },
      {
        id: 'item-002',
        sku: 'SKU-ACC-001',
        name: 'Widget Accessory Pack',
        quantity: 2,
        unitPrice: 29.99,
        lineTotal: 59.98,
      },
    ],
    payments: [
      {
        id: 'pay-001',
        method: 'CARD',
        amount: 226.77,
        status: 'CAPTURED',
        cardLast4: '4242',
        authCode: 'AUTH123',
      },
    ],
    shipments: [],
    subtotal: 209.97,
    taxTotal: 16.80,
    grandTotal: 226.77,
    createdAt: new Date('2024-12-08T14:30:00'),
    updatedAt: new Date('2024-12-08T14:32:00'),
  },

  // Order pending shipment
  {
    id: 'order-002',
    orderNumber: 'POS-2024-001235',
    customerId: 'CUST-D2C-002',
    customerName: 'Bob Shopper',
    storeNumber: 1234,
    employeeId: 'EMP005',
    status: 'PROCESSING',
    items: [
      {
        id: 'item-003',
        sku: 'SKU-WIDGET-002',
        name: 'Widget Standard',
        quantity: 3,
        unitPrice: 79.99,
        lineTotal: 239.97,
      },
    ],
    payments: [
      {
        id: 'pay-002',
        method: 'CARD',
        amount: 259.17,
        status: 'CAPTURED',
        cardLast4: '1234',
        authCode: 'AUTH456',
      },
    ],
    shipments: [
      {
        id: 'ship-001',
        status: 'PROCESSING',
        itemIds: ['item-003'],
        estimatedDelivery: new Date('2024-12-15'),
      },
    ],
    subtotal: 239.97,
    taxTotal: 19.20,
    grandTotal: 259.17,
    createdAt: new Date('2024-12-08T10:15:00'),
    updatedAt: new Date('2024-12-08T10:20:00'),
  },

  // B2B order with net terms
  {
    id: 'order-003',
    orderNumber: 'B2B-2024-000567',
    customerId: 'CUST-B2B-001',
    customerName: 'ACME Corp',
    storeNumber: 9999,
    employeeId: 'EMP006',
    status: 'PROCESSING',
    items: [
      {
        id: 'item-004',
        sku: 'SKU-BULK-001',
        name: 'Widget Case (24 units)',
        quantity: 5,
        unitPrice: 1079.89, // With PREMIER discount
        lineTotal: 5399.45,
      },
    ],
    payments: [
      {
        id: 'pay-003',
        method: 'NET_TERMS',
        amount: 5831.41,
        status: 'PENDING',
      },
    ],
    shipments: [
      {
        id: 'ship-002',
        status: 'SHIPPED',
        itemIds: ['item-004'],
        trackingNumber: 'TRK123456789',
        carrier: 'FedEx',
        estimatedDelivery: new Date('2024-12-12'),
      },
    ],
    subtotal: 5399.45,
    taxTotal: 431.96,
    grandTotal: 5831.41,
    poNumber: 'PO-ACME-2024-001',
    createdAt: new Date('2024-12-07T09:00:00'),
    updatedAt: new Date('2024-12-08T08:00:00'),
  },

  // Order with markdown
  {
    id: 'order-004',
    orderNumber: 'POS-2024-001236',
    customerName: 'Walk-in Customer',
    storeNumber: 1234,
    employeeId: 'EMP001',
    status: 'COMPLETE',
    items: [
      {
        id: 'item-005',
        sku: 'SKU-DAMAGED-001',
        name: 'Widget Pro (Damaged Box)',
        quantity: 1,
        unitPrice: 127.49,
        lineTotal: 127.49,
        markdown: {
          type: 'PERCENTAGE',
          value: 15,
          reason: 'DAMAGED_ITEM',
        },
      },
    ],
    payments: [
      {
        id: 'pay-004',
        method: 'CASH',
        amount: 137.69,
        status: 'CAPTURED',
      },
    ],
    shipments: [],
    subtotal: 127.49,
    taxTotal: 10.20,
    grandTotal: 137.69,
    createdAt: new Date('2024-12-08T16:45:00'),
    updatedAt: new Date('2024-12-08T16:48:00'),
  },

  // Delivered order (for return testing)
  {
    id: 'order-005',
    orderNumber: 'POS-2024-001100',
    customerId: 'CUST-D2C-001',
    customerName: 'Jane Consumer',
    storeNumber: 1234,
    employeeId: 'EMP001',
    status: 'COMPLETE',
    items: [
      {
        id: 'item-006',
        sku: 'SKU-WIDGET-001',
        name: 'Widget Pro XL',
        quantity: 2,
        unitPrice: 149.99,
        lineTotal: 299.98,
      },
    ],
    payments: [
      {
        id: 'pay-005',
        method: 'CARD',
        amount: 323.98,
        status: 'CAPTURED',
        cardLast4: '4242',
        authCode: 'AUTH789',
      },
    ],
    shipments: [
      {
        id: 'ship-003',
        status: 'DELIVERED',
        itemIds: ['item-006'],
        trackingNumber: 'TRK987654321',
        carrier: 'UPS',
        estimatedDelivery: new Date('2024-12-05'),
        actualDelivery: new Date('2024-12-04'),
      },
    ],
    subtotal: 299.98,
    taxTotal: 24.00,
    grandTotal: 323.98,
    createdAt: new Date('2024-12-01T11:00:00'),
    updatedAt: new Date('2024-12-04T15:30:00'),
  },

  // Partially refunded order
  {
    id: 'order-006',
    orderNumber: 'POS-2024-001050',
    customerName: 'Walk-in Customer',
    storeNumber: 1234,
    employeeId: 'EMP001',
    status: 'PARTIAL_REFUND',
    items: [
      {
        id: 'item-007',
        sku: 'SKU-WIDGET-002',
        name: 'Widget Standard',
        quantity: 1,
        unitPrice: 79.99,
        lineTotal: 79.99,
      },
      {
        id: 'item-008',
        sku: 'SKU-ACC-001',
        name: 'Widget Accessory Pack',
        quantity: 1,
        unitPrice: 29.99,
        lineTotal: 29.99,
      },
    ],
    payments: [
      {
        id: 'pay-006a',
        method: 'CARD',
        amount: 118.78,
        status: 'CAPTURED',
        cardLast4: '5555',
        authCode: 'AUTH321',
      },
      {
        id: 'pay-006b',
        method: 'CARD',
        amount: -32.39,
        status: 'REFUNDED',
        cardLast4: '5555',
      },
    ],
    shipments: [],
    subtotal: 109.98,
    taxTotal: 8.80,
    grandTotal: 86.39, // After partial refund
    createdAt: new Date('2024-12-06T13:00:00'),
    updatedAt: new Date('2024-12-07T09:00:00'),
  },
];

export function findOrderById(id: string): MockOrder | undefined {
  return mockOrders.find((o) => o.id === id);
}

export function findOrderByNumber(orderNumber: string): MockOrder | undefined {
  return mockOrders.find((o) => o.orderNumber === orderNumber);
}

export function findOrdersByCustomer(customerId: string): MockOrder[] {
  return mockOrders.filter((o) => o.customerId === customerId);
}

export function searchOrders(query: string): MockOrder[] {
  const lowerQuery = query.toLowerCase();
  return mockOrders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(lowerQuery) ||
      o.customerName.toLowerCase().includes(lowerQuery) ||
      o.poNumber?.toLowerCase().includes(lowerQuery)
  );
}
