import type { Customer } from '@reactive-platform/commerce-hooks';
import { Spinner, Badge, Alert } from '@reactive-platform/shared-ui/ui-components';

export interface LoyaltyResultProps {
  isLoading: boolean;
  customer: Customer | null | undefined;
  error: Error | null;
  lookupMode: 'phone' | 'email';
}

/**
 * LoyaltyResult component displays customer lookup results
 * - Loading state: Spinner
 * - Found: "Welcome back, [Name]!" with loyalty tier badge and points
 * - Not found: "No account found with that [phone/email]"
 * - Error: "Unable to look up account. Try again or skip."
 */
export function LoyaltyResult({ isLoading, customer, error, lookupMode }: LoyaltyResultProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <Spinner className="w-16 h-16" />
        <p className="text-xl text-muted-foreground">Looking up account...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold">Unable to look up account</h3>
          <p>There was an error checking for your loyalty account. Please try again or skip to continue.</p>
        </div>
      </Alert>
    );
  }

  if (customer === null) {
    return (
      <Alert className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold">No account found</h3>
          <p>
            We couldn't find a loyalty account with that {lookupMode === 'phone' ? 'phone number' : 'email address'}.
            You can try again or skip to continue without loyalty rewards.
          </p>
        </div>
      </Alert>
    );
  }

  if (customer) {
    return (
      <div className="bg-primary/5 border-2 border-primary rounded-lg p-8 max-w-2xl mx-auto">
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-primary mb-2">Welcome back!</h2>
            <p className="text-2xl font-semibold">{customer.name}</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            {customer.loyaltyTier && (
              <div className="flex items-center gap-3">
                <span className="text-lg font-medium">Loyalty Tier:</span>
                <Badge
                  variant={
                    customer.loyaltyTier === 'PLATINUM'
                      ? 'default'
                      : customer.loyaltyTier === 'GOLD'
                        ? 'secondary'
                        : 'outline'
                  }
                  className="text-xl px-4 py-2"
                >
                  {customer.loyaltyTier}
                </Badge>
              </div>
            )}

            {customer.loyaltyPoints !== undefined && (
              <div className="text-center">
                <p className="text-lg text-muted-foreground">Available Points</p>
                <p className="text-4xl font-bold text-primary">{customer.loyaltyPoints.toLocaleString()}</p>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground mt-2">
            <p>{customer.email}</p>
            {customer.phone && <p>{customer.phone}</p>}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
