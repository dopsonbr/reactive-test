import { useState } from 'react';
import { X, Package, Truck, Store, Clock, Wrench, ShoppingBag, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import type { FulfillmentGroup, FulfillmentType, Address, TimeSlot } from '../../types/fulfillment';
import { FULFILLMENT_TYPE_LABELS } from '../../types/fulfillment';
import type { LineItem } from '../../../transaction/types/transaction';
import { TimeSlotSelector } from '../TimeSlotSelector/TimeSlotSelector';
import { AddressSelector } from '../AddressSelector/AddressSelector';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from '@reactive-platform/shared-ui-components';

interface FulfillmentGroupCardProps {
  group: FulfillmentGroup;
  groupIndex: number;
  items: LineItem[];
  isDragTarget: boolean;
  onRemove: () => void;
  onUpdate: (updates: Partial<FulfillmentGroup>) => void;
  onRemoveItem: (itemId: string) => void;
  onDrop: () => void;
}

const typeIcons: Record<FulfillmentType, React.ReactNode> = {
  IMMEDIATE: <ShoppingBag className="h-4 w-4" />,
  PICKUP: <Store className="h-4 w-4" />,
  DELIVERY: <Truck className="h-4 w-4" />,
  WILL_CALL: <Clock className="h-4 w-4" />,
  INSTALLATION: <Wrench className="h-4 w-4" />,
};

export function FulfillmentGroupCard({
  group,
  groupIndex,
  items,
  isDragTarget,
  onRemove,
  onUpdate,
  onRemoveItem,
  onDrop,
}: FulfillmentGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop();
  };

  const needsConfiguration = () => {
    switch (group.type) {
      case 'IMMEDIATE':
        return false;
      case 'PICKUP':
      case 'WILL_CALL':
        return !group.storeNumber;
      case 'DELIVERY':
        return !group.address || !group.scheduledDate;
      case 'INSTALLATION':
        return !group.address || !group.scheduledDate || !group.timeSlot;
      default:
        return true;
    }
  };

  const getStatusBadge = () => {
    if (items.length === 0) {
      return <Badge variant="outline">No items</Badge>;
    }
    if (needsConfiguration()) {
      return <Badge variant="secondary">Needs configuration</Badge>;
    }
    return <Badge variant="default" className="bg-green-500">Ready</Badge>;
  };

  const handleAddressSelect = (address: Address) => {
    onUpdate({ address });
    setIsConfiguring(false);
  };

  const handleScheduleSelect = (date: Date, slot?: TimeSlot) => {
    onUpdate({ scheduledDate: date, timeSlot: slot });
    setIsConfiguring(false);
  };

  return (
    <Card
      className={cn(
        'transition-all',
        isDragTarget && 'ring-2 ring-primary ring-offset-2'
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {typeIcons[group.type]}
            <span className="font-medium">
              Shipment {groupIndex}: {FULFILLMENT_TYPE_LABELS[group.type]}
            </span>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>

        {/* Configuration Summary */}
        {group.type !== 'IMMEDIATE' && (
          <div className="text-sm text-muted-foreground mt-1">
            {group.address && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{group.address.line1}, {group.address.city}</span>
              </div>
            )}
            {group.scheduledDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {group.scheduledDate.toLocaleDateString()}
                  {group.timeSlot && ` (${group.timeSlot.displayLabel})`}
                </span>
              </div>
            )}
            {group.storeName && (
              <div className="flex items-center gap-1">
                <Store className="h-3 w-3" />
                <span>Store #{group.storeNumber} - {group.storeName}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <Collapsible open={isExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-2">
            {/* Items List */}
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium">Items ({items.length})</h4>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Drag items here to add them to this shipment
                </p>
              ) : (
                <div className="space-y-1">
                  {items.map((item) => (
                    <div
                      key={item.lineId}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.name}</span>
                        <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{formatCurrency(item.lineTotal)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onRemoveItem(item.lineId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Configuration Section */}
            {group.type !== 'IMMEDIATE' && needsConfiguration() && (
              <div className="border-t pt-4">
                {!isConfiguring ? (
                  <Button variant="outline" size="sm" onClick={() => setIsConfiguring(true)}>
                    Configure {FULFILLMENT_TYPE_LABELS[group.type]}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {(group.type === 'DELIVERY' || group.type === 'INSTALLATION') && (
                      <AddressSelector
                        customerId={null}
                        savedAddresses={[]}
                        selectedAddress={group.address || null}
                        onSelectAddress={handleAddressSelect}
                      />
                    )}

                    {(group.type === 'DELIVERY' || group.type === 'INSTALLATION' || group.type === 'PICKUP') && (
                      <TimeSlotSelector
                        fulfillmentType={group.type}
                        storeNumber={group.storeNumber || 1}
                        selectedDate={group.scheduledDate || null}
                        selectedSlot={group.timeSlot || null}
                        onDateChange={(date) => handleScheduleSelect(date)}
                        onSlotChange={(slot) => onUpdate({ timeSlot: slot })}
                      />
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsConfiguring(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cost */}
            {group.estimatedCost > 0 && (
              <div className="border-t pt-4 mt-4 flex justify-between text-sm">
                <span className="text-muted-foreground">Fulfillment Cost:</span>
                <span className="font-medium">{formatCurrency(group.estimatedCost)}</span>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
