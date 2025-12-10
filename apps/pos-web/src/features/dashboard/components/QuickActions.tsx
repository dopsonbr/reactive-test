import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Users,
  Package,
  RotateCcw,
  Shield,
  BarChart3,
} from 'lucide-react';
import { useAuth, Permission, usePermission } from '../../auth';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@reactive-platform/shared-ui-components';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: typeof ShoppingCart;
  path: string;
  permission: Permission | null;
  variant?: 'default' | 'secondary' | 'outline';
}

const quickActions: QuickAction[] = [
  {
    id: 'new-transaction',
    label: 'New Transaction',
    description: 'Start a new sale',
    icon: ShoppingCart,
    path: '/transaction',
    permission: Permission.TRANSACTION_CREATE,
    variant: 'default',
  },
  {
    id: 'find-customer',
    label: 'Find Customer',
    description: 'Search customer database',
    icon: Users,
    path: '/customers',
    permission: Permission.CUSTOMER_VIEW,
    variant: 'secondary',
  },
  {
    id: 'view-orders',
    label: 'View Orders',
    description: 'Search and manage orders',
    icon: Package,
    path: '/orders',
    permission: Permission.ORDER_VIEW,
    variant: 'secondary',
  },
  {
    id: 'process-return',
    label: 'Process Return',
    description: 'Handle customer returns',
    icon: RotateCcw,
    path: '/transaction/return',
    permission: Permission.TRANSACTION_VOID,
    variant: 'outline',
  },
  {
    id: 'manager-override',
    label: 'Manager Override',
    description: 'Authorize special actions',
    icon: Shield,
    path: '/override',
    permission: Permission.MARKDOWN_OVERRIDE,
    variant: 'outline',
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'View sales and metrics',
    icon: BarChart3,
    path: '/reports',
    permission: Permission.ADMIN_REPORTS,
    variant: 'outline',
  },
];

function QuickActionButton({ action }: { action: QuickAction }) {
  const navigate = useNavigate();
  const hasPermission = action.permission ? usePermission(action.permission) : true;

  if (!hasPermission) return null;

  const Icon = action.icon;

  return (
    <Button
      variant={action.variant}
      className="h-auto flex-col gap-2 p-4"
      onClick={() => navigate(action.path)}
    >
      <Icon className="h-6 w-6" />
      <div className="text-center">
        <div className="font-medium">{action.label}</div>
        <div className="text-xs text-muted-foreground">{action.description}</div>
      </div>
    </Button>
  );
}

export function QuickActions() {
  const { hasPermission } = useAuth();

  const availableActions = quickActions.filter(
    (action) => action.permission === null || hasPermission(action.permission)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {availableActions.map((action) => (
            <QuickActionButton key={action.id} action={action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
