import { useEffect } from 'react';
import { ItemEntry } from '../components/ItemEntry';
import { CartPanel } from '../components/CartPanel';
import { useTransaction } from '../context/TransactionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@reactive-platform/shared-ui-components';

export function TransactionPage() {
  const { transaction, startTransaction, isLoading } = useTransaction();

  // Auto-start transaction if none active
  useEffect(() => {
    if (!transaction && !isLoading) {
      startTransaction();
    }
  }, [transaction, isLoading, startTransaction]);

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left Side: Item Entry */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Add Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemEntry autoFocus />
          </CardContent>
        </Card>

        {/* Quick Access / Favorites (placeholder) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {['SKU-001', 'SKU-002', 'SKU-003'].map((sku) => (
                <QuickAddButton key={sku} sku={sku} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side: Cart */}
      <div className="h-full">
        <CartPanel />
      </div>
    </div>
  );
}

function QuickAddButton({ sku }: { sku: string }) {
  const { addItem, isLoading } = useTransaction();

  return (
    <button
      onClick={() => addItem(sku, 1)}
      disabled={isLoading}
      className="p-3 text-sm rounded-lg border bg-muted hover:bg-accent transition-colors disabled:opacity-50"
    >
      <div className="font-mono text-xs text-muted-foreground">{sku}</div>
      <div className="truncate">Quick Add</div>
    </button>
  );
}
