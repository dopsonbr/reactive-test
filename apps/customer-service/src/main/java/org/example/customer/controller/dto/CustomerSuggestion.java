package org.example.customer.controller.dto;

import org.example.model.customer.AccountTier;
import org.example.model.customer.Customer;
import org.example.model.customer.CustomerType;
import org.example.model.customer.LoyaltyTier;

/**
 * Lightweight customer suggestion for autocomplete.
 *
 * @param customerId the customer ID
 * @param name the customer name
 * @param email the customer email
 * @param phone the customer phone
 * @param type the customer type (CONSUMER or BUSINESS)
 * @param loyaltyTier the loyalty tier (for CONSUMER customers)
 * @param accountTier the account tier (for BUSINESS customers)
 */
public record CustomerSuggestion(
    String customerId,
    String name,
    String email,
    String phone,
    CustomerType type,
    LoyaltyTier loyaltyTier,
    AccountTier accountTier) {

  /**
   * Create a suggestion from a full Customer object.
   *
   * @param customer the customer
   * @return CustomerSuggestion
   */
  public static CustomerSuggestion fromCustomer(Customer customer) {
    LoyaltyTier loyaltyTier = customer.loyalty() != null ? customer.loyalty().tier() : null;
    AccountTier accountTier = customer.b2bInfo() != null ? customer.b2bInfo().accountTier() : null;

    return new CustomerSuggestion(
        customer.customerId(),
        customer.name(),
        customer.email(),
        customer.phone(),
        customer.type(),
        loyaltyTier,
        accountTier);
  }
}
