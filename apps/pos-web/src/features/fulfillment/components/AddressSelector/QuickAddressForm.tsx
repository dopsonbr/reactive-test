import { useState } from 'react';
import type { Address } from '../../types/fulfillment';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@reactive-platform/shared-ui-components';

interface QuickAddressFormProps {
  initialAddress?: Partial<Address>;
  onSubmit: (address: Address) => void;
  onCancel?: () => void;
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

export function QuickAddressForm({ initialAddress, onSubmit, onCancel }: QuickAddressFormProps) {
  const [address, setAddress] = useState<Partial<Address>>({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    type: 'SHIPPING',
    ...initialAddress,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!address.line1?.trim()) {
      newErrors.line1 = 'Street address is required';
    }
    if (!address.city?.trim()) {
      newErrors.city = 'City is required';
    }
    if (!address.state) {
      newErrors.state = 'State is required';
    }
    if (!address.postalCode?.trim()) {
      newErrors.postalCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(address.postalCode)) {
      newErrors.postalCode = 'Invalid ZIP code format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      id: `addr-${Date.now()}`,
      name: address.name || 'New Address',
      type: 'SHIPPING',
      line1: address.line1!,
      line2: address.line2,
      city: address.city!,
      state: address.state!,
      postalCode: address.postalCode!,
      country: 'US',
      isPrimary: false,
    });
  };

  const updateField = (field: keyof Address, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="line1">Street Address</Label>
        <Input
          id="line1"
          value={address.line1}
          onChange={(e) => updateField('line1', e.target.value)}
          placeholder="123 Main Street"
          className={errors.line1 ? 'border-destructive' : ''}
        />
        {errors.line1 && <p className="text-xs text-destructive">{errors.line1}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="line2">Apt, Suite, etc. (optional)</Label>
        <Input
          id="line2"
          value={address.line2}
          onChange={(e) => updateField('line2', e.target.value)}
          placeholder="Apt 4B"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={address.city}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="City"
            className={errors.city ? 'border-destructive' : ''}
          />
          {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select value={address.state} onValueChange={(value) => updateField('state', value)}>
            <SelectTrigger className={errors.state ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((state) => (
                <SelectItem key={state.code} value={state.code}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="postalCode">ZIP Code</Label>
        <Input
          id="postalCode"
          value={address.postalCode}
          onChange={(e) => updateField('postalCode', e.target.value)}
          placeholder="12345"
          className={errors.postalCode ? 'border-destructive' : ''}
          maxLength={10}
        />
        {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">Use This Address</Button>
      </div>
    </form>
  );
}
