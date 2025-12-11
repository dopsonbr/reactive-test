import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  XCircle,
  Printer,
  MailIcon,
  Package,
  CreditCard,
  User,
  Building2,
} from 'lucide-react';
import { useOrder } from '../hooks/useOrderLookup';
import type { Order } from '../types/order';
import { ORDER_STATUS_CONFIG } from '../types/order';
import { OrderTimeline } from '../components/OrderDetail/OrderTimeline';
import { FulfillmentTracker } from '../components/OrderDetail/FulfillmentTracker';
import { ReturnDialog } from '../components/Returns/ReturnDialog';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Skeleton,
  cn,
} from '@reactive-platform/shared-ui-components';

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, error } = useOrder(orderId || null);

  const [showReturnDialog, setShowReturnDialog] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleReturn = async () => {
    // In a real app, this would call the API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setShowReturnDialog(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 text-center">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Order not found</p>
        <p className="text-muted-foreground mb-4">
          The order you're looking for doesn't exist or has been removed.
        </p>
        <Button variant="outline" onClick={() => navigate('/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status];
  const canReturn = order.status === 'DELIVERED' && order.items.some((i) => i.returnableQuantity > 0);
  const canCancel = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
              <Badge className={cn(statusConfig.color, 'text-white')}>
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <MailIcon className="mr-2 h-4 w-4" />
            Email Receipt
          </Button>
          {canReturn && (
            <Button variant="outline" size="sm" onClick={() => setShowReturnDialog(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Return
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" size="sm">
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {order.isB2B ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">{order.customerName}</p>
                  {order.companyName && (
                    <p className="text-sm text-muted-foreground">{order.companyName}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                  {order.customerPhone && (
                    <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                  )}
                </div>
                {order.isB2B && order.purchaseOrderNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">PO Number</p>
                    <p className="font-mono">{order.purchaseOrderNumber}</p>
                    {order.paymentTerms && (
                      <p className="text-sm text-muted-foreground">{order.paymentTerms}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.lineTotal)}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fulfillment */}
          <div className="space-y-4">
            <h3 className="font-semibold">Fulfillment</h3>
            {order.fulfillmentGroups.map((group) => {
              const itemNames = group.items
                .map((itemId) => order.items.find((i) => i.id === itemId)?.name)
                .filter(Boolean) as string[];
              return (
                <FulfillmentTracker key={group.id} fulfillmentGroup={group} itemNames={itemNames} />
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shippingTotal > 0 ? formatCurrency(order.shippingTotal) : 'Free'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.taxTotal)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(order.grandTotal)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {payment.cardBrand} ****{payment.lastFour}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.capturedAt)}
                    </p>
                  </div>
                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                </div>
              ))}
              {order.amountRefunded > 0 && (
                <div className="flex justify-between text-sm text-orange-600 pt-2 border-t">
                  <span>Refunded</span>
                  <span>-{formatCurrency(order.amountRefunded)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardContent className="pt-6">
              <OrderTimeline timeline={order.timeline} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Return Dialog */}
      <ReturnDialog
        open={showReturnDialog}
        onOpenChange={setShowReturnDialog}
        order={order}
        onReturn={handleReturn}
      />
    </div>
  );
}
