import { useState, useCallback } from 'react';
import { Search, Package, User, Mail, Phone, Loader2 } from 'lucide-react';
import { useOrderLookup } from '../../hooks/useOrderLookup';
import type { Order } from '../../types/order';
import { ORDER_STATUS_CONFIG } from '../../types/order';
import {
  Input,
  Button,
  Card,
  CardContent,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from '@reactive-platform/shared-ui-components';

interface OrderLookupProps {
  onOrderFound: (order: Order) => void;
}

export function OrderLookup({ onOrderFound }: OrderLookupProps) {
  const [searchType, setSearchType] = useState<'order' | 'customer'>('order');
  const [searchValue, setSearchValue] = useState('');

  const {
    orders,
    isLoading,
    search,
    searchByOrderNumber,
    searchByCustomer,
    clearSearch,
  } = useOrderLookup();

  const handleSearch = useCallback(() => {
    if (!searchValue.trim()) return;

    if (searchType === 'order') {
      searchByOrderNumber(searchValue);
    } else {
      // Determine if it's an email or phone
      if (searchValue.includes('@')) {
        searchByCustomer({ email: searchValue });
      } else {
        searchByCustomer({ phone: searchValue });
      }
    }
  }, [searchType, searchValue, searchByOrderNumber, searchByCustomer]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={searchType} onValueChange={(v) => setSearchType(v as 'order' | 'customer')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="order">
            <Package className="h-4 w-4 mr-2" />
            Order Number
          </TabsTrigger>
          <TabsTrigger value="customer">
            <User className="h-4 w-4 mr-2" />
            Customer Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="order" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter order number (e.g., ORD-2024-001234)"
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={!searchValue.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="customer" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Email or phone number"
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={!searchValue.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Search by customer email or phone number
          </p>
        </TabsContent>
      </Tabs>

      {/* Results */}
      {orders.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Results ({orders.length})</h4>
            <Button variant="ghost" size="sm" onClick={clearSearch}>
              Clear
            </Button>
          </div>

          <div className="space-y-2">
            {orders.map((order) => {
              const statusConfig = ORDER_STATUS_CONFIG[order.status];
              return (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onOrderFound(order)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{order.orderNumber}</span>
                          <Badge className={cn(statusConfig.color, 'text-white')}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order.customerName} - {order.customerEmail}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)} - {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.grandTotal)}</p>
                        <p className="text-sm text-muted-foreground">
                          Store #{order.storeNumber}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && orders.length === 0 && searchValue && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No orders found</p>
          <p className="text-sm text-muted-foreground">
            Try a different search term
          </p>
        </div>
      )}
    </div>
  );
}
