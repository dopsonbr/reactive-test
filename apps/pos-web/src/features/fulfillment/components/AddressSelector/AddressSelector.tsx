import { useState } from 'react';
import { MapPin, Plus, Check } from 'lucide-react';
import type { Address } from '../../types/fulfillment';
import { QuickAddressForm } from './QuickAddressForm';
import {
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
  cn,
} from '@reactive-platform/shared-ui-components';

interface AddressSelectorProps {
  customerId: string | null;
  savedAddresses: Address[];
  selectedAddress: Address | null;
  onSelectAddress: (address: Address) => void;
}

export function AddressSelector({
  savedAddresses,
  selectedAddress,
  onSelectAddress,
}: AddressSelectorProps) {
  const [showNewAddressForm, setShowNewAddressForm] = useState(savedAddresses.length === 0);

  const formatAddress = (address: Address) => {
    return `${address.line1}${address.line2 ? ', ' + address.line2 : ''}, ${address.city}, ${address.state} ${address.postalCode}`;
  };

  const handleNewAddress = (address: Address) => {
    onSelectAddress(address);
    setShowNewAddressForm(false);
  };

  return (
    <div className="space-y-4">
      <Label>Delivery Address</Label>

      {/* Saved Addresses */}
      {savedAddresses.length > 0 && !showNewAddressForm && (
        <RadioGroup
          value={selectedAddress?.id || ''}
          onValueChange={(value) => {
            const address = savedAddresses.find((a) => a.id === value);
            if (address) onSelectAddress(address);
          }}
        >
          <div className="space-y-2">
            {savedAddresses.map((address) => (
              <label
                key={address.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  selectedAddress?.id === address.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent/50'
                )}
              >
                <RadioGroupItem value={address.id || ''} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{address.name}</span>
                    {address.isPrimary && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Default</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatAddress(address)}</p>
                </div>
                {selectedAddress?.id === address.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </label>
            ))}
          </div>
        </RadioGroup>
      )}

      {/* New Address Toggle/Form */}
      {savedAddresses.length > 0 && !showNewAddressForm && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewAddressForm(true)}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Use a Different Address
        </Button>
      )}

      {showNewAddressForm && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Enter new address</span>
          </div>
          <QuickAddressForm
            onSubmit={handleNewAddress}
            onCancel={savedAddresses.length > 0 ? () => setShowNewAddressForm(false) : undefined}
          />
        </div>
      )}
    </div>
  );
}
