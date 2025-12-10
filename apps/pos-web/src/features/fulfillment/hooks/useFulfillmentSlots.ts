import { useQuery } from '@tanstack/react-query';
import type { FulfillmentType, AvailableDates, TimeSlot } from '../types/fulfillment';

interface UseFulfillmentSlotsOptions {
  type: FulfillmentType;
  storeNumber?: number;
  postalCode?: string;
  startDate?: Date;
  endDate?: Date;
}

// Mock data for available dates
function generateMockSlots(date: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const baseDate = new Date(date);

  const slotDefinitions = [
    { start: '09:00', end: '12:00', label: '9:00 AM - 12:00 PM' },
    { start: '12:00', end: '15:00', label: '12:00 PM - 3:00 PM' },
    { start: '15:00', end: '18:00', label: '3:00 PM - 6:00 PM' },
    { start: '18:00', end: '21:00', label: '6:00 PM - 9:00 PM' },
  ];

  slotDefinitions.forEach((def, index) => {
    const capacity = Math.floor(Math.random() * 10) + 1;
    slots.push({
      id: `slot-${baseDate.toISOString()}-${index}`,
      date: baseDate,
      startTime: def.start,
      endTime: def.end,
      displayLabel: def.label,
      available: capacity > 0,
      capacityRemaining: capacity,
      capacityTotal: 10,
    });
  });

  return slots;
}

async function fetchFulfillmentSlots(options: UseFulfillmentSlotsOptions): Promise<AvailableDates> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const start = options.startDate || new Date();
  const end = options.endDate || new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

  const dates: AvailableDates['dates'] = [];
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isPast = currentDate < new Date();

    dates.push({
      date: new Date(currentDate),
      available: !isPast && (!isWeekend || options.type !== 'INSTALLATION'),
      reason: isPast ? 'Past date' : isWeekend && options.type === 'INSTALLATION' ? 'No weekend installation' : undefined,
      slots: isPast ? [] : generateMockSlots(currentDate),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    type: options.type,
    storeNumber: options.storeNumber,
    postalCode: options.postalCode,
    dates,
  };
}

export function useFulfillmentSlots(options: UseFulfillmentSlotsOptions) {
  const { type, storeNumber, postalCode, startDate, endDate } = options;

  return useQuery({
    queryKey: ['fulfillment-slots', type, storeNumber, postalCode, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => fetchFulfillmentSlots(options),
    enabled: !!type,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
