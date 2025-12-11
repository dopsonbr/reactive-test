import { useState, useCallback } from 'react';
import { Plus, Trash2, Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Alert,
  AlertDescription,
} from '@reactive-platform/shared-ui-components';

interface BulkItemInput {
  sku: string;
  quantity: number;
}

interface BulkItemEntryProps {
  onItemsAdded: (items: BulkItemInput[]) => Promise<void>;
  onCancel: () => void;
}

interface GridRow extends BulkItemInput {
  id: string;
  valid?: boolean;
  error?: string;
}

export function BulkItemEntry({ onItemsAdded, onCancel }: BulkItemEntryProps) {
  const [rows, setRows] = useState<GridRow[]>([
    { id: '1', sku: '', quantity: 1 },
    { id: '2', sku: '', quantity: 1 },
    { id: '3', sku: '', quantity: 1 },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      { id: String(Date.now()), sku: '', quantity: 1 },
    ]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRow = useCallback((id: string, field: 'sku' | 'quantity', value: string | number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, [field]: field === 'quantity' ? Math.max(1, Number(value) || 1) : value }
          : r
      )
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    const validItems = rows
      .filter((r) => r.sku.trim())
      .map((r) => ({ sku: r.sku.trim(), quantity: r.quantity }));

    if (validItems.length === 0) {
      setError('Please enter at least one SKU');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onItemsAdded(validItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add items');
    } finally {
      setIsProcessing(false);
    }
  }, [rows, onItemsAdded]);

  const handleCSVUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').slice(1); // Skip header

    const newRows: GridRow[] = lines
      .map((line, index) => {
        const [sku, qty] = line.split(',').map((s) => s.trim());
        if (!sku) return null;
        return {
          id: String(Date.now() + index),
          sku,
          quantity: parseInt(qty) || 1,
        };
      })
      .filter(Boolean) as GridRow[];

    if (newRows.length > 0) {
      setRows(newRows);
    }

    // Reset input
    e.target.value = '';
  }, []);

  const validRowCount = rows.filter((r) => r.sku.trim()).length;
  const totalQuantity = rows
    .filter((r) => r.sku.trim())
    .reduce((sum, r) => sum + r.quantity, 0);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Bulk Item Entry
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="grid">
          <TabsList>
            <TabsTrigger value="grid">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv">CSV Import</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-4">
            {/* Grid Entry */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Input
                        value={row.sku}
                        onChange={(e) => updateRow(row.id, 'sku', e.target.value)}
                        placeholder="Enter SKU"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            {/* CSV Import */}
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file with columns: SKU, Quantity
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="max-w-xs mx-auto"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Expected format:</p>
              <pre className="bg-muted p-2 rounded text-xs">
                SKU,Quantity{'\n'}
                PROD-001,5{'\n'}
                PROD-002,10
              </pre>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <span className="text-sm text-muted-foreground">
            {validRowCount} item{validRowCount !== 1 ? 's' : ''}, {totalQuantity} total units
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing || validRowCount === 0}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Items...
              </>
            ) : (
              `Add ${validRowCount} Item${validRowCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
