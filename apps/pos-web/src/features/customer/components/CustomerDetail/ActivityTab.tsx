import {
  ShoppingBag,
  XCircle,
  RotateCcw,
  CheckCircle,
  UserCog,
  MapPin,
  Award,
  Gift,
  Ticket,
  MessageSquare,
} from 'lucide-react';
import type { CustomerActivity, ActivityType } from '../../types/customer';
import {
  Card,
  CardContent,
  Badge,
} from '@reactive-platform/shared-ui-components';

interface ActivityTabProps {
  activities: CustomerActivity[];
  isLoading?: boolean;
}

export function ActivityTab({ activities, isLoading }: ActivityTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No activity recorded
      </div>
    );
  }

  const getActivityIcon = (type: ActivityType) => {
    const icons: Record<ActivityType, React.ReactNode> = {
      ORDER_PLACED: <ShoppingBag className="h-4 w-4" />,
      ORDER_CANCELLED: <XCircle className="h-4 w-4" />,
      RETURN_REQUESTED: <RotateCcw className="h-4 w-4" />,
      RETURN_COMPLETED: <CheckCircle className="h-4 w-4" />,
      PROFILE_UPDATED: <UserCog className="h-4 w-4" />,
      ADDRESS_ADDED: <MapPin className="h-4 w-4" />,
      ADDRESS_UPDATED: <MapPin className="h-4 w-4" />,
      LOYALTY_ENROLLED: <Award className="h-4 w-4" />,
      POINTS_EARNED: <Gift className="h-4 w-4" />,
      POINTS_REDEEMED: <Gift className="h-4 w-4" />,
      SUPPORT_TICKET: <Ticket className="h-4 w-4" />,
      NOTE_ADDED: <MessageSquare className="h-4 w-4" />,
    };
    return icons[type] || <ShoppingBag className="h-4 w-4" />;
  };

  const getActivityColor = (type: ActivityType) => {
    const colors: Record<ActivityType, { bg: string; text: string }> = {
      ORDER_PLACED: { bg: 'bg-green-100', text: 'text-green-600' },
      ORDER_CANCELLED: { bg: 'bg-red-100', text: 'text-red-600' },
      RETURN_REQUESTED: { bg: 'bg-orange-100', text: 'text-orange-600' },
      RETURN_COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-600' },
      PROFILE_UPDATED: { bg: 'bg-purple-100', text: 'text-purple-600' },
      ADDRESS_ADDED: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
      ADDRESS_UPDATED: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
      LOYALTY_ENROLLED: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      POINTS_EARNED: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
      POINTS_REDEEMED: { bg: 'bg-pink-100', text: 'text-pink-600' },
      SUPPORT_TICKET: { bg: 'bg-slate-100', text: 'text-slate-600' },
      NOTE_ADDED: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    };
    return colors[type] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  const getActivityLabel = (type: ActivityType) => {
    const labels: Record<ActivityType, string> = {
      ORDER_PLACED: 'Order Placed',
      ORDER_CANCELLED: 'Order Cancelled',
      RETURN_REQUESTED: 'Return Requested',
      RETURN_COMPLETED: 'Return Completed',
      PROFILE_UPDATED: 'Profile Updated',
      ADDRESS_ADDED: 'Address Added',
      ADDRESS_UPDATED: 'Address Updated',
      LOYALTY_ENROLLED: 'Loyalty Enrolled',
      POINTS_EARNED: 'Points Earned',
      POINTS_REDEEMED: 'Points Redeemed',
      SUPPORT_TICKET: 'Support Ticket',
      NOTE_ADDED: 'Note Added',
    };
    return labels[type] || type;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  // Group activities by date
  const groupedActivities = activities.reduce(
    (groups, activity) => {
      const dateKey = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(activity.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
      return groups;
    },
    {} as Record<string, CustomerActivity[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedActivities).map(([date, dateActivities]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
          <div className="space-y-3">
            {dateActivities.map((activity) => {
              const colors = getActivityColor(activity.type);
              return (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <span className={colors.text}>
                          {getActivityIcon(activity.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={colors.bg}>
                            {getActivityLabel(activity.type)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(activity.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1">{activity.description}</p>
                        {activity.userId !== 'system' && (
                          <p className="text-sm text-muted-foreground mt-1">
                            by {activity.userId}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
