import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Star } from 'lucide-react';
import type { AddressInput, AddressType } from '../../types/customer';
import { AddressFormDialog } from './AddressFormDialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@reactive-platform/shared-ui-components';

interface AddressSectionProps {
  addresses: AddressInput[];
  onChange: (addresses: AddressInput[]) => void;
}

export function AddressSection({ addresses, onChange }: AddressSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddAddress = () => {
    setEditingIndex(null);
    setDialogOpen(true);
  };

  const handleEditAddress = (index: number) => {
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleSaveAddress = (address: AddressInput) => {
    if (editingIndex !== null) {
      // Update existing
      const updated = [...addresses];
      updated[editingIndex] = address;

      // If setting as primary, unset others
      if (address.isPrimary) {
        updated.forEach((a, i) => {
          if (i !== editingIndex) {
            a.isPrimary = false;
          }
        });
      }

      onChange(updated);
    } else {
      // Add new
      const newAddress = {
        ...address,
        // If this is the first address, make it primary
        isPrimary: addresses.length === 0 ? true : address.isPrimary,
      };

      // If setting as primary, unset others
      if (newAddress.isPrimary) {
        const updated = addresses.map((a) => ({ ...a, isPrimary: false }));
        onChange([...updated, newAddress]);
      } else {
        onChange([...addresses, newAddress]);
      }
    }
    setDialogOpen(false);
  };

  const handleDeleteAddress = (index: number) => {
    const updated = addresses.filter((_, i) => i !== index);
    // If we deleted the primary, make the first one primary
    if (addresses[index].isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    const updated = addresses.map((a, i) => ({
      ...a,
      isPrimary: i === index,
    }));
    onChange(updated);
  };

  const getAddressTypeLabel = (type: AddressType) => {
    switch (type) {
      case 'SHIPPING':
        return 'Shipping';
      case 'BILLING':
        return 'Billing';
      case 'BOTH':
        return 'Billing & Shipping';
    }
  };

  const getAddressTypeColor = (type: AddressType) => {
    switch (type) {
      case 'SHIPPING':
        return 'bg-blue-100 text-blue-800';
      case 'BILLING':
        return 'bg-purple-100 text-purple-800';
      case 'BOTH':
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Addresses</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleAddAddress} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Address
          </Button>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="text-center py-8 border rounded-lg border-dashed">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">No addresses added</p>
              <Button
                type="button"
                variant="link"
                onClick={handleAddAddress}
                className="mt-2"
              >
                Add an address
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((address, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${address.isPrimary ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{address.name}</span>
                      {address.isPrimary && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <Badge variant="secondary" className={getAddressTypeColor(address.type)}>
                        {getAddressTypeLabel(address.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {!address.isPrimary && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetPrimary(index)}
                        >
                          Set Primary
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAddress(index)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddress(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground ml-7">
                    <p>{address.line1}</p>
                    {address.line2 && <p>{address.line2}</p>}
                    <p>
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddressFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialAddress={editingIndex !== null ? addresses[editingIndex] : undefined}
        onSave={handleSaveAddress}
      />
    </>
  );
}
