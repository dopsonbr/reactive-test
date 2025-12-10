import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCustomerLookup } from '@reactive-platform/commerce-hooks';
import { Button } from '@reactive-platform/shared-ui/ui-components';
import { useKioskSession } from '../../session';
import { PhoneInput } from '../components/PhoneInput';
import { EmailInput } from '../components/EmailInput';
import { LoyaltyResult } from '../components/LoyaltyResult';

/**
 * LoyaltyPage - Customer loyalty account lookup for self-checkout kiosk
 *
 * Features:
 * - Toggle between phone and email lookup modes
 * - Touch-optimized input with on-screen keyboards
 * - Display customer loyalty info (tier, points)
 * - Link customer to kiosk session
 * - Option to skip without loyalty account
 */
export function LoyaltyPage() {
  const [inputMode, setInputMode] = useState<'phone' | 'email'>('phone');
  const [phoneValue, setPhoneValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const navigate = useNavigate();
  const { linkCustomer, storeNumber, serviceAccountId, transactionId } = useKioskSession();

  const {
    mutate: lookupCustomer,
    data: customer,
    isPending: isLoading,
    error
  } = useCustomerLookup();

  const currentValue = inputMode === 'phone' ? phoneValue : emailValue;

  const handleLookup = () => {
    if (!currentValue.trim()) return;

    // x-order-number is required by backend services (UUID format)
    const orderNumber = transactionId || crypto.randomUUID();
    const headers = {
      'x-store-number': storeNumber.toString(),
      'x-userid': serviceAccountId,
      'x-sessionid': orderNumber,
      'x-order-number': orderNumber,
    };

    if (inputMode === 'phone') {
      lookupCustomer({
        phone: phoneValue,
        headers,
      });
    } else {
      lookupCustomer({
        email: emailValue,
        headers,
      });
    }
  };

  const handleContinue = () => {
    if (customer) {
      linkCustomer(customer.id);
    }
    navigate({ to: '/checkout' });
  };

  const handleSkip = () => {
    navigate({ to: '/checkout' });
  };

  const isValidPhone = phoneValue.length === 10;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  const canLookup = inputMode === 'phone' ? isValidPhone : isValidEmail;
  const hasLookedUp = customer !== undefined || error !== null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Loyalty Account</h1>
        <p className="text-xl">Link your account to earn rewards</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Mode Toggle */}
          {!hasLookedUp && (
            <div className="flex gap-4 justify-center">
              <Button
                variant={inputMode === 'phone' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setInputMode('phone')}
                className="text-2xl px-12 py-8 min-w-[240px]"
              >
                Phone Number
              </Button>
              <Button
                variant={inputMode === 'email' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setInputMode('email')}
                className="text-2xl px-12 py-8 min-w-[240px]"
              >
                Email Address
              </Button>
            </div>
          )}

          {/* Input Area */}
          {!hasLookedUp && (
            <div className="bg-card border rounded-lg p-8">
              {inputMode === 'phone' ? (
                <PhoneInput value={phoneValue} onChange={setPhoneValue} />
              ) : (
                <EmailInput value={emailValue} onChange={setEmailValue} />
              )}
            </div>
          )}

          {/* Lookup Result */}
          {hasLookedUp && (
            <LoyaltyResult
              isLoading={isLoading}
              customer={customer}
              error={error}
              lookupMode={inputMode}
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            {!hasLookedUp ? (
              <>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleLookup}
                  disabled={!canLookup || isLoading}
                  className="text-2xl px-12 py-8 min-w-[280px]"
                >
                  Look Up Account
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="text-2xl px-12 py-8 min-w-[280px]"
                >
                  Skip - No Loyalty Account
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleContinue}
                  className="text-2xl px-12 py-8 min-w-[280px]"
                >
                  {customer ? 'Continue with Account' : 'Continue Anyway'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setPhoneValue('');
                    setEmailValue('');
                    lookupCustomer(
                      { phone: '', email: '' },
                      {
                        onSuccess: () => {
                          // Reset lookup state
                        },
                      }
                    );
                  }}
                  className="text-2xl px-12 py-8 min-w-[280px]"
                >
                  Try Again
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
