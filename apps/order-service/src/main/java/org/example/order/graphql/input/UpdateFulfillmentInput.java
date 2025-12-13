package org.example.order.graphql.input;

/**
 * GraphQL input for updating fulfillment details.
 *
 * <p>Note: trackingNumber and carrier are not currently supported by the shared model. If tracking
 * functionality is needed, extend shared-model-order FulfillmentDetails first.
 */
public record UpdateFulfillmentInput(
    String fulfillmentDate, String pickupLocation, String instructions) {}
