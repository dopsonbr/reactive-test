package org.example.product.domain;

import java.util.List;

public record SearchResponse<T>(
    List<T> items,
    long totalItems,
    int totalPages,
    int currentPage,
    int pageSize,
    String query,
    long searchTimeMs) {
  public boolean hasNext() {
    return currentPage < totalPages - 1;
  }

  public boolean hasPrevious() {
    return currentPage > 0;
  }
}
