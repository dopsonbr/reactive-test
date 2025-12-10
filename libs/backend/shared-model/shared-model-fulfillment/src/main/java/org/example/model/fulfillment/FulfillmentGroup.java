package org.example.model.fulfillment;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Represents a group of items sharing the same fulfillment method in a multi-fulfillment order.
 *
 * @param id unique identifier for this fulfillment group
 * @param type the fulfillment type (DELIVERY, PICKUP, WILL_CALL, INSTALLATION)
 * @param scheduledDate the date for fulfillment
 * @param startTime the start of the time window (null for all-day)
 * @param endTime the end of the time window (null for all-day)
 * @param address the delivery/installation address (null for PICKUP/WILL_CALL)
 * @param storeNumber the store for PICKUP/WILL_CALL (null for DELIVERY)
 * @param skus the list of SKUs in this fulfillment group
 * @param instructions special instructions for this fulfillment
 */
public record FulfillmentGroup(
    String id,
    FulfillmentType type,
    LocalDate scheduledDate,
    LocalTime startTime,
    LocalTime endTime,
    Address address,
    Integer storeNumber,
    List<String> skus,
    String instructions) {

  /** Address for delivery/installation fulfillment. */
  public record Address(
      String line1, String line2, String city, String state, String postalCode, String country) {}
}
