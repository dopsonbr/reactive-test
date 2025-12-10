import { MapPin, Mail, MessageSquare, ShoppingBag, ArrowRight } from 'lucide-react';
import type { Customer, CustomerStats, Order } from '../../types/customer';
import { CustomerStats as StatsDisplay } from './CustomerStats';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from '@reactive-platform/shared-ui-components';

interface OverviewTabProps {
  customer: Customer;
  stats: CustomerStats;
  recentOrders: Order[];
  isLoading?: boolean;
  onViewOrders: () => void;
}

export function OverviewTab({
  customer,
  stats,
  recentOrders,
  isLoading,
  onViewOrders,
}: OverviewTabProps) {
  const primaryAddress = customer.addresses.find((a) => a.isPrimary) || customer.addresses[0];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getOrderStatusColor = (status: Order['status']) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      RETURNED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsDisplay stats={stats} isLoading={isLoading} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Primary Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {primaryAddress ? (
              <div className="space-y-1">
                <p className="font-medium">{primaryAddress.name}</p>
                <p className="text-muted-foreground">{primaryAddress.line1}</p>
                {primaryAddress.line2 && (
                  <p className="text-muted-foreground">{primaryAddress.line2}</p>
                )}
                <p className="text-muted-foreground">
                  {primaryAddress.city}, {primaryAddress.state} {primaryAddress.postalCode}
                </p>
                <Badge variant="outline" className="mt-2">
                  {primaryAddress.type === 'BOTH'
                    ? 'Billing & Shipping'
                    : primaryAddress.type}
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">No address on file</p>
            )}
          </CardContent>
        </Card>

        {/* Communication Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Communication Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Promotions
                </span>
                <Badge
                  variant={customer.communicationPreferences.emailPromotions ? 'default' : 'secondary'}
                >
                  {customer.communicationPreferences.emailPromotions ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  SMS Alerts
                </span>
                <Badge
                  variant={customer.communicationPreferences.smsAlerts ? 'default' : 'secondary'}
                >
                  {customer.communicationPreferences.smsAlerts ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Direct Mail
                </span>
                <Badge
                  variant={customer.communicationPreferences.directMail ? 'default' : 'secondary'}
                >
                  {customer.communicationPreferences.directMail ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Recent Orders
          </CardTitle>
          {recentOrders.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onViewOrders} className="gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)} • {order.itemCount} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(order.total)}</p>
                    <Badge variant="secondary" className={getOrderStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No orders yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
