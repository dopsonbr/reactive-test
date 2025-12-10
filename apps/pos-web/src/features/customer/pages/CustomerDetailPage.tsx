import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  useCustomer,
  useCustomerStats,
  useCustomerOrders,
  useLoyaltyDetails,
  useCustomerActivity,
  useCreditUtilization,
} from '../hooks/useCustomer';
import {
  CustomerHeader,
  OverviewTab,
  OrdersTab,
  AddressesTab,
  LoyaltyTab,
  ActivityTab,
  B2BTab,
} from '../components/CustomerDetail';
import { usePermission, Permission } from '../../auth';
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
} from '@reactive-platform/shared-ui-components';

type TabValue = 'overview' | 'orders' | 'addresses' | 'loyalty' | 'b2b' | 'activity';

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  const canEdit = usePermission(Permission.CUSTOMER_EDIT);
  const canCreateTransaction = usePermission(Permission.TRANSACTION_CREATE);
  const canViewB2B = usePermission(Permission.B2B_VIEW);

  const { data: customer, isLoading: customerLoading, error: customerError } = useCustomer(customerId || '');
  const { data: stats, isLoading: statsLoading } = useCustomerStats(customerId || '');
  const { data: orders, isLoading: ordersLoading } = useCustomerOrders(customerId || '');
  const { data: loyaltyDetails, isLoading: loyaltyLoading } = useLoyaltyDetails(customerId || '');
  const { data: activities, isLoading: activitiesLoading } = useCustomerActivity(customerId || '');
  const { data: creditUtilization, isLoading: creditLoading } = useCreditUtilization(customerId || '');

  const handleBack = () => {
    navigate('/customers');
  };

  const handleEdit = () => {
    navigate(`/customers/${customerId}/edit`);
  };

  const handleStartTransaction = () => {
    if (customer) {
      navigate('/transaction', {
        state: {
          customerId: customer.id,
          customerName: `${customer.firstName} ${customer.lastName}`,
        },
      });
    }
  };

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (customerError || !customer) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            {customerError?.message || 'Customer not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isB2B = customer.type === 'BUSINESS';
  const hasLoyalty = customer.type === 'CONSUMER' && customer.loyalty;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={handleBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Search
      </Button>

      {/* Customer Header */}
      <CustomerHeader
        customer={customer}
        onEdit={handleEdit}
        onStartTransaction={handleStartTransaction}
        canEdit={canEdit}
        canCreateTransaction={canCreateTransaction}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          {hasLoyalty && <TabsTrigger value="loyalty">Loyalty</TabsTrigger>}
          {isB2B && canViewB2B && <TabsTrigger value="b2b">B2B</TabsTrigger>}
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab
            customer={customer}
            stats={stats || {
              totalOrders: 0,
              totalSpent: 0,
              averageOrderValue: 0,
              lastOrderDate: null,
              lifetimePoints: 0,
              currentPoints: 0,
            }}
            recentOrders={orders || []}
            isLoading={statsLoading || ordersLoading}
            onViewOrders={() => setActiveTab('orders')}
          />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrdersTab
            orders={orders || []}
            isLoading={ordersLoading}
            onViewOrder={(orderId) => console.log('View order:', orderId)}
            onReorder={(orderId) => console.log('Reorder:', orderId)}
          />
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <AddressesTab
            addresses={customer.addresses}
            canEdit={canEdit}
            onAddAddress={() => navigate(`/customers/${customerId}/edit?tab=addresses`)}
            onEditAddress={(address) => console.log('Edit address:', address)}
            onDeleteAddress={(addressId) => console.log('Delete address:', addressId)}
            onSetPrimary={(addressId) => console.log('Set primary:', addressId)}
          />
        </TabsContent>

        {hasLoyalty && (
          <TabsContent value="loyalty" className="mt-6">
            <LoyaltyTab
              loyaltyDetails={loyaltyDetails || null}
              isLoading={loyaltyLoading}
            />
          </TabsContent>
        )}

        {isB2B && canViewB2B && (
          <TabsContent value="b2b" className="mt-6">
            <B2BTab
              customer={customer}
              creditUtilization={creditUtilization || null}
              isLoading={creditLoading}
            />
          </TabsContent>
        )}

        <TabsContent value="activity" className="mt-6">
          <ActivityTab
            activities={activities || []}
            isLoading={activitiesLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
