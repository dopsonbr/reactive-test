package org.example.order.dto;

import java.util.List;
import org.example.order.model.Order;

/** Response DTO for order search with pagination info. */
public record OrderSearchResponse(
    List<Order> orders, long totalCount, int page, int size, boolean hasMore) {

  public static OrderSearchResponse of(List<Order> orders, long totalCount, int page, int size) {
    boolean hasMore = (long) (page + 1) * size < totalCount;
    return new OrderSearchResponse(orders, totalCount, page, size, hasMore);
  }
}
