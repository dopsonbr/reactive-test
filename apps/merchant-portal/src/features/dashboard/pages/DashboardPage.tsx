import { useAuth } from '../../auth';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back, {user?.username || 'Guest'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">Products</h3>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">Low Stock</h3>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">On Sale</h3>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
      </div>
    </div>
  );
}
