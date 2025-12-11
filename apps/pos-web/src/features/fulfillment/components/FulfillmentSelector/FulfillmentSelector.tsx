import { useState, useCallback } from 'react';
import { Plus, Package, Truck, Store, Clock, Wrench, ShoppingBag } from 'lucide-react';
import type { FulfillmentGroup, FulfillmentType } from '../../types/fulfillment';
import { FULFILLMENT_TYPE_LABELS } from '../../types/fulfillment';
import type { LineItem } from '../../../transaction/types/transaction';
import { FulfillmentGroupCard } from './FulfillmentGroupCard';
import {
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Alert,
  AlertDescription,
  cn,
} from '@reactive-platform/shared-ui-components';

interface FulfillmentSelectorProps {
  items: LineItem[];
  groups: FulfillmentGroup[];
  unassignedItems: LineItem[];
  availableTypes: FulfillmentType[];
  onCreateGroup: (type: FulfillmentType) => void;
  onRemoveGroup: (groupId: string) => void;
  onUpdateGroup: (groupId: string, updates: Partial<FulfillmentGroup>) => void;
  onAddItemToGroup: (groupId: string, itemId: string) => void;
  onRemoveItemFromGroup: (groupId: string, itemId: string) => void;
  onAutoAssignImmediate: () => void;
}

const typeIcons: Record<FulfillmentType, React.ReactNode> = {
  IMMEDIATE: <ShoppingBag className="h-4 w-4" />,
  PICKUP: <Store className="h-4 w-4" />,
  DELIVERY: <Truck className="h-4 w-4" />,
  WILL_CALL: <Clock className="h-4 w-4" />,
  INSTALLATION: <Wrench className="h-4 w-4" />,
};

export function FulfillmentSelector({
  items,
  groups,
  unassignedItems,
  availableTypes,
  onCreateGroup,
  onRemoveGroup,
  onUpdateGroup,
  onAddItemToGroup,
  onRemoveItemFromGroup,
  onAutoAssignImmediate,
}: FulfillmentSelectorProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const handleDragStart = useCallback((itemId: string) => {
    setDraggedItemId(itemId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null);
  }, []);

  const handleDropOnGroup = useCallback(
    (groupId: string) => {
      if (draggedItemId) {
        onAddItemToGroup(groupId, draggedItemId);
        setDraggedItemId(null);
      }
    },
    [draggedItemId, onAddItemToGroup]
  );

  const getItemById = useCallback(
    (itemId: string) => items.find((item) => item.lineId === itemId),
    [items]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Fulfillment Configuration</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Shipment
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableTypes.map((type) => (
              <DropdownMenuItem key={type} onClick={() => onCreateGroup(type)}>
                <span className="mr-2">{typeIcons[type]}</span>
                {FULFILLMENT_TYPE_LABELS[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Unassigned Items Warning */}
      {unassignedItems.length > 0 && (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {unassignedItems.length} item{unassignedItems.length !== 1 ? 's' : ''} not assigned to a shipment
            </span>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={onAutoAssignImmediate}>
              Take All Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Unassigned Items Pool */}
      {unassignedItems.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Unassigned Items</h4>
            <div className="space-y-2">
              {unassignedItems.map((item) => (
                <div
                  key={item.lineId}
                  draggable
                  onDragStart={() => handleDragStart(item.lineId)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'flex items-center justify-between p-2 rounded border bg-background cursor-move',
                    'hover:border-primary transition-colors',
                    draggedItemId === item.lineId && 'opacity-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{item.name}</span>
                    <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fulfillment Groups */}
      {groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No fulfillment groups created</p>
            <Button variant="outline" onClick={() => onCreateGroup('IMMEDIATE')}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Take All Items Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group, index) => (
            <FulfillmentGroupCard
              key={group.id}
              group={group}
              groupIndex={index + 1}
              items={group.itemIds.map(getItemById).filter(Boolean) as LineItem[]}
              isDragTarget={draggedItemId !== null}
              onRemove={() => onRemoveGroup(group.id)}
              onUpdate={(updates) => onUpdateGroup(group.id, updates)}
              onRemoveItem={(itemId) => onRemoveItemFromGroup(group.id, itemId)}
              onDrop={() => handleDropOnGroup(group.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
