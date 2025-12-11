import { http, HttpResponse } from 'msw';
import type { Customer } from '@reactive-platform/commerce-hooks';
import { mockCustomers } from '../data/customers';

const API_BASE = 'http://localhost:8083';

export const customerHandlers = [
  // GET /api/customers/lookup - Lookup customer by phone or email
  http.get(`${API_BASE}/api/customers/lookup`, ({ request }) => {
    const url = new URL(request.url);
    const phone = url.searchParams.get('phone');
    const email = url.searchParams.get('email');

    let customer: Customer | undefined;

    if (phone) {
      customer = mockCustomers.find((c) => c.phone === phone);
    } else if (email) {
      customer = mockCustomers.find((c) => c.email === email);
    }

    if (!customer) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Customer not found',
      });
    }

    return HttpResponse.json<Customer>(customer);
  }),
];
