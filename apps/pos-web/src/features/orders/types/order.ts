// Order Types

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PARTIALLY_SHIPPED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type ShipmentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION';

export type ReturnStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'RECEIVED'
  | 'INSPECTING'
  | 'PROCESSED'
  | 'REFUNDED'
  | 'REJECTED';

export type ReturnReason =
  | 'WRONG_ITEM'
  | 'DAMAGED'
  | 'DEFECTIVE'
  | 'NOT_AS_DESCRIBED'
  | 'CHANGED_MIND'
  | 'DUPLICATE_ORDER'
  | 'OTHER';

export type RefundMethod =
  | 'ORIGINAL_PAYMENT'
  | 'STORE_CREDIT'
  | 'EXCHANGE';

export interface OrderLineItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  imageUrl?: string;
  fulfillmentGroupId: string;
  returnableQuantity: number;
  returnedQuantity: number;
}

export interface OrderFulfillmentGroup {
  id: string;
  type: 'IMMEDIATE' | 'PICKUP' | 'DELIVERY' | 'WILL_CALL' | 'INSTALLATION';
  status: ShipmentStatus;
  items: string[]; // Line item IDs
  address?: OrderAddress;
  storeNumber?: number;
  storeName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  cost: number;
}

export interface OrderAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface OrderPayment {
  id: string;
  method: string;
  amount: number;
  status: 'CAPTURED' | 'REFUNDED' | 'PARTIAL_REFUND';
  lastFour?: string;
  cardBrand?: string;
  capturedAt: Date;
  refundedAmount?: number;
}

export interface OrderTimeline {
  id: string;
  timestamp: Date;
  type: OrderTimelineType;
  title: string;
  description?: string;
  userId?: string;
  userName?: string;
}

export type OrderTimelineType =
  | 'ORDER_PLACED'
  | 'ORDER_CONFIRMED'
  | 'PAYMENT_CAPTURED'
  | 'ORDER_PROCESSING'
  | 'ITEM_SHIPPED'
  | 'ITEM_DELIVERED'
  | 'ORDER_COMPLETE'
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURN_RECEIVED'
  | 'REFUND_ISSUED'
  | 'ORDER_CANCELLED'
  | 'NOTE_ADDED';

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;

  // Customer
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  isB2B: boolean;

  // B2B specific
  purchaseOrderNumber?: string;
  companyName?: string;
  paymentTerms?: string;

  // Items
  items: OrderLineItem[];
  fulfillmentGroups: OrderFulfillmentGroup[];

  // Totals
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;

  // Payments
  payments: OrderPayment[];
  amountPaid: number;
  amountRefunded: number;
  balanceDue: number;

  // Store
  storeNumber: number;
  storeName: string;
  employeeId: string;
  employeeName: string;

  // Dates
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;

  // History
  timeline: OrderTimeline[];
  notes: OrderNote[];
}

export interface OrderNote {
  id: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  isPinned: boolean;
}

export interface OrderSearchParams {
  q?: string;
  orderNumber?: string;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
  storeNumber?: number;
  page: number;
  size: number;
}

export interface OrderSearchResult {
  orders: Order[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface ReturnRequest {
  orderId: string;
  items: ReturnItem[];
  reason: ReturnReason;
  refundMethod: RefundMethod;
  notes?: string;
}

export interface ReturnItem {
  lineItemId: string;
  quantity: number;
  reason?: ReturnReason;
  condition?: 'NEW' | 'OPENED' | 'DAMAGED';
}

export interface ReturnResult {
  returnId: string;
  status: ReturnStatus;
  refundAmount: number;
  items: ReturnItem[];
}

// Status display configuration
export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-500' },
  PROCESSING: { label: 'Processing', color: 'bg-blue-400' },
  PARTIALLY_SHIPPED: { label: 'Partially Shipped', color: 'bg-purple-500' },
  SHIPPED: { label: 'Shipped', color: 'bg-indigo-500' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500' },
  RETURNED: { label: 'Returned', color: 'bg-gray-500' },
};

export const SHIPMENT_STATUS_CONFIG: Record<ShipmentStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500' },
  PROCESSING: { label: 'Processing', color: 'bg-blue-400' },
  SHIPPED: { label: 'Shipped', color: 'bg-indigo-500' },
  IN_TRANSIT: { label: 'In Transit', color: 'bg-purple-500' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-cyan-500' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-500' },
  EXCEPTION: { label: 'Exception', color: 'bg-red-500' },
};

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  WRONG_ITEM: 'Wrong item received',
  DAMAGED: 'Item arrived damaged',
  DEFECTIVE: 'Item is defective',
  NOT_AS_DESCRIBED: 'Not as described',
  CHANGED_MIND: 'Changed mind',
  DUPLICATE_ORDER: 'Duplicate order',
  OTHER: 'Other reason',
};
