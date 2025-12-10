import { useState, useMemo } from 'react';
import { Clock, Phone, User, CalendarDays } from 'lucide-react';
import type { WillCallConfig as WillCallConfigType } from '../../types/fulfillment';
import type { LineItem } from '../../../transaction/types/transaction';
import {
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@reactive-platform/shared-ui-components';

interface WillCallConfigProps {
  items: LineItem[];
  storeNumber: number;
  storeName: string;
  onConfigure: (config: WillCallConfigType) => void;
  onCancel: () => void;
}

export function WillCallConfig({
  items,
  storeNumber,
  storeName,
  onConfigure,
  onCancel,
}: WillCallConfigProps) {
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  });

  const [contactPhone, setContactPhone] = useState('');
  const [pickupPerson, setPickupPerson] = useState('');
  const [instructions, setInstructions] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const holdExpiration = useMemo(() => {
    const date = new Date(endDate);
    date.setDate(date.getDate() + 7);
    return date;
  }, [endDate]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    } else if (!/^\(?[0-9]{3}\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}$/.test(contactPhone)) {
      newErrors.contactPhone = 'Invalid phone format';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onConfigure({
      pickupWindowStart: new Date(startDate),
      pickupWindowEnd: new Date(endDate),
      contactPhone,
      pickupPersonName: pickupPerson || undefined,
      holdExpirationDate: holdExpiration,
      specialInstructions: instructions || undefined,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalValue = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Will Call Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Store Info */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-medium">Pickup Location</p>
            <p className="text-sm text-muted-foreground">
              Store #{storeNumber} - {storeName}
            </p>
          </div>

          {/* Items Summary */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-medium">Items on Will Call</p>
            <p className="text-sm text-muted-foreground">
              {items.length} item{items.length !== 1 ? 's' : ''} - Total: {formatCurrency(totalValue)}
            </p>
          </div>

          {/* Pickup Window */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Label>Pickup Window</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">From</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Until</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={errors.endDate ? 'border-destructive' : ''}
                />
                {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Items will be held until {holdExpiration.toLocaleDateString()}
            </p>
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="contactPhone">Contact Phone</Label>
            </div>
            <Input
              id="contactPhone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className={errors.contactPhone ? 'border-destructive' : ''}
            />
            {errors.contactPhone && <p className="text-xs text-destructive">{errors.contactPhone}</p>}
            <p className="text-xs text-muted-foreground">
              We'll call when order is ready for pickup
            </p>
          </div>

          {/* Alternate Pickup Person */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="pickupPerson">Alternate Pickup Person (optional)</Label>
            </div>
            <Input
              id="pickupPerson"
              value={pickupPerson}
              onChange={(e) => setPickupPerson(e.target.value)}
              placeholder="Name of person authorized to pick up"
            />
            <p className="text-xs text-muted-foreground">
              This person must show ID matching this name
            </p>
          </div>

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Special Instructions (optional)</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Any special notes for the pickup..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Confirm Will Call</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
