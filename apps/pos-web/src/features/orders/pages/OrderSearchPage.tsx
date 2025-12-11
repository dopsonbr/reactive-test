import { useNavigate } from 'react-router-dom';
import { Package, Plus, Filter, RefreshCw } from 'lucide-react';
import { OrderLookup } from '../components/OrderLookup';
import { useOrderLookup } from '../hooks/useOrderLookup';
import type { Order, OrderStatus } from '../types/order';
import { ORDER_STATUS_CONFIG } from '../types/order';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@reactive-platform/shared-ui-components';
import { useState } from 'react';

export function OrderSearchPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const { orders, totalCount, isLoading, refresh } = useOrderLookup();

  const handleOrderFound = (order: Order) => {
    navigate(`/orders/${order.id}`);
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

  // Filter orders by status
  const filteredOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            Search, view, and manage customer orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Search Panel */}
        <div className="col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Lookup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderLookup onOrderFound={handleOrderFound} />
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'ALL')}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    {Object.entries(ORDER_STATUS_CONFIG).map(([status, config]) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <div className={cn('w-2 h-2 rounded-full', config.color)} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <div className="col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Recent Orders
                  {totalCount > 0 && (
                    <span className="ml-2 text-muted-foreground font-normal">
                      ({filteredOrders.length} of {totalCount})
                    </span>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No orders found</p>
                  <p className="text-muted-foreground">
                    Search for an order by number, or customer email/phone
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredOrders.map((order) => {
                    const statusConfig = ORDER_STATUS_CONFIG[order.status];
                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => handleOrderFound(order)}
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium">{order.orderNumber}</span>
                              <Badge className={cn(statusConfig.color, 'text-white text-xs')}>
                                {statusConfig.label}
                              </Badge>
                              {order.isB2B && (
                                <Badge variant="outline" className="text-xs">B2B</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {order.customerName}
                              {order.companyName && ` - ${order.companyName}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.grandTotal)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(order.createdAt)} - {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {orders.filter(o => o.status === 'PENDING').length}
                </div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">
                  {orders.filter(o => ['CONFIRMED', 'PROCESSING'].includes(o.status)).length}
                </div>
                <p className="text-sm text-muted-foreground">Processing</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-indigo-600">
                  {orders.filter(o => ['SHIPPED', 'PARTIALLY_SHIPPED'].includes(o.status)).length}
                </div>
                <p className="text-sm text-muted-foreground">Shipped</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'DELIVERED').length}
                </div>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
