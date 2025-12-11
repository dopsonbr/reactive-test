import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from '@tanstack/react-router';
import { Package, DollarSign, Boxes, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../../features/auth';
import { Button } from '@reactive-platform/shared-ui-components';
import { ErrorBoundary } from '../components';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: null },
  { to: '/products', label: 'Products', icon: Package, permission: 'merchant' },
  { to: '/pricing', label: 'Pricing', icon: DollarSign, permission: 'pricing_specialist' },
  { to: '/inventory', label: 'Inventory', icon: Boxes, permission: 'inventory_specialist' },
];

export function DashboardLayout() {
  const { isAuthenticated, user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Show only content (no sidebar) for login page or unauthenticated users
  if (location.pathname === '/login' || !isAuthenticated) {
    return <Outlet />;
  }

  const visibleNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="p-6">
          <h1 className="text-xl font-bold">Merchant Portal</h1>
        </div>
        <nav className="px-3 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {user && (
          <div className="absolute bottom-0 left-0 w-64 p-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">
              {user.username}
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
