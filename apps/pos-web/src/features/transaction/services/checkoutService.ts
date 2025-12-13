/**
 * POS Checkout Service
 *
 * Handles the checkout flow using the real backend services:
 * 1. Creates a cart with cart-service
 * 2. Adds items to the cart
 * 3. Initiates checkout with checkout-service
 * 4. Completes checkout with payment
 *
 * This bridges the gap between the local POS transaction model
 * and the backend cart/checkout services.
 */

export interface TransactionItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  markdown?: {
    type: string;
    value: number;
    reason: string;
  };
}

export interface PaymentInfo {
  method: string;
  amount: number;
  lastFour?: string;
}

export interface CompleteTransactionRequest {
  transactionId: string;
  storeNumber: number;
  employeeId: string;
  customerId?: string;
  items: TransactionItem[];
  payments: PaymentInfo[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  fulfillmentType?: string;
}

export interface CompleteTransactionResponse {
  orderId: string;
  orderNumber: string;
  status: string;
}

// Cache the auth token
let cachedToken: string | null = null;

/**
 * Get an auth token from fake-auth service
 */
async function getAuthToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

  const response = await fetch('/fake-auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get auth token');
  }

  const data = await response.json();
  cachedToken = data.access_token;
  return cachedToken;
}

/**
 * Build common headers required by backend services
 */
async function buildHeaders(storeNumber: number): Promise<Record<string, string>> {
  const orderNumber = crypto.randomUUID();
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-store-number': String(storeNumber),
    'x-order-number': orderNumber,
    'x-userid': 'pos-terminal',
    'x-sessionid': crypto.randomUUID(),
  };
}

/**
 * Complete a POS transaction using the real backend services.
 *
 * Flow:
 * 1. Create a cart
 * 2. Add all items to the cart
 * 3. Initiate checkout
 * 4. Complete checkout with payment
 */
export async function completeTransaction(
  request: CompleteTransactionRequest
): Promise<CompleteTransactionResponse> {
  const headers = await buildHeaders(request.storeNumber);

  // Step 1: Create a cart
  const cartResponse = await fetch('/carts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      storeNumber: request.storeNumber,
      customerId: request.customerId || null,
    }),
  });

  if (!cartResponse.ok) {
    throw new Error('Failed to create cart');
  }

  const cart = await cartResponse.json();
  const cartId = cart.id;

  // Step 2: Add items to the cart
  for (const item of request.items) {
    const addItemResponse = await fetch(`/carts/${cartId}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sku: item.sku,
        quantity: item.quantity,
      }),
    });

    if (!addItemResponse.ok) {
      throw new Error(`Failed to add item ${item.sku} to cart`);
    }
  }

  // Step 3: Initiate checkout
  const initiateResponse = await fetch('/checkout/initiate', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      cartId,
      fulfillmentType: mapFulfillmentType(request.fulfillmentType),
    }),
  });

  if (!initiateResponse.ok) {
    throw new Error('Failed to initiate checkout');
  }

  const checkoutSummary = await initiateResponse.json();
  const checkoutSessionId = checkoutSummary.checkoutSessionId;

  // Step 4: Complete checkout with payment
  const primaryPayment = request.payments[0];
  const completeResponse = await fetch('/checkout/complete', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      checkoutSessionId,
      paymentMethod: mapPaymentMethod(primaryPayment.method),
      paymentDetails: primaryPayment.lastFour
        ? {
            cardLast4: primaryPayment.lastFour,
            cardBrand: 'VISA',
          }
        : undefined,
    }),
  });

  if (!completeResponse.ok) {
    throw new Error('Failed to complete checkout');
  }

  const orderResult = await completeResponse.json();

  return {
    orderId: orderResult.orderId,
    orderNumber: orderResult.orderNumber,
    status: orderResult.status,
  };
}

/**
 * Map POS fulfillment types to checkout-service types
 */
function mapFulfillmentType(type?: string): string {
  switch (type?.toUpperCase()) {
    case 'PICKUP':
      return 'PICKUP';
    case 'DELIVERY':
      return 'DELIVERY';
    case 'IMMEDIATE':
    case 'TAKE_NOW':
    default:
      return 'IMMEDIATE';
  }
}

/**
 * Map POS payment methods to checkout-service types
 */
function mapPaymentMethod(method: string): string {
  switch (method.toUpperCase()) {
    case 'CARD':
    case 'CREDIT':
      return 'CREDIT';
    case 'DEBIT':
      return 'DEBIT';
    case 'CASH':
    default:
      return 'CASH';
  }
}
