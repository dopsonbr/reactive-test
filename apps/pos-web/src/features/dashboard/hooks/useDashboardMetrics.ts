import { useState, useEffect } from 'react';

export interface DashboardMetrics {
  todayTransactions: number;
  todaySales: number;
  todayReturns: number;
  averageTransactionValue: number;
  comparisonPeriod: {
    transactions: number;
    sales: number;
    returns: number;
  };
}

interface UseDashboardMetricsResult {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Mock data for demo purposes
const mockMetrics: DashboardMetrics = {
  todayTransactions: 42,
  todaySales: 8750.5,
  todayReturns: 320.0,
  averageTransactionValue: 208.35,
  comparisonPeriod: {
    transactions: 38,
    sales: 7200.0,
    returns: 450.0,
  },
};

export function useDashboardMetrics(): UseDashboardMetricsResult {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, this would call the metrics API
      // For now, simulate API call with mock data
      await new Promise((resolve) => setTimeout(resolve, 800));
      setMetrics(mockMetrics);
    } catch {
      setError('Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
}

export function calculateTrend(current: number, previous: number): { value: number; direction: 'up' | 'down' | 'neutral' } {
  if (previous === 0) return { value: 0, direction: 'neutral' };

  const change = ((current - previous) / previous) * 100;
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  return { value: Math.abs(change), direction };
}
