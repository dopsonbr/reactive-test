package org.example.customer.controller.dto;

import java.util.List;
import org.example.model.customer.Customer;

/**
 * Paginated response for customer search results.
 *
 * @param customers the list of customers matching the search criteria
 * @param totalCount total number of matching customers
 * @param page the current page number (0-indexed)
 * @param pageSize the number of items per page
 * @param totalPages the total number of pages
 */
public record CustomerSearchResponse(
    List<Customer> customers, long totalCount, int page, int pageSize, int totalPages) {

  /**
   * Create a search response calculating total pages.
   *
   * @param customers the customers for this page
   * @param totalCount total matching customers
   * @param page current page
   * @param pageSize items per page
   * @return CustomerSearchResponse with calculated totalPages
   */
  public static CustomerSearchResponse of(
      List<Customer> customers, long totalCount, int page, int pageSize) {
    int totalPages = (int) Math.ceil((double) totalCount / pageSize);
    return new CustomerSearchResponse(customers, totalCount, page, pageSize, totalPages);
  }
}
