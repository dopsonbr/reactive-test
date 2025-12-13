package org.example.order.graphql.input;

import org.example.model.order.OrderStatus;

/** GraphQL input for order search. */
public record OrderSearchInput(
    int storeNumber,
    String customerId,
    OrderStatus status,
    String startDate,
    String endDate,
    Integer limit,
    Integer offset) {

  public int limitOrDefault() {
    return limit != null && limit > 0 && limit <= 100 ? limit : 50;
  }

  public int offsetOrDefault() {
    return offset != null && offset >= 0 ? offset : 0;
  }
}
