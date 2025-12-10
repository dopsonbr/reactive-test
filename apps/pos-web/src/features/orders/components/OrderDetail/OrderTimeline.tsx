import {
  ShoppingBag,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  RotateCcw,
  XCircle,
  MessageSquare,
  Clock,
} from 'lucide-react';
import type { OrderTimeline as TimelineEntry, OrderTimelineType } from '../../types/order';
import { cn } from '@reactive-platform/shared-ui-components';

interface OrderTimelineProps {
  timeline: TimelineEntry[];
}

const TIMELINE_ICONS: Record<OrderTimelineType, React.ReactNode> = {
  ORDER_PLACED: <ShoppingBag className="h-4 w-4" />,
  ORDER_CONFIRMED: <CheckCircle className="h-4 w-4" />,
  PAYMENT_CAPTURED: <CreditCard className="h-4 w-4" />,
  ORDER_PROCESSING: <Clock className="h-4 w-4" />,
  ITEM_SHIPPED: <Truck className="h-4 w-4" />,
  ITEM_DELIVERED: <Package className="h-4 w-4" />,
  ORDER_COMPLETE: <CheckCircle className="h-4 w-4" />,
  RETURN_REQUESTED: <RotateCcw className="h-4 w-4" />,
  RETURN_APPROVED: <CheckCircle className="h-4 w-4" />,
  RETURN_RECEIVED: <Package className="h-4 w-4" />,
  REFUND_ISSUED: <CreditCard className="h-4 w-4" />,
  ORDER_CANCELLED: <XCircle className="h-4 w-4" />,
  NOTE_ADDED: <MessageSquare className="h-4 w-4" />,
};

const TIMELINE_COLORS: Record<OrderTimelineType, string> = {
  ORDER_PLACED: 'bg-blue-500',
  ORDER_CONFIRMED: 'bg-blue-500',
  PAYMENT_CAPTURED: 'bg-green-500',
  ORDER_PROCESSING: 'bg-yellow-500',
  ITEM_SHIPPED: 'bg-indigo-500',
  ITEM_DELIVERED: 'bg-green-500',
  ORDER_COMPLETE: 'bg-green-500',
  RETURN_REQUESTED: 'bg-orange-500',
  RETURN_APPROVED: 'bg-orange-500',
  RETURN_RECEIVED: 'bg-orange-500',
  REFUND_ISSUED: 'bg-green-500',
  ORDER_CANCELLED: 'bg-red-500',
  NOTE_ADDED: 'bg-gray-500',
};

export function OrderTimeline({ timeline }: OrderTimelineProps) {
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Sort timeline in reverse chronological order
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Order Timeline</h3>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-4">
          {sortedTimeline.map((entry, index) => (
            <div key={entry.id} className="relative flex gap-4 pl-10">
              {/* Icon */}
              <div
                className={cn(
                  'absolute left-0 p-2 rounded-full text-white',
                  TIMELINE_COLORS[entry.type]
                )}
              >
                {TIMELINE_ICONS[entry.type]}
              </div>

              {/* Content */}
              <div className={cn('flex-1 pb-4', index !== sortedTimeline.length - 1 && 'border-b')}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{entry.title}</p>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                    )}
                    {entry.userName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        By: {entry.userName}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(entry.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
