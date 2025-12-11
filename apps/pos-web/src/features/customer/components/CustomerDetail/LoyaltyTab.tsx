import { Star, TrendingUp, Award, Gift, ArrowUp, ArrowDown, Minus, Clock } from 'lucide-react';
import type { LoyaltyDetails, PointsTransaction } from '../../types/customer';
import { LOYALTY_TIERS } from '../../types/customer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
} from '@reactive-platform/shared-ui-components';

interface LoyaltyTabProps {
  loyaltyDetails: LoyaltyDetails | null;
  isLoading?: boolean;
}

export function LoyaltyTab({ loyaltyDetails, isLoading }: LoyaltyTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse bg-muted rounded-lg" />
        <div className="h-64 animate-pulse bg-muted rounded-lg" />
      </div>
    );
  }

  if (!loyaltyDetails) {
    return (
      <div className="text-center py-12">
        <Gift className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
        <h3 className="text-lg font-medium">Not Enrolled in Loyalty Program</h3>
        <p className="text-muted-foreground mt-2">
          This customer is not enrolled in the loyalty program
        </p>
      </div>
    );
  }

  const tierConfig = LOYALTY_TIERS[loyaltyDetails.tier];
  const nextTierConfig = loyaltyDetails.nextTier ? LOYALTY_TIERS[loyaltyDetails.nextTier] : null;

  const progressToNextTier = nextTierConfig
    ? ((loyaltyDetails.currentPoints - tierConfig.pointsRequired) /
        (nextTierConfig.pointsRequired - tierConfig.pointsRequired)) *
      100
    : 100;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      BRONZE: 'bg-amber-100 text-amber-800 border-amber-200',
      SILVER: 'bg-gray-100 text-gray-800 border-gray-200',
      GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PLATINUM: 'bg-violet-100 text-violet-800 border-violet-200',
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };

  const getTransactionIcon = (type: PointsTransaction['type']) => {
    switch (type) {
      case 'EARN':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'REDEEM':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'EXPIRE':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'ADJUST':
        return <Minus className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTransactionColor = (type: PointsTransaction['type']) => {
    switch (type) {
      case 'EARN':
        return 'text-green-600';
      case 'REDEEM':
      case 'EXPIRE':
        return 'text-red-600';
      case 'ADJUST':
        return 'text-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tier Card */}
      <Card className={`${getTierColor(loyaltyDetails.tier)} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-white/50">
                <Star className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{loyaltyDetails.tier}</h2>
                <p className="text-sm opacity-80">
                  {loyaltyDetails.multiplier}x points multiplier
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">
                {formatNumber(loyaltyDetails.currentPoints)}
              </p>
              <p className="text-sm opacity-80">available points</p>
            </div>
          </div>

          {/* Tier Benefits */}
          <div className="mt-4 pt-4 border-t border-current/10">
            <p className="text-sm font-medium mb-2">Your Benefits:</p>
            <div className="flex flex-wrap gap-2">
              {tierConfig.benefits.map((benefit, i) => (
                <Badge key={i} variant="secondary" className="bg-white/50">
                  {benefit}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress to Next Tier */}
      {loyaltyDetails.nextTier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress to {loyaltyDetails.nextTier}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>{loyaltyDetails.tier}</span>
              <span>{loyaltyDetails.nextTier}</span>
            </div>
            <Progress value={progressToNextTier} className="h-3" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatNumber(loyaltyDetails.currentPoints)} pts</span>
              <span>{formatNumber(loyaltyDetails.pointsToNextTier)} pts to go</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Points Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lifetime Points</p>
                <p className="text-xl font-semibold">
                  {formatNumber(loyaltyDetails.lifetimePoints)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {loyaltyDetails.tierExpiration && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tier Expires</p>
                  <p className="text-xl font-semibold">
                    {formatDate(loyaltyDetails.tierExpiration)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Points History */}
      <Card>
        <CardHeader>
          <CardTitle>Points History</CardTitle>
        </CardHeader>
        <CardContent>
          {loyaltyDetails.pointsHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No points history yet
            </p>
          ) : (
            <div className="space-y-3">
              {loyaltyDetails.pointsHistory.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.date)}
                        {transaction.orderId && ` • Order #${transaction.orderId.slice(-5)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${getTransactionColor(transaction.type)}`}>
                      {transaction.points > 0 ? '+' : ''}
                      {formatNumber(transaction.points)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Balance: {formatNumber(transaction.balance)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
