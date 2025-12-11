import { useState } from 'react';
import { Button, Input, Checkbox } from '@reactive-platform/shared-ui/ui-components';
import { useInventoryItems, useLowStockItems, useUpdateInventory } from '../api/useInventory';
import type { InventoryItem, UpdateInventoryRequest } from '../types';

interface EditingInventory {
  sku: number;
  availableQuantity: string;
  error?: string;
}

export function InventoryPage() {
  const [page, setPage] = useState(0);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editingSku, setEditingSku] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditingInventory | null>(null);

  const { data: allItems, isLoading: isLoadingAll, error: errorAll } = useInventoryItems(page);
  const { data: lowStockItems, isLoading: isLoadingLow, error: errorLow } = useLowStockItems();

  const items = showLowStockOnly ? lowStockItems : allItems;
  const isLoading = showLowStockOnly ? isLoadingLow : isLoadingAll;
  const error = showLowStockOnly ? errorLow : errorAll;

  const handleEdit = (item: InventoryItem) => {
    setEditingSku(item.sku);
    setEditForm({
      sku: item.sku,
      availableQuantity: item.availableQuantity.toString(),
    });
  };

  const handleCancelEdit = () => {
    setEditingSku(null);
    setEditForm(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading inventory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading inventory: {error.message}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex items-center gap-2">
          <Checkbox
            id="low-stock-filter"
            checked={showLowStockOnly}
            onCheckedChange={(checked) => setShowLowStockOnly(checked === true)}
            data-testid="low-stock-filter"
          />
          <label htmlFor="low-stock-filter" className="text-sm font-medium cursor-pointer">
            Show low stock only
          </label>
        </div>
      </div>

      {showLowStockOnly && lowStockItems && lowStockItems.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="text-yellow-800 text-sm font-medium">
            {lowStockItems.length} item(s) below reorder threshold
          </span>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full" data-testid="inventory-table">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Available Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Last Updated</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item) => (
              <InventoryRow
                key={item.sku}
                item={item}
                isEditing={editingSku === item.sku}
                editForm={editForm}
                onEdit={() => handleEdit(item)}
                onCancelEdit={handleCancelEdit}
                onEditFormChange={setEditForm}
              />
            ))}
            {(!items || items.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {showLowStockOnly ? 'No low stock items' : 'No inventory items found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!showLowStockOnly && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            data-testid="prev-page-btn"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1}</span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={!items || items.length < 20}
            data-testid="next-page-btn"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

interface InventoryRowProps {
  item: InventoryItem;
  isEditing: boolean;
  editForm: EditingInventory | null;
  onEdit: () => void;
  onCancelEdit: () => void;
  onEditFormChange: (form: EditingInventory | null) => void;
}

function InventoryRow({
  item,
  isEditing,
  editForm,
  onEdit,
  onCancelEdit,
  onEditFormChange,
}: InventoryRowProps) {
  const updateInventory = useUpdateInventory(item.sku);

  const handleSave = async () => {
    if (!editForm) return;

    // Validate quantity is a valid non-negative integer
    const quantity = parseInt(editForm.availableQuantity, 10);
    if (isNaN(quantity)) {
      onEditFormChange({ ...editForm, error: 'Quantity must be a valid number' });
      return;
    }
    if (quantity < 0) {
      onEditFormChange({ ...editForm, error: 'Quantity cannot be negative' });
      return;
    }

    try {
      const update: UpdateInventoryRequest = {
        availableQuantity: quantity,
      };
      await updateInventory.mutateAsync(update);
      onCancelEdit();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update inventory';
      onEditFormChange({ ...editForm, error: message });
    }
  };

  const getStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (quantity < 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const status = getStatus(item.availableQuantity);

  if (isEditing && editForm) {
    return (
      <tr className="border-t bg-accent/50" data-testid={`inventory-row-${item.sku}`}>
        <td className="px-4 py-2">
          <span className="text-sm font-mono">{item.sku}</span>
        </td>
        <td className="px-4 py-2">
          <div className="flex flex-col gap-1">
            <Input
              type="number"
              min="0"
              value={editForm.availableQuantity}
              onChange={(e) => onEditFormChange({ ...editForm, availableQuantity: e.target.value, error: undefined })}
              className={`h-8 w-24 ${editForm.error ? 'border-destructive' : ''}`}
              data-testid="edit-quantity-input"
            />
            {editForm.error && (
              <span className="text-xs text-destructive" data-testid="edit-error-message">
                {editForm.error}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-2">—</td>
        <td className="px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {new Date(item.updatedAt).toLocaleDateString()}
          </span>
        </td>
        <td className="px-4 py-2 text-right">
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateInventory.isPending} data-testid="save-inventory-btn">
              {updateInventory.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit} data-testid="cancel-edit-btn">
              Cancel
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t hover:bg-muted/50" data-testid={`inventory-row-${item.sku}`}>
      <td className="px-4 py-3">
        <span className="text-sm font-mono">{item.sku}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-mono">{item.availableQuantity}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
          {status.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {new Date(item.updatedAt).toLocaleDateString()}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Button size="sm" variant="ghost" onClick={onEdit} data-testid="edit-inventory-btn">
          Edit
        </Button>
      </td>
    </tr>
  );
}
