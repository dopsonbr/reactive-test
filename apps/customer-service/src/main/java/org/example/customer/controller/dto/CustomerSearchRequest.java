package org.example.customer.controller.dto;

/**
 * Request parameters for customer search.
 *
 * @param customerId search by customer ID
 * @param email search by email
 * @param phone search by phone
 */
public record CustomerSearchRequest(String customerId, String email, String phone) {

    /**
     * Check if at least one search criterion is provided.
     *
     * @return true if any search criterion is set
     */
    public boolean hasSearchCriteria() {
        return customerId != null || email != null || phone != null;
    }

    /**
     * Get the first non-null search term for unified search.
     *
     * @return the first available search term
     */
    public String getSearchTerm() {
        if (customerId != null) return customerId;
        if (email != null) return email;
        return phone;
    }
}
