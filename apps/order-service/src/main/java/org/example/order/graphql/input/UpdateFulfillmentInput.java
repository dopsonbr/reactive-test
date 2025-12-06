package org.example.order.graphql.input;

/** GraphQL input for updating fulfillment details. */
public record UpdateFulfillmentInput(
    String fulfillmentDate, String trackingNumber, String carrier, String instructions) {}
