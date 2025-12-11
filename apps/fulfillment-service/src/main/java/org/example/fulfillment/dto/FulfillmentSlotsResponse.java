package org.example.fulfillment.dto;

import java.util.List;
import org.example.model.fulfillment.FulfillmentType;

/**
 * Response containing available fulfillment slots.
 *
 * @param type the fulfillment type these slots are for
 * @param storeNumber the store number (for PICKUP/WILL_CALL)
 * @param slots the list of available time slots
 */
public record FulfillmentSlotsResponse(
    FulfillmentType type, int storeNumber, List<FulfillmentSlot> slots) {}
