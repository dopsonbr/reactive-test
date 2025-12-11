import { useState } from 'react';
import { Button, Input } from '@reactive-platform/shared-ui/ui-components';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../api/useProducts';
import type { Product, CreateProductRequest, UpdateProductRequest } from '../types';

interface EditingProduct {
  sku: number;
  name: string;
  description: string;
  category: string;
  suggestedRetailPrice: string;
  error?: string;
}

interface CreateFormState {
  sku: string;
  name: string;
  description: string;
  category: string;
  suggestedRetailPrice: string;
  error?: string;
}

export function ProductsPage() {
  const [page, setPage] = useState(0);
  const [editingSku, setEditingSku] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditingProduct | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>({
    sku: '',
    name: '',
    description: '',
    category: '',
    suggestedRetailPrice: '',
  });

  const { data: products, isLoading, error } = useProducts(page);
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();

  const handleEdit = (product: Product) => {
    setEditingSku(product.sku);
    setEditForm({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      suggestedRetailPrice: product.suggestedRetailPrice.toString(),
    });
  };

  const handleCancelEdit = () => {
    setEditingSku(null);
    setEditForm(null);
  };

  const handleCreate = async () => {
    // Validate SKU
    const skuValue = parseInt(createForm.sku, 10);
    if (!createForm.sku.trim() || isNaN(skuValue)) {
      setCreateForm({ ...createForm, error: 'SKU must be a valid number' });
      return;
    }
    if (skuValue <= 0) {
      setCreateForm({ ...createForm, error: 'SKU must be a positive number' });
      return;
    }

    // Validate name
    if (!createForm.name.trim()) {
      setCreateForm({ ...createForm, error: 'Name is required' });
      return;
    }

    // Validate price
    const priceValue = parseFloat(createForm.suggestedRetailPrice);
    if (!createForm.suggestedRetailPrice.trim() || isNaN(priceValue)) {
      setCreateForm({ ...createForm, error: 'MSRP must be a valid number' });
      return;
    }
    if (priceValue < 0.01) {
      setCreateForm({ ...createForm, error: 'MSRP must be at least $0.01' });
      return;
    }

    try {
      const request: CreateProductRequest = {
        sku: skuValue,
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        category: createForm.category.trim() || undefined,
        suggestedRetailPrice: priceValue,
      };
      await createProduct.mutateAsync(request);
      setShowCreate(false);
      setCreateForm({ sku: '', name: '', description: '', category: '', suggestedRetailPrice: '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create product';
      setCreateForm({ ...createForm, error: message });
    }
  };

  const handleDelete = async (sku: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct.mutateAsync(sku);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading products: {error.message}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => setShowCreate(true)} data-testid="add-product-btn">
          Add Product
        </Button>
      </div>

      {showCreate && (
        <div className="mb-6 p-4 border rounded-lg bg-card" data-testid="create-product-form">
          <h2 className="text-lg font-semibold mb-4">Create New Product</h2>
          {createForm.error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
              <span className="text-sm text-destructive" data-testid="create-error-message">
                {createForm.error}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">SKU *</label>
              <Input
                type="number"
                value={createForm.sku}
                onChange={(e) => setCreateForm({ ...createForm, sku: e.target.value, error: undefined })}
                placeholder="e.g., 12345"
                data-testid="create-sku-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value, error: undefined })}
                placeholder="Product name"
                data-testid="create-name-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value, error: undefined })}
                placeholder="Optional description"
                data-testid="create-description-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value, error: undefined })}
                placeholder="Optional category"
                data-testid="create-category-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium">MSRP *</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={createForm.suggestedRetailPrice}
                onChange={(e) => setCreateForm({ ...createForm, suggestedRetailPrice: e.target.value, error: undefined })}
                placeholder="e.g., 29.99"
                data-testid="create-price-input"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate} disabled={createProduct.isPending} data-testid="save-new-product-btn">
              {createProduct.isPending ? 'Creating...' : 'Create'}
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} data-testid="cancel-create-btn">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full" data-testid="products-table">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium">MSRP</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => (
              <ProductRow
                key={product.sku}
                product={product}
                isEditing={editingSku === product.sku}
                editForm={editForm}
                onEdit={() => handleEdit(product)}
                onCancelEdit={handleCancelEdit}
                onEditFormChange={setEditForm}
                onDelete={() => handleDelete(product.sku)}
              />
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No products found
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
          disabled={!products || products.length < 20}
          data-testid="next-page-btn"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

interface ProductRowProps {
  product: Product;
  isEditing: boolean;
  editForm: EditingProduct | null;
  onEdit: () => void;
  onCancelEdit: () => void;
  onEditFormChange: (form: EditingProduct | null) => void;
  onDelete: () => void;
}

function ProductRow({
  product,
  isEditing,
  editForm,
  onEdit,
  onCancelEdit,
  onEditFormChange,
  onDelete,
}: ProductRowProps) {
  const updateProduct = useUpdateProduct(product.sku);

  const handleSave = async () => {
    if (!editForm) return;

    // Validate name
    if (!editForm.name.trim()) {
      onEditFormChange({ ...editForm, error: 'Name is required' });
      return;
    }

    // Validate price if provided
    const priceValue = parseFloat(editForm.suggestedRetailPrice);
    if (editForm.suggestedRetailPrice.trim() && isNaN(priceValue)) {
      onEditFormChange({ ...editForm, error: 'MSRP must be a valid number' });
      return;
    }
    if (editForm.suggestedRetailPrice.trim() && priceValue < 0.01) {
      onEditFormChange({ ...editForm, error: 'MSRP must be at least $0.01' });
      return;
    }

    try {
      const update: UpdateProductRequest = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        category: editForm.category.trim() || undefined,
        suggestedRetailPrice: editForm.suggestedRetailPrice.trim() ? priceValue : undefined,
      };
      await updateProduct.mutateAsync(update);
      onCancelEdit();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update product';
      onEditFormChange({ ...editForm, error: message });
    }
  };

  if (isEditing && editForm) {
    return (
      <>
        <tr className="border-t bg-accent/50" data-testid={`product-row-${product.sku}`}>
          <td className="px-4 py-2">
            <span className="text-sm font-mono">{product.sku}</span>
          </td>
          <td className="px-4 py-2">
            <Input
              value={editForm.name}
              onChange={(e) => onEditFormChange({ ...editForm, name: e.target.value, error: undefined })}
              className={`h-8 ${editForm.error ? 'border-destructive' : ''}`}
              data-testid="edit-name-input"
            />
          </td>
          <td className="px-4 py-2">
            <Input
              value={editForm.category}
              onChange={(e) => onEditFormChange({ ...editForm, category: e.target.value, error: undefined })}
              className="h-8"
              data-testid="edit-category-input"
            />
          </td>
          <td className="px-4 py-2">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={editForm.suggestedRetailPrice}
              onChange={(e) => onEditFormChange({ ...editForm, suggestedRetailPrice: e.target.value, error: undefined })}
              className="h-8 w-24"
              data-testid="edit-price-input"
            />
          </td>
          <td className="px-4 py-2 text-right">
            <div className="flex justify-end gap-2">
              <Button size="sm" onClick={handleSave} disabled={updateProduct.isPending} data-testid="save-edit-btn">
                {updateProduct.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit} data-testid="cancel-edit-btn">
                Cancel
              </Button>
            </div>
          </td>
        </tr>
        {editForm.error && (
          <tr className="bg-accent/50">
            <td colSpan={5} className="px-4 py-2">
              <span className="text-xs text-destructive" data-testid="edit-error-message">
                {editForm.error}
              </span>
            </td>
          </tr>
        )}
      </>
    );
  }

  return (
    <tr className="border-t hover:bg-muted/50" data-testid={`product-row-${product.sku}`}>
      <td className="px-4 py-3">
        <span className="text-sm font-mono">{product.sku}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm">{product.name}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">{product.category || '—'}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-mono">
          ${product.suggestedRetailPrice?.toFixed(2) || '0.00'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onEdit} data-testid="edit-product-btn">
            Edit
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete} data-testid="delete-product-btn">
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
