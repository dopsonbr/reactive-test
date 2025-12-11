export interface InventoryItem {
  sku: number;
  storeNumber: number;
  quantityOnHand: number;
  quantityAvailable: number;
  quantityReserved: number;
  quantityOnOrder: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestockDate: string | null;
  nextRestockDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateInventoryRequest {
  quantityOnHand?: number;
  quantityReserved?: number;
  quantityOnOrder?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  lastRestockDate?: string | null;
  nextRestockDate?: string | null;
}

export interface InventoryFilters {
  storeNumber?: number;
  lowStock?: boolean;
  outOfStock?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
}

export interface InventoryAdjustment {
  sku: number;
  adjustment: number;
  reason: string;
}
