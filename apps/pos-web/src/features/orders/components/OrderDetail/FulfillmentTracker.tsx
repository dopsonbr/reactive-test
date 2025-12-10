import {
  Package,
  Truck,
  Store,
  Clock,
  CheckCircle,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import type { OrderFulfillmentGroup, ShipmentStatus } from '../../types/order';
import { SHIPMENT_STATUS_CONFIG } from '../../types/order';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
  Button,
  cn,
} from '@reactive-platform/shared-ui-components';

interface FulfillmentTrackerProps {
  fulfillmentGroup: OrderFulfillmentGroup;
  itemNames: string[];
}

const STATUS_ORDER: ShipmentStatus[] = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  IMMEDIATE: <Package className="h-5 w-5" />,
  PICKUP: <Store className="h-5 w-5" />,
  DELIVERY: <Truck className="h-5 w-5" />,
  WILL_CALL: <Clock className="h-5 w-5" />,
  INSTALLATION: <Package className="h-5 w-5" />,
};

const TYPE_LABELS: Record<string, string> = {
  IMMEDIATE: 'Take With',
  PICKUP: 'Store Pickup',
  DELIVERY: 'Delivery',
  WILL_CALL: 'Will Call',
  INSTALLATION: 'Installation',
};

export function FulfillmentTracker({ fulfillmentGroup, itemNames }: FulfillmentTrackerProps) {
  const statusConfig = SHIPMENT_STATUS_CONFIG[fulfillmentGroup.status];
  const statusIndex = STATUS_ORDER.indexOf(fulfillmentGroup.status);
  const progressPercent = fulfillmentGroup.status === 'EXCEPTION'
    ? 0
    : ((statusIndex + 1) / STATUS_ORDER.length) * 100;

  const formatDate = (date?: Date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {TYPE_ICONS[fulfillmentGroup.type]}
            <span>{TYPE_LABELS[fulfillmentGroup.type]}</span>
          </div>
          <Badge className={cn(statusConfig.color, 'text-white')}>
            {statusConfig.label}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {fulfillmentGroup.status !== 'EXCEPTION' && (
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Ordered</span>
              <span>{fulfillmentGroup.status === 'DELIVERED' ? 'Delivered' : 'In Progress'}</span>
            </div>
          </div>
        )}

        {/* Tracking Info */}
        {fulfillmentGroup.trackingNumber && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">Tracking Number</p>
              <p className="font-mono text-sm">{fulfillmentGroup.trackingNumber}</p>
              {fulfillmentGroup.carrier && (
                <p className="text-xs text-muted-foreground">{fulfillmentGroup.carrier}</p>
              )}
            </div>
            {fulfillmentGroup.trackingUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={fulfillmentGroup.trackingUrl} target="_blank" rel="noopener noreferrer">
                  Track
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Address */}
        {fulfillmentGroup.address && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
            <div className="text-sm">
              <p>{fulfillmentGroup.address.name}</p>
              <p className="text-muted-foreground">
                {fulfillmentGroup.address.line1}
                {fulfillmentGroup.address.line2 && `, ${fulfillmentGroup.address.line2}`}
              </p>
              <p className="text-muted-foreground">
                {fulfillmentGroup.address.city}, {fulfillmentGroup.address.state} {fulfillmentGroup.address.postalCode}
              </p>
            </div>
          </div>
        )}

        {/* Store Info */}
        {fulfillmentGroup.storeNumber && (
          <div className="flex items-start gap-2">
            <Store className="h-4 w-4 mt-1 text-muted-foreground" />
            <div className="text-sm">
              <p>Store #{fulfillmentGroup.storeNumber}</p>
              {fulfillmentGroup.storeName && (
                <p className="text-muted-foreground">{fulfillmentGroup.storeName}</p>
              )}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex gap-4 text-sm">
          {fulfillmentGroup.estimatedDelivery && !fulfillmentGroup.actualDelivery && (
            <div>
              <p className="text-muted-foreground">Estimated</p>
              <p className="font-medium">{formatDate(fulfillmentGroup.estimatedDelivery)}</p>
            </div>
          )}
          {fulfillmentGroup.actualDelivery && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <div>
                <p className="font-medium">Delivered</p>
                <p className="text-sm">{formatDate(fulfillmentGroup.actualDelivery)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Items ({itemNames.length})</p>
          <ul className="text-sm text-muted-foreground">
            {itemNames.map((name, index) => (
              <li key={index}>{name}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
