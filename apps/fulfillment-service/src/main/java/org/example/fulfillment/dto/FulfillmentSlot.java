package org.example.fulfillment.dto;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Represents an available time slot for fulfillment scheduling.
 *
 * @param date the date of the slot
 * @param startTime the start time of the slot window
 * @param endTime the end time of the slot window
 * @param capacityRemaining how many more orders can be scheduled in this slot
 * @param isAvailable whether the slot is available for booking
 */
public record FulfillmentSlot(
    LocalDate date,
    LocalTime startTime,
    LocalTime endTime,
    int capacityRemaining,
    boolean isAvailable) {}
