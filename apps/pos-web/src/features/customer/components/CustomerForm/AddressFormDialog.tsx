import { useState, useEffect } from 'react';
import type { AddressInput, AddressType } from '../../types/customer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '@reactive-platform/shared-ui-components';

interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAddress?: AddressInput;
  onSave: (address: AddressInput) => void;
}

const defaultAddress: AddressInput = {
  type: 'BOTH',
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  isPrimary: false,
};

export function AddressFormDialog({
  open,
  onOpenChange,
  initialAddress,
  onSave,
}: AddressFormDialogProps) {
  const [address, setAddress] = useState<AddressInput>(defaultAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setAddress(initialAddress || defaultAddress);
      setErrors({});
    }
  }, [open, initialAddress]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!address.name.trim()) {
      newErrors.name = 'Address name is required';
    }
    if (!address.line1.trim()) {
      newErrors.line1 = 'Address line 1 is required';
    }
    if (!address.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!address.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!address.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(address.postalCode)) {
      newErrors.postalCode = 'Invalid postal code format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(address);
    }
  };

  const updateField = <K extends keyof AddressInput>(key: K, value: AddressInput[K]) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialAddress ? 'Edit Address' : 'Add Address'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Address Type */}
          <div className="space-y-2">
            <Label htmlFor="addressType">Address Type</Label>
            <Select
              value={address.type}
              onValueChange={(v) => updateField('type', v as AddressType)}
            >
              <SelectTrigger id="addressType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOTH">Billing & Shipping</SelectItem>
                <SelectItem value="SHIPPING">Shipping Only</SelectItem>
                <SelectItem value="BILLING">Billing Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Address Name */}
          <div className="space-y-2">
            <Label htmlFor="addressName">Address Label *</Label>
            <Input
              id="addressName"
              value={address.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Home, Work, etc."
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Address Line 1 */}
          <div className="space-y-2">
            <Label htmlFor="line1">Address Line 1 *</Label>
            <Input
              id="line1"
              value={address.line1}
              onChange={(e) => updateField('line1', e.target.value)}
              placeholder="123 Main Street"
              className={errors.line1 ? 'border-destructive' : ''}
            />
            {errors.line1 && (
              <p className="text-sm text-destructive">{errors.line1}</p>
            )}
          </div>

          {/* Address Line 2 */}
          <div className="space-y-2">
            <Label htmlFor="line2">Address Line 2</Label>
            <Input
              id="line2"
              value={address.line2 || ''}
              onChange={(e) => updateField('line2', e.target.value)}
              placeholder="Apt, Suite, etc. (optional)"
            />
          </div>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-3 space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={address.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Austin"
                className={errors.city ? 'border-destructive' : ''}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>
            <div className="col-span-1 space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={address.state}
                onChange={(e) => updateField('state', e.target.value.toUpperCase())}
                placeholder="TX"
                maxLength={2}
                className={errors.state ? 'border-destructive' : ''}
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state}</p>
              )}
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="postalCode">ZIP Code *</Label>
              <Input
                id="postalCode"
                value={address.postalCode}
                onChange={(e) => updateField('postalCode', e.target.value)}
                placeholder="78701"
                className={errors.postalCode ? 'border-destructive' : ''}
              />
              {errors.postalCode && (
                <p className="text-sm text-destructive">{errors.postalCode}</p>
              )}
            </div>
          </div>

          {/* Primary Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPrimary"
              checked={address.isPrimary}
              onCheckedChange={(checked) => updateField('isPrimary', !!checked)}
            />
            <Label htmlFor="isPrimary" className="cursor-pointer">
              Set as primary address
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            {initialAddress ? 'Update' : 'Add'} Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
