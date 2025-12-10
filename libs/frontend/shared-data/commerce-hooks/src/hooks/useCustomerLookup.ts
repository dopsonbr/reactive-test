import { useMutation } from '@tanstack/react-query';
import type { Customer } from '../types';
import { apiClient } from '../utils/apiClient';

const API_BASE = import.meta.env.VITE_CUSTOMER_SERVICE_URL || 'http://localhost:8083';

export interface CustomerLookupRequest {
  phone?: string;
  email?: string;
  headers?: Record<string, string>;
}

/**
 * Hook to lookup customer by phone or email
 * Returns first match or null if not found
 * Binary match - not a search, exact identifier lookup
 */
export function useCustomerLookup() {
  return useMutation({
    mutationFn: async (request: CustomerLookupRequest) => {
      const queryParams = new URLSearchParams();
      if (request.phone) queryParams.set('phone', request.phone);
      if (request.email) queryParams.set('email', request.email);

      const url = `${API_BASE}/api/customers/lookup?${queryParams.toString()}`;

      try {
        return await apiClient.get<Customer>(url, { headers: request.headers });
      } catch (error) {
        // Return null for 404 (customer not found)
        if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
          return null;
        }
        throw error;
      }
    },
  });
}
