import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CustomerSuggestion } from '../types/customer';
import { useDebouncedValue } from './useDebouncedValue';

// Mock data for development
const mockSuggestions: CustomerSuggestion[] = [
  {
    customerId: 'cust-001',
    name: 'Jane Smith',
    email: 'jane@email.com',
    phone: '(555) 123-4567',
    type: 'CONSUMER',
    loyaltyTier: 'GOLD',
  },
  {
    customerId: 'cust-002',
    name: 'John Anderson',
    email: 'orders@acme.com',
    phone: '(555) 987-6543',
    type: 'BUSINESS',
    accountTier: 'PREMIER',
  },
  {
    customerId: 'cust-003',
    name: 'Bob Johnson',
    email: 'bob@gmail.com',
    phone: '(555) 555-1234',
    type: 'CONSUMER',
    loyaltyTier: 'BRONZE',
  },
  {
    customerId: 'cust-004',
    name: 'Sarah Williams',
    email: 'sarah.w@email.com',
    phone: '(555) 444-3333',
    type: 'CONSUMER',
    loyaltyTier: 'PLATINUM',
  },
  {
    customerId: 'cust-005',
    name: 'Tom Chen',
    email: 'tom@techstart.io',
    phone: '(555) 222-1111',
    type: 'BUSINESS',
    accountTier: 'STANDARD',
  },
];

// Simulated API call
async function fetchSuggestions(query: string): Promise<CustomerSuggestion[]> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  if (query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  return mockSuggestions.filter(
    (s) =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.email.toLowerCase().includes(lowerQuery) ||
      s.phone?.includes(query)
  );
}

interface UseCustomerAutocompleteOptions {
  minChars?: number;
  debounceMs?: number;
}

export interface UseCustomerAutocompleteResult {
  query: string;
  setQuery: (query: string) => void;
  suggestions: CustomerSuggestion[];
  isLoading: boolean;
  clear: () => void;
}

export function useCustomerAutocomplete(
  options: UseCustomerAutocompleteOptions = {}
): UseCustomerAutocompleteResult {
  const { minChars = 2, debounceMs = 300 } = options;

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, debounceMs);

  const shouldFetch = debouncedQuery.length >= minChars;

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['customers', 'autocomplete', debouncedQuery],
    queryFn: () => fetchSuggestions(debouncedQuery),
    enabled: shouldFetch,
  });

  const clear = () => setQuery('');

  return useMemo(
    () => ({
      query,
      setQuery,
      suggestions: shouldFetch ? suggestions : [],
      isLoading: shouldFetch && isLoading,
      clear,
    }),
    [query, suggestions, isLoading, shouldFetch]
  );
}
