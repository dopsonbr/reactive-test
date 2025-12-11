package org.example.fulfillment.dto;

import java.time.LocalDate;
import org.example.model.fulfillment.FulfillmentType;

/**
 * Request parameters for fetching available fulfillment slots.
 *
 * @param type the type of fulfillment (PICKUP, WILL_CALL, DELIVERY, INSTALLATION)
 * @param storeNumber the store number for pickup/will-call slots
 * @param startDate the start of the date range to search
 * @param endDate the end of the date range to search
 */
public record FulfillmentSlotsRequest(
    FulfillmentType type, int storeNumber, LocalDate startDate, LocalDate endDate) {}
