package org.example.customer.controller.dto;

import org.example.model.customer.CustomerStatus;
import org.example.model.customer.CustomerType;
import org.example.model.customer.LoyaltyTier;

/**
 * Advanced search request with filtering, pagination, and sorting.
 *
 * @param q full-text search query
 * @param email exact email match
 * @param phone exact phone match
 * @param type filter by customer type (CONSUMER, BUSINESS)
 * @param loyaltyTier filter by loyalty tier
 * @param status filter by status
 * @param page page number (0-indexed)
 * @param pageSize items per page (default 20, max 100)
 * @param sortBy field to sort by
 * @param sortDirection ASC or DESC
 */
public record AdvancedSearchRequest(
    String q,
    String email,
    String phone,
    CustomerType type,
    LoyaltyTier loyaltyTier,
    CustomerStatus status,
    Integer page,
    Integer pageSize,
    String sortBy,
    String sortDirection) {

  public int getPage() {
    return page != null ? page : 0;
  }

  public int getPageSize() {
    int size = pageSize != null ? pageSize : 20;
    return Math.min(size, 100); // Cap at 100
  }

  public String getSortBy() {
    return sortBy != null ? sortBy : "name";
  }

  public String getSortDirection() {
    return sortDirection != null ? sortDirection : "ASC";
  }
}
