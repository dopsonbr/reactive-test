package org.example.order.graphql.input;

import org.example.order.model.OrderStatus;

/** GraphQL input for updating order status. */
public record UpdateStatusInput(OrderStatus status) {}
