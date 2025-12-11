import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import type { Price, UpdatePriceRequest } from '../types';

export function usePrices(page = 0, size = 20) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['prices', page, size],
    queryFn: async () => {
      const response = await fetch(`/api/price?page=${page}&size=${size}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch prices');
      return response.json() as Promise<Price[]>;
    },
    enabled: !!token,
  });
}

export function usePrice(sku: number) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['prices', sku],
    queryFn: async () => {
      const response = await fetch(`/api/price/${sku}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch price');
      return response.json() as Promise<Price>;
    },
    enabled: !!token && sku > 0,
  });
}

export function useUpdatePrice(sku: number) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePriceRequest) => {
      const response = await fetch(`/api/price/${sku}`, {
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
    },
  });
}
