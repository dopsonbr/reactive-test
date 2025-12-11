import { useState } from 'react';
import { Button, Input } from '@reactive-platform/shared-ui/ui-components';
import { usePrices, useUpdatePrice } from '../api/usePricing';
import type { Price, UpdatePriceRequest } from '../types';

interface EditingPrice {
  sku: number;
  price: string;
  originalPrice: string;
  error?: string;
}

export function PricingPage() {
  const [page, setPage] = useState(0);
  const [editingSku, setEditingSku] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditingPrice | null>(null);

  const { data: prices, isLoading, error } = usePrices(page);

  const handleEdit = (price: Price) => {
    setEditingSku(price.sku);
    setEditForm({
      sku: price.sku,
      price: price.price.toString(),
      originalPrice: price.originalPrice?.toString() || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingSku(null);
    setEditForm(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading prices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading prices: {error.message}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pricing</h1>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full" data-testid="pricing-table">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Current Price</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Original Price</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Currency</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {prices?.map((price) => (
              <PriceRow
                key={price.sku}
                price={price}
                isEditing={editingSku === price.sku}
                editForm={editForm}
                onEdit={() => handleEdit(price)}
                onCancelEdit={handleCancelEdit}
                onEditFormChange={setEditForm}
              />
            ))}
            {(!prices || prices.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No prices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
          disabled={!prices || prices.length < 20}
          data-testid="next-page-btn"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

interface PriceRowProps {
  price: Price;
  isEditing: boolean;
  editForm: EditingPrice | null;
  onEdit: () => void;
  onCancelEdit: () => void;
  onEditFormChange: (form: EditingPrice | null) => void;
}

function PriceRow({
  price,
  isEditing,
  editForm,
  onEdit,
  onCancelEdit,
  onEditFormChange,
}: PriceRowProps) {
  const updatePrice = useUpdatePrice(price.sku);

  const handleSave = async () => {
    if (!editForm) return;

    // Validate price is a valid positive number
    const priceValue = parseFloat(editForm.price);
    if (isNaN(priceValue)) {
      onEditFormChange({ ...editForm, error: 'Price must be a valid number' });
      return;
    }
    if (priceValue < 0.01) {
      onEditFormChange({ ...editForm, error: 'Price must be at least $0.01' });
      return;
    }

    // Validate original price if provided
    let originalPriceValue: number | null = null;
    if (editForm.originalPrice.trim()) {
      originalPriceValue = parseFloat(editForm.originalPrice);
      if (isNaN(originalPriceValue)) {
        onEditFormChange({ ...editForm, error: 'Original price must be a valid number' });
        return;
      }
      if (originalPriceValue < 0.01) {
        onEditFormChange({ ...editForm, error: 'Original price must be at least $0.01' });
        return;
      }
    }

    try {
      const update: UpdatePriceRequest = {
        price: priceValue,
        originalPrice: originalPriceValue,
      };
      await updatePrice.mutateAsync(update);
      onCancelEdit();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update price';
      onEditFormChange({ ...editForm, error: message });
    }
  };

  const isOnSale = price.originalPrice !== null && price.price < price.originalPrice;

  if (isEditing && editForm) {
    return (
      <tr className="border-t bg-accent/50" data-testid={`price-row-${price.sku}`}>
        <td className="px-4 py-2">
          <span className="text-sm font-mono">{price.sku}</span>
        </td>
        <td className="px-4 py-2">
          <div className="flex flex-col gap-1">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={editForm.price}
              onChange={(e) => onEditFormChange({ ...editForm, price: e.target.value, error: undefined })}
              className={`h-8 w-24 ${editForm.error ? 'border-destructive' : ''}`}
              data-testid="edit-price-input"
            />
            {editForm.error && (
              <span className="text-xs text-destructive" data-testid="edit-error-message">
                {editForm.error}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-2">
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={editForm.originalPrice}
            onChange={(e) => onEditFormChange({ ...editForm, originalPrice: e.target.value, error: undefined })}
            className="h-8 w-24"
            placeholder="Optional"
            data-testid="edit-original-price-input"
          />
        </td>
        <td className="px-4 py-2">
          <span className="text-sm">{price.currency}</span>
        </td>
        <td className="px-4 py-2">—</td>
        <td className="px-4 py-2 text-right">
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={handleSave} disabled={updatePrice.isPending} data-testid="save-price-btn">
              {updatePrice.isPending ? 'Saving...' : 'Save'}
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
    <tr className="border-t hover:bg-muted/50" data-testid={`price-row-${price.sku}`}>
      <td className="px-4 py-3">
        <span className="text-sm font-mono">{price.sku}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm font-mono ${isOnSale ? 'text-green-600 font-semibold' : ''}`}>
          ${price.price?.toFixed(2) || '0.00'}
        </span>
      </td>
      <td className="px-4 py-3">
        {price.originalPrice !== null ? (
          <span className="text-sm font-mono text-muted-foreground line-through">
            ${price.originalPrice.toFixed(2)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="text-sm">{price.currency}</span>
      </td>
      <td className="px-4 py-3">
        {isOnSale ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            On Sale
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Regular</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <Button size="sm" variant="ghost" onClick={onEdit} data-testid="edit-price-btn">
          Edit
        </Button>
      </td>
    </tr>
  );
}
