import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { FulfillmentType, TimeSlot } from '../../types/fulfillment';
import { useFulfillmentSlots } from '../../hooks/useFulfillmentSlots';
import {
  Button,
  Label,
  cn,
} from '@reactive-platform/shared-ui-components';

interface TimeSlotSelectorProps {
  fulfillmentType: FulfillmentType;
  storeNumber: number;
  selectedDate: Date | null;
  selectedSlot: TimeSlot | null;
  onDateChange: (date: Date) => void;
  onSlotChange: (slot: TimeSlot) => void;
}

export function TimeSlotSelector({
  fulfillmentType,
  storeNumber,
  selectedDate,
  selectedSlot,
  onDateChange,
  onSlotChange,
}: TimeSlotSelectorProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const startDate = useMemo(() => {
    const date = new Date(currentMonth);
    date.setDate(1);
    return date;
  }, [currentMonth]);

  const endDate = useMemo(() => {
    const date = new Date(currentMonth);
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    return date;
  }, [currentMonth]);

  const { data: availableDates, isLoading } = useFulfillmentSlots({
    type: fulfillmentType,
    storeNumber,
    startDate,
    endDate,
  });

  const daysInMonth = useMemo(() => {
    const days: Date[] = [];
    const date = new Date(startDate);
    while (date <= endDate) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [startDate, endDate]);

  const getDateAvailability = (date: Date) => {
    return availableDates?.dates.find(
      (d) => d.date.toDateString() === date.toDateString()
    );
  };

  const selectedDateSlots = useMemo(() => {
    if (!selectedDate || !availableDates) return [];
    const dateInfo = getDateAvailability(selectedDate);
    return dateInfo?.slots ?? [];
  }, [selectedDate, availableDates]);

  const prevMonth = () => {
    setCurrentMonth((prev) => {
      const date = new Date(prev);
      date.setMonth(date.getMonth() - 1);
      return date;
    });
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      const date = new Date(prev);
      date.setMonth(date.getMonth() + 1);
      return date;
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Get the first day of week offset
  const firstDayOffset = startDate.getDay();

  return (
    <div className="space-y-4">
      <Label>Select Date & Time</Label>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="sm" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">{formatMonthYear(currentMonth)}</span>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}

        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Calendar days */}
        {daysInMonth.map((date) => {
          const availability = getDateAvailability(date);
          const isAvailable = availability?.available ?? false;
          const isSelected = selectedDate?.toDateString() === date.toDateString();
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <button
              key={date.toISOString()}
              onClick={() => isAvailable && onDateChange(date)}
              disabled={!isAvailable || isLoading}
              className={cn(
                'p-2 text-sm rounded-md transition-colors',
                isAvailable ? 'hover:bg-accent cursor-pointer' : 'text-muted-foreground/50 cursor-not-allowed',
                isSelected && 'bg-primary text-primary-foreground',
                isToday && !isSelected && 'ring-1 ring-primary'
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="space-y-2 pt-4 border-t">
          <Label>Available Time Slots</Label>
          {selectedDateSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No time slots available</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {selectedDateSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => slot.available && onSlotChange(slot)}
                  disabled={!slot.available}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-md border transition-colors text-left',
                    slot.available ? 'hover:border-primary cursor-pointer' : 'opacity-50 cursor-not-allowed',
                    selectedSlot?.id === slot.id && 'border-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{slot.displayLabel}</span>
                  </div>
                  {slot.available && (
                    <span className="text-xs text-muted-foreground">
                      {slot.capacityRemaining} left
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
