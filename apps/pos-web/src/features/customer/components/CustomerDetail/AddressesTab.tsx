import { MapPin, Plus, Edit, Trash2, Star } from 'lucide-react';
import type { Address } from '../../types/customer';
import {
  Card,
  CardContent,
  Badge,
  Button,
} from '@reactive-platform/shared-ui-components';

interface AddressesTabProps {
  addresses: Address[];
  onAddAddress?: () => void;
  onEditAddress?: (address: Address) => void;
  onDeleteAddress?: (addressId: string) => void;
  onSetPrimary?: (addressId: string) => void;
  canEdit?: boolean;
}

export function AddressesTab({
  addresses,
  onAddAddress,
  onEditAddress,
  onDeleteAddress,
  onSetPrimary,
  canEdit = false,
}: AddressesTabProps) {
  const getAddressTypeLabel = (type: Address['type']) => {
    switch (type) {
      case 'SHIPPING':
        return 'Shipping';
      case 'BILLING':
        return 'Billing';
      case 'BOTH':
        return 'Billing & Shipping';
      default:
        return type;
    }
  };

  const getAddressTypeColor = (type: Address['type']) => {
    switch (type) {
      case 'SHIPPING':
        return 'bg-blue-100 text-blue-800';
      case 'BILLING':
        return 'bg-purple-100 text-purple-800';
      case 'BOTH':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (addresses.length === 0 && !canEdit) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No addresses on file
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Address Button */}
      {canEdit && onAddAddress && (
        <div className="flex justify-end">
          <Button onClick={onAddAddress} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Address
          </Button>
        </div>
      )}

      {/* Address Cards */}
      {addresses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No addresses on file</p>
          {canEdit && (
            <p className="text-sm mt-2">Click "Add Address" to add one</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className={address.isPrimary ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{address.name}</span>
                    {address.isPrimary && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <Badge variant="secondary" className={getAddressTypeColor(address.type)}>
                    {getAddressTypeLabel(address.type)}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                </div>

                {canEdit && (
                  <div className="mt-4 flex items-center gap-2">
                    {!address.isPrimary && onSetPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSetPrimary(address.id)}
                      >
                        Set as Primary
                      </Button>
                    )}
                    {onEditAddress && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditAddress(address)}
                        className="gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                    {onDeleteAddress && !address.isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteAddress(address.id)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
