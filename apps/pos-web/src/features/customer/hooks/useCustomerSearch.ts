import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  Customer,
  CustomerSearchParams,
  CustomerSearchResult,
  CustomerType,
  CustomerStatus,
  LoyaltyTier,
  AccountTier,
} from '../types/customer';
import { useDebouncedValue } from './useDebouncedValue';

// Mock data for development
const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    type: 'CONSUMER',
    status: 'ACTIVE',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@email.com',
    phone: '(555) 123-4567',
    addresses: [
      {
        id: 'addr-001',
        type: 'BOTH',
        name: 'Home',
        line1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'US',
        isPrimary: true,
      },
    ],
    communicationPreferences: {
      emailPromotions: true,
      smsAlerts: true,
      directMail: false,
    },
    loyalty: {
      tier: 'GOLD',
      currentPoints: 2500,
      lifetimePoints: 8500,
      multiplier: 1.5,
      enrollmentDate: new Date('2022-01-15'),
    },
    createdAt: new Date('2022-01-15'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: 'cust-002',
    type: 'BUSINESS',
    status: 'ACTIVE',
    firstName: 'John',
    lastName: 'Anderson',
    email: 'orders@acme.com',
    phone: '(555) 987-6543',
    addresses: [
      {
        id: 'addr-002',
        type: 'BILLING',
        name: 'Corporate HQ',
        line1: '456 Corporate Blvd',
        line2: 'Suite 100',
        city: 'Dallas',
        state: 'TX',
        postalCode: '75201',
        country: 'US',
        isPrimary: true,
      },
    ],
    communicationPreferences: {
      emailPromotions: true,
      smsAlerts: false,
      directMail: true,
    },
    b2bInfo: {
      companyName: 'ACME Corporation',
      taxId: '12-3456789',
      industry: 'Manufacturing',
      website: 'https://acme.com',
      accountTier: 'PREMIER',
      creditLimit: 200000,
      paymentTerms: 'NET_60',
      salesRepId: 'rep-001',
      salesRepName: 'Mike Johnson',
    },
    createdAt: new Date('2021-06-20'),
    updatedAt: new Date('2024-02-28'),
  },
  {
    id: 'cust-003',
    type: 'CONSUMER',
    status: 'ACTIVE',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob@gmail.com',
    phone: '(555) 555-1234',
    addresses: [
      {
        id: 'addr-003',
        type: 'SHIPPING',
        name: 'Home',
        line1: '789 Oak Lane',
        city: 'Houston',
        state: 'TX',
        postalCode: '77001',
        country: 'US',
        isPrimary: true,
      },
    ],
    communicationPreferences: {
      emailPromotions: false,
      smsAlerts: true,
      directMail: false,
    },
    loyalty: {
      tier: 'BRONZE',
      currentPoints: 150,
      lifetimePoints: 150,
      multiplier: 1,
      enrollmentDate: new Date('2024-01-01'),
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'cust-004',
    type: 'CONSUMER',
    status: 'ACTIVE',
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.w@email.com',
    phone: '(555) 444-3333',
    addresses: [],
    communicationPreferences: {
      emailPromotions: true,
      smsAlerts: false,
      directMail: false,
    },
    loyalty: {
      tier: 'PLATINUM',
      currentPoints: 7500,
      lifetimePoints: 25000,
      multiplier: 2,
      enrollmentDate: new Date('2020-03-15'),
    },
    createdAt: new Date('2020-03-15'),
    updatedAt: new Date('2024-03-05'),
  },
  {
    id: 'cust-005',
    type: 'BUSINESS',
    status: 'ACTIVE',
    firstName: 'Tom',
    lastName: 'Chen',
    email: 'tom@techstart.io',
    phone: '(555) 222-1111',
    addresses: [
      {
        id: 'addr-005',
        type: 'BOTH',
        name: 'Office',
        line1: '100 Tech Way',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'US',
        isPrimary: true,
      },
    ],
    communicationPreferences: {
      emailPromotions: true,
      smsAlerts: true,
      directMail: false,
    },
    b2bInfo: {
      companyName: 'TechStart Inc',
      taxId: '98-7654321',
      industry: 'Technology',
      website: 'https://techstart.io',
      accountTier: 'STANDARD',
      creditLimit: 10000,
      paymentTerms: 'NET_30',
    },
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2024-01-15'),
  },
];

// Simulated API call
async function searchCustomers(params: CustomerSearchParams): Promise<CustomerSearchResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filtered = [...mockCustomers];

  // Apply search query
  if (params.q) {
    const query = params.q.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.firstName.toLowerCase().includes(query) ||
        c.lastName.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone?.includes(query) ||
        c.b2bInfo?.companyName.toLowerCase().includes(query)
    );
  }

  // Apply filters
  if (params.email) {
    filtered = filtered.filter((c) => c.email.toLowerCase() === params.email?.toLowerCase());
  }
  if (params.phone) {
    filtered = filtered.filter((c) => c.phone?.includes(params.phone || ''));
  }
  if (params.type) {
    filtered = filtered.filter((c) => c.type === params.type);
  }
  if (params.status) {
    filtered = filtered.filter((c) => c.status === params.status);
  }
  if (params.loyaltyTier) {
    filtered = filtered.filter((c) => c.loyalty?.tier === params.loyaltyTier);
  }
  if (params.accountTier) {
    filtered = filtered.filter((c) => c.b2bInfo?.accountTier === params.accountTier);
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';

    switch (params.sortBy) {
      case 'name':
        aVal = `${a.firstName} ${a.lastName}`;
        bVal = `${b.firstName} ${b.lastName}`;
        break;
      case 'email':
        aVal = a.email;
        bVal = b.email;
        break;
      case 'createdAt':
        aVal = a.createdAt.getTime();
        bVal = b.createdAt.getTime();
        break;
      default:
        aVal = `${a.firstName} ${a.lastName}`;
        bVal = `${b.firstName} ${b.lastName}`;
    }

    if (typeof aVal === 'string') {
      return params.sortDirection === 'ASC' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    }
    return params.sortDirection === 'ASC' ? aVal - (bVal as number) : (bVal as number) - aVal;
  });

  // Apply pagination
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / params.size);
  const start = params.page * params.size;
  const customers = filtered.slice(start, start + params.size);

  return {
    customers,
    totalCount,
    totalPages,
    currentPage: params.page,
  };
}

interface UseCustomerSearchOptions {
  initialQuery?: string;
  initialType?: CustomerType;
  initialStatus?: CustomerStatus;
  pageSize?: number;
}

export interface UseCustomerSearchResult {
  customers: Customer[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: Error | null;
  query: string;
  setQuery: (query: string) => void;
  filters: CustomerFilters;
  setFilters: (filters: CustomerFilters) => void;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  setSort: (column: string, direction?: 'ASC' | 'DESC') => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  refresh: () => void;
}

export interface CustomerFilters {
  type?: CustomerType;
  status?: CustomerStatus;
  loyaltyTier?: LoyaltyTier;
  accountTier?: AccountTier;
}

export function useCustomerSearch(options: UseCustomerSearchOptions = {}): UseCustomerSearchResult {
  const { initialQuery = '', initialType, initialStatus = 'ACTIVE', pageSize = 10 } = options;

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<CustomerFilters>({
    type: initialType,
    status: initialStatus,
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [page, setPage] = useState(0);

  const debouncedQuery = useDebouncedValue(query, 300);

  const searchParams: CustomerSearchParams = useMemo(
    () => ({
      q: debouncedQuery || undefined,
      type: filters.type,
      status: filters.status,
      loyaltyTier: filters.loyaltyTier,
      accountTier: filters.accountTier,
      page,
      size: pageSize,
      sortBy,
      sortDirection,
    }),
    [debouncedQuery, filters, page, pageSize, sortBy, sortDirection]
  );

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customers', 'search', searchParams],
    queryFn: () => searchCustomers(searchParams),
  });

  const setSort = useCallback((column: string, direction?: 'ASC' | 'DESC') => {
    if (direction) {
      setSortBy(column);
      setSortDirection(direction);
    } else {
      // Toggle direction if same column
      setSortBy((prev) => {
        if (prev === column) {
          setSortDirection((d) => (d === 'ASC' ? 'DESC' : 'ASC'));
          return column;
        }
        setSortDirection('ASC');
        return column;
      });
    }
    setPage(0);
  }, []);

  const handleSetFilters = useCallback((newFilters: CustomerFilters) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  const handleSetQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setPage(0);
  }, []);

  const nextPage = useCallback(() => {
    if (data && page < data.totalPages - 1) {
      setPage((p) => p + 1);
    }
  }, [data, page]);

  const prevPage = useCallback(() => {
    if (page > 0) {
      setPage((p) => p - 1);
    }
  }, [page]);

  const goToPage = useCallback(
    (newPage: number) => {
      if (data && newPage >= 0 && newPage < data.totalPages) {
        setPage(newPage);
      }
    },
    [data]
  );

  return {
    customers: data?.customers ?? [],
    totalCount: data?.totalCount ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 0,
    isLoading,
    error: error as Error | null,
    query,
    setQuery: handleSetQuery,
    filters,
    setFilters: handleSetFilters,
    sortBy,
    sortDirection,
    setSort,
    nextPage,
    prevPage,
    goToPage,
    refresh: refetch,
  };
}
