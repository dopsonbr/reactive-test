import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import type { Price, UpdatePriceRequest, PriceFilters } from '../types';

export function usePrices(filters: PriceFilters = {}, page = 0, size = 20) {
  const { token, user } = useAuth();
  const storeNumber = filters.storeNumber || user?.storeNumber || 1;

  return useQuery({
    queryKey: ['prices', storeNumber, filters, page, size],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });

      if (filters.onSale !== undefined) {
        params.append('onSale', filters.onSale.toString());
      }
      if (filters.onClearance !== undefined) {
        params.append('onClearance', filters.onClearance.toString());
      }

      const response = await fetch(
        `/api/prices/store/${storeNumber}?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch prices');
      return response.json() as Promise<Price[]>;
    },
    enabled: !!token,
  });
}

export function usePrice(sku: number, storeNumber?: number) {
  const { token, user } = useAuth();
  const store = storeNumber || user?.storeNumber || 1;

  return useQuery({
    queryKey: ['prices', store, sku],
    queryFn: async () => {
      const response = await fetch(`/api/prices/store/${store}/sku/${sku}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch price');
      return response.json() as Promise<Price>;
    },
    enabled: !!token && sku > 0,
  });
}

export function useUpdatePrice(sku: number, storeNumber?: number) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const store = storeNumber || user?.storeNumber || 1;

  return useMutation({
    mutationFn: async (data: UpdatePriceRequest) => {
      const response = await fetch(`/api/prices/store/${store}/sku/${sku}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update price');
      return response.json() as Promise<Price>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      queryClient.invalidateQueries({ queryKey: ['prices', store, sku] });
    },
  });
}

export function useBulkUpdatePrices(storeNumber?: number) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const store = storeNumber || user?.storeNumber || 1;

  return useMutation({
    mutationFn: async (updates: Array<{ sku: number; data: UpdatePriceRequest }>) => {
      const response = await fetch(`/api/prices/store/${store}/bulk`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update prices');
      return response.json() as Promise<Price[]>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prices'] });
    },
  });
}
