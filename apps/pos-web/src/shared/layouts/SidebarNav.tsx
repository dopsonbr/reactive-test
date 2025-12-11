import {
  Home,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useAuth, Permission } from '../../features/auth';
import { SidebarNavItem } from './SidebarNavItem';

interface NavItem {
  label: string;
  path: string;
  icon: typeof Home;
  permission: Permission | null;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: Home,
    path: '/',
    permission: null, // All authenticated users
  },
  {
    label: 'New Transaction',
    icon: ShoppingCart,
    path: '/transaction',
    permission: Permission.TRANSACTION_CREATE,
  },
  {
    label: 'Customers',
    icon: Users,
    path: '/customers',
    permission: Permission.CUSTOMER_VIEW,
  },
  {
    label: 'Orders',
    icon: Package,
    path: '/orders',
    permission: Permission.ORDER_VIEW,
  },
  {
    label: 'Reports',
    icon: BarChart3,
    path: '/reports',
    permission: Permission.ADMIN_REPORTS,
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    permission: Permission.ADMIN_SETTINGS,
  },
];

export function SidebarNav() {
  const { hasPermission } = useAuth();

  const filteredItems = navItems.filter(
    (item) => item.permission === null || hasPermission(item.permission)
  );

  return (
    <nav className="flex flex-col gap-1">
      {filteredItems.map((item) => (
        <SidebarNavItem
          key={item.path}
          label={item.label}
          path={item.path}
          icon={item.icon}
        />
      ))}
    </nav>
  );
}
