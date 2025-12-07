package org.example.product.domain;

import java.util.List;

public record SearchResponse<T>(
    List<T> products,
    long total,
    int totalPages,
    int page,
    int pageSize,
    String query,
    long searchTimeMs) {
  public boolean hasNext() {
    return page < totalPages - 1;
  }

  public boolean hasPrevious() {
    return page > 0;
  }
}
