import { DollarSign, ShoppingBag, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  cn,
} from '@reactive-platform/shared-ui-components';
import { useDashboardMetrics, calculateTrend } from '../hooks/useDashboardMetrics';

interface MetricCardProps {
  title: string;
  value: string;
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' };
  icon: typeof DollarSign;
  trendLabel?: string;
  trendPositiveIsGood?: boolean;
}

function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  trendLabel = 'vs yesterday',
  trendPositiveIsGood = true,
}: MetricCardProps) {
  const isPositiveTrend = trend?.direction === 'up';
  const trendIsGood = trendPositiveIsGood ? isPositiveTrend : !isPositiveTrend;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && trend.direction !== 'neutral' && (
          <p
            className={cn(
              'flex items-center gap-1 text-xs',
              trendIsGood ? 'text-green-600' : 'text-red-600'
            )}
          >
            {isPositiveTrend ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>
              {trend.value.toFixed(1)}% {trendLabel}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export function MetricsCards() {
  const { metrics, isLoading, error } = useDashboardMetrics();

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (isLoading || !metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const transactionsTrend = calculateTrend(
    metrics.todayTransactions,
    metrics.comparisonPeriod.transactions
  );
  const salesTrend = calculateTrend(
    metrics.todaySales,
    metrics.comparisonPeriod.sales
  );
  const returnsTrend = calculateTrend(
    metrics.todayReturns,
    metrics.comparisonPeriod.returns
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Transactions Today"
        value={metrics.todayTransactions.toString()}
        trend={transactionsTrend}
        icon={ShoppingBag}
      />
      <MetricCard
        title="Sales Today"
        value={`$${metrics.todaySales.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        trend={salesTrend}
        icon={DollarSign}
      />
      <MetricCard
        title="Returns Today"
        value={`$${metrics.todayReturns.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        trend={returnsTrend}
        icon={RotateCcw}
        trendPositiveIsGood={false}
      />
      <MetricCard
        title="Avg. Transaction"
        value={`$${metrics.averageTransactionValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        icon={TrendingUp}
      />
    </div>
  );
}
