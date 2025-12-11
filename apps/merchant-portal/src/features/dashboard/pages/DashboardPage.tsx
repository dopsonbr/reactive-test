import { Link } from '@tanstack/react-router';
import { Package, AlertTriangle, Tag, ArrowRight } from 'lucide-react';
import { useAuth } from '../../auth';
import { useProducts } from '../../products/api/useProducts';
import { useLowStockItems } from '../../inventory/api/useInventory';
import { usePrices } from '../../pricing/api/usePricing';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: products, isLoading: productsLoading } = useProducts(0, 100);
  const { data: lowStock, isLoading: lowStockLoading } = useLowStockItems(10);
  const { data: prices, isLoading: pricesLoading } = usePrices(0, 100);

  const productCount = products?.length ?? 0;
  const lowStockCount = lowStock?.length ?? 0;
  const onSaleCount = prices?.filter(p => p.originalPrice && p.originalPrice > p.price).length ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Welcome back, {user?.username || 'Guest'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Products Card */}
        <Link
          to="/products"
          className="group rounded-lg border bg-card p-6 hover:border-primary hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-full bg-primary/10 p-3">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="font-semibold mt-4">Products</h3>
          <p className="text-3xl font-bold mt-1">
            {productsLoading ? '...' : productCount}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Total products</p>
        </Link>

        {/* Low Stock Card */}
        <Link
          to="/inventory"
          className="group rounded-lg border bg-card p-6 hover:border-orange-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-full bg-orange-500/10 p-3">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
          </div>
          <h3 className="font-semibold mt-4">Low Stock</h3>
          <p className="text-3xl font-bold mt-1">
            {lowStockLoading ? '...' : lowStockCount}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Items below threshold</p>
        </Link>

        {/* On Sale Card */}
        <Link
          to="/pricing"
          className="group rounded-lg border bg-card p-6 hover:border-green-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-full bg-green-500/10 p-3">
              <Tag className="h-6 w-6 text-green-500" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-green-500 transition-colors" />
          </div>
          <h3 className="font-semibold mt-4">On Sale</h3>
          <p className="text-3xl font-bold mt-1">
            {pricesLoading ? '...' : onSaleCount}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Discounted items</p>
        </Link>
      </div>
    </div>
  );
}
