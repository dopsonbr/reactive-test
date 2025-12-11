/**
 * Checkout/Payment MSW handlers for POS E2E testing
 */

import { http, HttpResponse, delay } from 'msw';
import { findCustomerById } from '../data/customers';
import { mockOrders, type MockOrder, type MockOrderPayment } from '../data/orders';

// Simulated payment states
const paymentRequests: Map<string, { status: string; amount: number }> = new Map();

export const checkoutHandlers = [
  // Process card payment
  http.post('*/api/checkout/:cartId/payment/card', async ({ params, request }) => {
    await delay(1500); // Simulate payment processing time

    const cartId = params.cartId as string;
    const body = (await request.json()) as {
      amount: number;
      cardNumber?: string; // Masked in real implementation
      cardLast4: string;
      expiryMonth: string;
      expiryYear: string;
      cvv?: string;
      cardholderName: string;
      billingZip: string;
    };

    // Simulate card validation
    if (body.cardLast4 === '0000') {
      return HttpResponse.json(
        {
          error: 'Card declined',
          code: 'CARD_DECLINED',
          message: 'The card was declined. Please try a different payment method.',
        },
        { status: 402 }
      );
    }

    if (body.cardLast4 === '9999') {
      return HttpResponse.json(
        {
          error: 'Card expired',
          code: 'CARD_EXPIRED',
          message: 'The card has expired. Please use a valid card.',
        },
        { status: 402 }
      );
    }

    const paymentId = `pay-${Date.now()}`;
    const authCode = `AUTH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return HttpResponse.json({
      paymentId,
      status: 'CAPTURED',
      amount: body.amount,
      cardLast4: body.cardLast4,
      authCode,
      timestamp: new Date().toISOString(),
    });
  }),

  // Process cash payment
  http.post('*/api/checkout/:cartId/payment/cash', async ({ params, request }) => {
    await delay(200);

    const cartId = params.cartId as string;
    const body = (await request.json()) as {
      amount: number;
      tendered: number;
    };

    if (body.tendered < body.amount) {
      return HttpResponse.json(
        {
          error: 'Insufficient payment',
          code: 'INSUFFICIENT_PAYMENT',
          message: 'Amount tendered is less than total due.',
        },
        { status: 400 }
      );
    }

    const changeDue = Math.round((body.tendered - body.amount) * 100) / 100;
    const paymentId = `pay-${Date.now()}`;

    return HttpResponse.json({
      paymentId,
      status: 'CAPTURED',
      amount: body.amount,
      tendered: body.tendered,
      changeDue,
      timestamp: new Date().toISOString(),
    });
  }),

  // Process net terms payment (B2B)
  http.post('*/api/checkout/:cartId/payment/net-terms', async ({ params, request }) => {
    await delay(300);

    const cartId = params.cartId as string;
    const body = (await request.json()) as {
      customerId: string;
      amount: number;
      terms: 'NET_30' | 'NET_60' | 'NET_90';
      poNumber?: string;
    };

    const customer = findCustomerById(body.customerId);
    if (!customer || customer.type !== 'B2B') {
      return HttpResponse.json(
        { error: 'Invalid B2B customer', code: 'INVALID_CUSTOMER' },
        { status: 400 }
      );
    }

    // Check credit limit
    if (body.amount > (customer.availableCredit || 0)) {
      return HttpResponse.json(
        {
          error: 'Exceeds credit limit',
          code: 'EXCEEDS_CREDIT',
          availableCredit: customer.availableCredit,
          requestedAmount: body.amount,
        },
        { status: 400 }
      );
    }

    // Check for PO number if ENTERPRISE
    if (customer.b2bTier === 'ENTERPRISE' && !body.poNumber) {
      return HttpResponse.json(
        { error: 'PO number required for ENTERPRISE accounts', code: 'PO_REQUIRED' },
        { status: 400 }
      );
    }

    const paymentId = `pay-${Date.now()}`;
    const daysUntilDue = body.terms === 'NET_30' ? 30 : body.terms === 'NET_60' ? 60 : 90;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysUntilDue);

    // Update customer credit (in real implementation)
    if (customer.availableCredit) {
      customer.availableCredit -= body.amount;
    }

    return HttpResponse.json({
      paymentId,
      status: 'PENDING',
      amount: body.amount,
      terms: body.terms,
      poNumber: body.poNumber,
      dueDate: dueDate.toISOString(),
      invoiceNumber: `INV-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  }),

  // Complete checkout (finalize transaction)
  http.post('*/api/checkout/:cartId/complete', async ({ params, request }) => {
    await delay(300);

    const cartId = params.cartId as string;
    const body = (await request.json()) as {
      payments: MockOrderPayment[];
      customerId?: string;
      fulfillment?: {
        type: string;
        address?: object;
        scheduledDate?: string;
      };
    };

    const orderNumber = `POS-${new Date().getFullYear()}-${String(mockOrders.length + 1).padStart(6, '0')}`;
    const orderId = `order-${Date.now()}`;

    // Create order record (simplified)
    const order: Partial<MockOrder> = {
      id: orderId,
      orderNumber,
      customerId: body.customerId,
      status: 'COMPLETE',
      payments: body.payments,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return HttpResponse.json({
      orderId,
      orderNumber,
      status: 'COMPLETE',
      receiptUrl: `/receipts/${orderId}`,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get receipt
  http.get('*/api/receipts/:orderId', async ({ params }) => {
    await delay(100);

    const orderId = params.orderId as string;

    return HttpResponse.json({
      orderId,
      receiptNumber: `REC-${orderId}`,
      printable: true,
      emailSent: false,
      data: {
        // Receipt data would go here
        generatedAt: new Date().toISOString(),
      },
    });
  }),

  // Send receipt via email
  http.post('*/api/receipts/:orderId/email', async ({ params, request }) => {
    await delay(200);

    const orderId = params.orderId as string;
    const body = (await request.json()) as { email: string };

    return HttpResponse.json({
      success: true,
      orderId,
      emailSentTo: body.email,
      timestamp: new Date().toISOString(),
    });
  }),

  // Process refund
  http.post('*/api/orders/:orderId/refund', async ({ params, request }) => {
    await delay(500);

    const orderId = params.orderId as string;
    const body = (await request.json()) as {
      items: { itemId: string; quantity: number }[];
      reason: string;
      refundMethod: 'ORIGINAL_PAYMENT' | 'STORE_CREDIT';
      authorizedBy: string;
    };

    // Calculate refund amount (simplified)
    const refundAmount = 50.0; // Would calculate from items

    return HttpResponse.json({
      refundId: `ref-${Date.now()}`,
      orderId,
      amount: refundAmount,
      method: body.refundMethod,
      reason: body.reason,
      status: 'PROCESSED',
      timestamp: new Date().toISOString(),
    });
  }),

  // Void transaction
  http.post('*/api/orders/:orderId/void', async ({ params, request }) => {
    await delay(400);

    const orderId = params.orderId as string;
    const body = (await request.json()) as {
      reason: string;
      authorizedBy: string;
    };

    return HttpResponse.json({
      orderId,
      status: 'VOIDED',
      reason: body.reason,
      authorizedBy: body.authorizedBy,
      refundInitiated: true,
      timestamp: new Date().toISOString(),
    });
  }),
];
