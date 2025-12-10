import { useAuth } from '../../auth';
import { QuickActions, MetricsCards, RecentActivity } from '../components';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name || 'User'}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening at your store today.
        </p>
      </div>

      {/* Metrics */}
      <MetricsCards />

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />

        {/* Alerts/Notifications placeholder */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Alerts</h3>
          <div className="text-sm text-muted-foreground">
            No alerts at this time.
          </div>
        </div>
      </div>
    </div>
  );
}
