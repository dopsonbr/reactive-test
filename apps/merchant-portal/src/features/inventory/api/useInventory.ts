import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import type { InventoryItem, UpdateInventoryRequest } from '../types';

export function useInventoryItems(page = 0, size = 20) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['inventory', page, size],
    queryFn: async () => {
      const response = await fetch(`/api/inventory?page=${page}&size=${size}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json() as Promise<InventoryItem[]>;
    },
    enabled: !!token,
  });
}

export function useInventoryItem(sku: number) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['inventory', sku],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/${sku}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch inventory item');
      return response.json() as Promise<InventoryItem>;
    },
    enabled: !!token && sku > 0,
  });
}

export function useLowStockItems(threshold = 10) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['inventory', 'low-stock', threshold],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/low-stock?threshold=${threshold}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch low stock items');
      return response.json() as Promise<InventoryItem[]>;
    },
    enabled: !!token,
  });
}

export function useUpdateInventory(sku: number) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateInventoryRequest) => {
      const response = await fetch(`/api/inventory/${sku}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update inventory');
      return response.json() as Promise<InventoryItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
