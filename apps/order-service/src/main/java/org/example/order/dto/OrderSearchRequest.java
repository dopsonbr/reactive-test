package org.example.order.dto;

import java.time.Instant;

/** Request DTO for order search. */
public record OrderSearchRequest(
    Integer storeNumber,
    String customerId,
    String status,
    Instant startDate,
    Instant endDate,
    Integer page,
    Integer size) {

  public int pageOrDefault() {
    return page != null && page >= 0 ? page : 0;
  }

  public int sizeOrDefault() {
    return size != null && size > 0 && size <= 100 ? size : 20;
  }

  public int offset() {
    return pageOrDefault() * sizeOrDefault();
  }
}
