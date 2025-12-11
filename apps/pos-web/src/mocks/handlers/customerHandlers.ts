/**
 * Customer MSW handlers for POS E2E testing
 */

import { http, HttpResponse, delay } from 'msw';
import {
  findCustomerById,
  findCustomerByEmail,
  findCustomerByPhone,
  searchCustomers,
  getLoyaltyDiscount,
  getB2BDiscount,
  calculateLoyaltyPoints,
  mockCustomers,
  type MockCustomer,
} from '../data/customers';

export const customerHandlers = [
  // Customer lookup by ID
  http.get('*/api/customers/:id', async ({ params }) => {
    await delay(100);

    const id = params.id as string;
    const customer = findCustomerById(id);

    if (!customer) {
      return HttpResponse.json(
        { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return HttpResponse.json(formatCustomerResponse(customer));
  }),

  // Customer search
  http.get('*/api/customers/search', async ({ request }) => {
    await delay(150);

    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const type = url.searchParams.get('type') as 'D2C' | 'B2B' | null;

    let results = query ? searchCustomers(query) : [...mockCustomers];

    if (type) {
      results = results.filter((c) => c.type === type);
    }

    return HttpResponse.json({
      customers: results.map(formatCustomerResponse),
      total: results.length,
    });
  }),

  // Customer lookup by email
  http.get('*/api/customers/by-email/:email', async ({ params }) => {
    await delay(100);

    const email = params.email as string;
    const customer = findCustomerByEmail(email);

    if (!customer) {
      return HttpResponse.json(
        { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return HttpResponse.json(formatCustomerResponse(customer));
  }),

  // Customer lookup by phone
  http.get('*/api/customers/by-phone/:phone', async ({ params }) => {
    await delay(100);

    const phone = params.phone as string;
    const customer = findCustomerByPhone(phone);

    if (!customer) {
      return HttpResponse.json(
        { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return HttpResponse.json(formatCustomerResponse(customer));
  }),

  // Create new customer
  http.post('*/api/customers', async ({ request }) => {
    await delay(200);

    const body = (await request.json()) as Partial<MockCustomer>;

    // Check for duplicate email
    if (body.email && findCustomerByEmail(body.email)) {
      return HttpResponse.json(
        { error: 'Email already exists', code: 'DUPLICATE_EMAIL' },
        { status: 409 }
      );
    }

    const newCustomer: MockCustomer = {
      id: `CUST-${body.type}-${Date.now()}`,
      type: body.type || 'D2C',
      email: body.email || '',
      phone: body.phone || '',
      firstName: body.firstName || '',
      lastName: body.lastName || '',
      companyName: body.companyName,
      loyaltyTier: body.type === 'D2C' ? 'BRONZE' : undefined,
      loyaltyPoints: body.type === 'D2C' ? 0 : undefined,
      b2bTier: body.b2bTier,
      creditLimit: body.creditLimit,
      availableCredit: body.creditLimit,
      paymentTerms: body.paymentTerms,
      addresses: body.addresses || [],
      createdAt: new Date(),
    };

    // In real implementation, would save to DB
    mockCustomers.push(newCustomer);

    return HttpResponse.json(formatCustomerResponse(newCustomer), { status: 201 });
  }),

  // Update customer
  http.patch('*/api/customers/:id', async ({ params, request }) => {
    await delay(150);

    const id = params.id as string;
    const updates = (await request.json()) as Partial<MockCustomer>;
    const customer = findCustomerById(id);

    if (!customer) {
      return HttpResponse.json(
        { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Apply updates (in real implementation, would persist)
    Object.assign(customer, updates);

    return HttpResponse.json(formatCustomerResponse(customer));
  }),

  // Add loyalty points
  http.post('*/api/customers/:id/loyalty/points', async ({ params, request }) => {
    await delay(100);

    const id = params.id as string;
    const body = (await request.json()) as { amount: number; transactionId: string };
    const customer = findCustomerById(id);

    if (!customer) {
      return HttpResponse.json(
        { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (customer.type !== 'D2C') {
      return HttpResponse.json(
        { error: 'Loyalty not available for B2B', code: 'NOT_APPLICABLE' },
        { status: 400 }
      );
    }

    const pointsEarned = calculateLoyaltyPoints(body.amount);
    customer.loyaltyPoints = (customer.loyaltyPoints || 0) + pointsEarned;

    return HttpResponse.json({
      customerId: customer.id,
      pointsEarned,
      newBalance: customer.loyaltyPoints,
      transactionId: body.transactionId,
    });
  }),

  // Check B2B credit
  http.get('*/api/customers/:id/credit', async ({ params, request }) => {
    await delay(100);

    const id = params.id as string;
    const url = new URL(request.url);
    const requestedAmount = parseFloat(url.searchParams.get('amount') || '0');

    const customer = findCustomerById(id);

    if (!customer) {
      return HttpResponse.json(
        { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (customer.type !== 'B2B') {
      return HttpResponse.json(
        { error: 'Credit not applicable for D2C', code: 'NOT_APPLICABLE' },
        { status: 400 }
      );
    }

    const approved = requestedAmount <= (customer.availableCredit || 0);

    return HttpResponse.json({
      customerId: customer.id,
      creditLimit: customer.creditLimit,
      availableCredit: customer.availableCredit,
      requestedAmount,
      approved,
      reason: approved ? null : 'Exceeds available credit',
    });
  }),

  // Get customer addresses
  http.get('*/api/customers/:id/addresses', async ({ params }) => {
    await delay(100);

    const id = params.id as string;
    const customer = findCustomerById(id);

    if (!customer) {
      return HttpResponse.json(
        { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      addresses: customer.addresses,
    });
  }),

  // Add customer address
  http.post('*/api/customers/:id/addresses', async ({ params, request }) => {
    await delay(150);

    const id = params.id as string;
    const address = (await request.json()) as MockCustomer['addresses'][0];
    const customer = findCustomerById(id);

    if (!customer) {
      return HttpResponse.json(
        { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const newAddress = {
      ...address,
      id: `addr-${Date.now()}`,
    };

    customer.addresses.push(newAddress);

    return HttpResponse.json(newAddress, { status: 201 });
  }),
];

function formatCustomerResponse(customer: MockCustomer) {
  const baseResponse = {
    id: customer.id,
    type: customer.type,
    email: customer.email,
    phone: customer.phone,
    firstName: customer.firstName,
    lastName: customer.lastName,
    fullName: customer.companyName || `${customer.firstName} ${customer.lastName}`,
    addresses: customer.addresses,
    createdAt: customer.createdAt.toISOString(),
  };

  if (customer.type === 'D2C') {
    return {
      ...baseResponse,
      loyalty: {
        tier: customer.loyaltyTier,
        points: customer.loyaltyPoints,
        discount: getLoyaltyDiscount(customer.loyaltyTier!),
      },
    };
  }

  return {
    ...baseResponse,
    companyName: customer.companyName,
    b2b: {
      tier: customer.b2bTier,
      creditLimit: customer.creditLimit,
      availableCredit: customer.availableCredit,
      paymentTerms: customer.paymentTerms,
      discount: getB2BDiscount(customer.b2bTier!),
      taxExempt: customer.taxExempt,
      taxExemptId: customer.taxExemptId,
    },
  };
}
