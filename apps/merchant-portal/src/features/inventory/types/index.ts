export interface InventoryItem {
  sku: number;
  availableQuantity: number;
  updatedAt: string;
}

export interface UpdateInventoryRequest {
  availableQuantity: number;
}
