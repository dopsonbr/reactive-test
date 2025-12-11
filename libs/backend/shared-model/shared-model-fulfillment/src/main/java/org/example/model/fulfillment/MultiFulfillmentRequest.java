package org.example.model.fulfillment;

import java.util.List;

/**
 * Request for creating a multi-fulfillment order with items split across different fulfillment
 * methods.
 *
 * @param cartId the cart ID being fulfilled
 * @param customerId the customer ID (optional for guest checkout)
 * @param groups the list of fulfillment groups, each with their own fulfillment method
 */
public record MultiFulfillmentRequest(
    String cartId, String customerId, List<FulfillmentGroup> groups) {}
