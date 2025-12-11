import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import type {
  InventoryItem,
  UpdateInventoryRequest,
  InventoryFilters,
  InventoryAdjustment,
} from '../types';

export function useInventoryItems(filters: InventoryFilters = {}, page = 0, size = 20) {
  const { token, user } = useAuth();
  const storeNumber = filters.storeNumber || user?.storeNumber || 1;

  return useQuery({
    queryKey: ['inventory', storeNumber, filters, page, size],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });

      if (filters.lowStock !== undefined) {
        params.append('lowStock', filters.lowStock.toString());
      }
      if (filters.outOfStock !== undefined) {
        params.append('outOfStock', filters.outOfStock.toString());
      }
      if (filters.minQuantity !== undefined) {
        params.append('minQuantity', filters.minQuantity.toString());
      }
      if (filters.maxQuantity !== undefined) {
        params.append('maxQuantity', filters.maxQuantity.toString());
      }

      const response = await fetch(
        `/api/inventory/store/${storeNumber}?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json() as Promise<InventoryItem[]>;
    },
    enabled: !!token,
  });
}

export function useInventoryItem(sku: number, storeNumber?: number) {
  const { token, user } = useAuth();
  const store = storeNumber || user?.storeNumber || 1;

  return useQuery({
    queryKey: ['inventory', store, sku],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/store/${store}/sku/${sku}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch inventory item');
      return response.json() as Promise<InventoryItem>;
    },
    enabled: !!token && sku > 0,
  });
}

export function useLowStockItems(storeNumber?: number, page = 0, size = 20) {
  const { token, user } = useAuth();
  const store = storeNumber || user?.storeNumber || 1;

  return useQuery({
    queryKey: ['inventory', 'low-stock', store, page, size],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });

      const response = await fetch(
        `/api/inventory/store/${store}/low-stock?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch low stock items');
      return response.json() as Promise<InventoryItem[]>;
    },
    enabled: !!token,
  });
}

export function useUpdateInventory(sku: number, storeNumber?: number) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const store = storeNumber || user?.storeNumber || 1;

  return useMutation({
    mutationFn: async (data: UpdateInventoryRequest) => {
      const response = await fetch(`/api/inventory/store/${store}/sku/${sku}`, {
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
      queryClient.invalidateQueries({ queryKey: ['inventory', store, sku] });
    },
  });
}

export function useAdjustInventory(storeNumber?: number) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const store = storeNumber || user?.storeNumber || 1;

  return useMutation({
    mutationFn: async (adjustment: InventoryAdjustment) => {
      const response = await fetch(`/api/inventory/store/${store}/adjust`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adjustment),
      });
      if (!response.ok) throw new Error('Failed to adjust inventory');
      return response.json() as Promise<InventoryItem>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', store, variables.sku] });
    },
  });
}

export function useBulkUpdateInventory(storeNumber?: number) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const store = storeNumber || user?.storeNumber || 1;

  return useMutation({
    mutationFn: async (updates: Array<{ sku: number; data: UpdateInventoryRequest }>) => {
      const response = await fetch(`/api/inventory/store/${store}/bulk`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update inventory');
      return response.json() as Promise<InventoryItem[]>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
