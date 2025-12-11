// Fulfillment Types

export type FulfillmentType = 'IMMEDIATE' | 'PICKUP' | 'DELIVERY' | 'WILL_CALL' | 'INSTALLATION';

export interface TimeSlot {
  id: string;
  date: Date;
  startTime: string; // "09:00"
  endTime: string; // "12:00"
  displayLabel: string; // "9:00 AM - 12:00 PM"
  available: boolean;
  capacityRemaining: number;
  capacityTotal: number;
}

export interface Address {
  id?: string;
  type: 'SHIPPING' | 'BILLING' | 'BOTH';
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary?: boolean;
  isValidated?: boolean;
}

export interface FulfillmentGroup {
  id: string;
  type: FulfillmentType;
  itemIds: string[]; // Line item IDs
  scheduledDate?: Date;
  timeSlot?: TimeSlot;
  address?: Address;
  storeNumber?: number;
  storeName?: string;
  instructions?: string;
  estimatedCost: number;
  status: FulfillmentGroupStatus;
}

export type FulfillmentGroupStatus =
  | 'CONFIGURING'
  | 'READY'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'PICKED_UP'
  | 'CANCELLED';

export interface WillCallConfig {
  pickupWindowStart: Date;
  pickupWindowEnd: Date;
  contactPhone: string;
  pickupPersonName?: string;
  pickupPersonId?: string;
  holdExpirationDate: Date;
  specialInstructions?: string;
}

export interface DeliveryConfig {
  address: Address;
  scheduledDate: Date;
  timeSlot: TimeSlot;
  requiresSignature: boolean;
  leaveAtDoor: boolean;
  specialInstructions?: string;
}

export interface PickupConfig {
  storeNumber: number;
  storeName: string;
  storeAddress: Address;
  readyDate: Date;
  readyTime: string;
  pickupDeadline: Date;
  alternatePickupPerson?: string;
}

export interface InstallationConfig {
  address: Address;
  scheduledDate: Date;
  timeSlot: TimeSlot;
  installationType: string;
  requirements?: string[];
  estimatedDuration: string;
}

export interface FulfillmentCost {
  type: FulfillmentType;
  baseCost: number;
  additionalItemCost: number;
  totalCost: number;
  isFree: boolean;
  freeThreshold?: number;
}

// Available dates/slots response
export interface AvailableDates {
  type: FulfillmentType;
  storeNumber?: number;
  postalCode?: string;
  dates: AvailableDate[];
}

export interface AvailableDate {
  date: Date;
  available: boolean;
  reason?: string; // "Sold out", "Holiday", etc.
  slots: TimeSlot[];
}

// Fulfillment type configuration
export const FULFILLMENT_TYPE_LABELS: Record<FulfillmentType, string> = {
  IMMEDIATE: 'Take With',
  PICKUP: 'Store Pickup',
  DELIVERY: 'Delivery',
  WILL_CALL: 'Will Call',
  INSTALLATION: 'Installation',
};

export const FULFILLMENT_TYPE_ICONS: Record<FulfillmentType, string> = {
  IMMEDIATE: 'shopping-bag',
  PICKUP: 'store',
  DELIVERY: 'truck',
  WILL_CALL: 'clock',
  INSTALLATION: 'wrench',
};

export const FULFILLMENT_TYPE_DESCRIPTIONS: Record<FulfillmentType, string> = {
  IMMEDIATE: 'Customer takes items now',
  PICKUP: 'Ready for pickup at selected store',
  DELIVERY: 'Ship to customer address',
  WILL_CALL: 'Hold for customer pickup window',
  INSTALLATION: 'Professional installation included',
};
