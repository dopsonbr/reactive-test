import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
  cn,
} from '@reactive-platform/shared-ui-components';

type TransactionStatus = 'completed' | 'pending' | 'refunded' | 'void';

interface RecentTransaction {
  id: string;
  transactionId: string;
  customerName: string | null;
  amount: number;
  status: TransactionStatus;
  timestamp: Date;
  items: number;
}

// Mock data for demo
const mockTransactions: RecentTransaction[] = [
  {
    id: '1',
    transactionId: 'TXN-001234',
    customerName: 'John Smith',
    amount: 245.99,
    status: 'completed',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    items: 3,
  },
  {
    id: '2',
    transactionId: 'TXN-001233',
    customerName: null,
    amount: 89.5,
    status: 'completed',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    items: 1,
  },
  {
    id: '3',
    transactionId: 'TXN-001232',
    customerName: 'Sarah Johnson',
    amount: 512.0,
    status: 'pending',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    items: 5,
  },
  {
    id: '4',
    transactionId: 'TXN-001231',
    customerName: 'Mike Williams',
    amount: 78.25,
    status: 'refunded',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    items: 2,
  },
  {
    id: '5',
    transactionId: 'TXN-001230',
    customerName: 'Emily Brown',
    amount: 334.75,
    status: 'completed',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    items: 4,
  },
];

function formatTimeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString();
}

function getStatusVariant(status: TransactionStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'refunded':
    case 'void':
      return 'destructive';
    default:
      return 'outline';
  }
}

interface TransactionRowProps {
  transaction: RecentTransaction;
  onClick: () => void;
}

function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  return (
    <button
      className="flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors hover:bg-muted"
      onClick={onClick}
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{transaction.transactionId}</span>
          <Badge variant={getStatusVariant(transaction.status)}>
            {transaction.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{transaction.customerName || 'Guest'}</span>
          <span>•</span>
          <span>{transaction.items} items</span>
        </div>
      </div>
      <div className="text-right">
        <div className={cn(
          'font-medium',
          transaction.status === 'refunded' && 'text-destructive'
        )}>
          {transaction.status === 'refunded' ? '-' : ''}$
          {transaction.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatTimeAgo(transaction.timestamp)}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="space-y-2 text-right">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function RecentActivity() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<RecentTransaction[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchTransactions = async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setTransactions(mockTransactions);
      setIsLoading(false);
    };

    fetchTransactions();
  }, []);

  const handleTransactionClick = (transactionId: string) => {
    navigate(`/orders/${transactionId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {isLoading ? (
            [...Array(5)].map((_, i) => <TransactionRowSkeleton key={i} />)
          ) : transactions && transactions.length > 0 ? (
            transactions.map((txn) => (
              <TransactionRow
                key={txn.id}
                transaction={txn}
                onClick={() => handleTransactionClick(txn.transactionId)}
              />
            ))
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No recent transactions
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
