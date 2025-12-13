package org.example.order.graphql.input;

import org.example.model.order.OrderStatus;

/** GraphQL input for updating order status. */
public record UpdateStatusInput(OrderStatus status) {}
