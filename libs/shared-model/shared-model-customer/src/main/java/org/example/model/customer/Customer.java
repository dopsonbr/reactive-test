package org.example.model.customer;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Core customer domain model supporting both D2C (Direct-to-Consumer) and B2B
 * (Business-to-Business) use cases.
 *
 * @param customerId unique customer identifier
 * @param storeNumber the store this customer belongs to
 * @param name the customer's name (person or business)
 * @param email the customer's email address
 * @param phone the customer's phone number
 * @param type whether this is a consumer or business customer
 * @param status the current account status
 * @param addresses list of customer addresses
 * @param wallet reference to external payment wallet
 * @param communicationPreferences customer's communication preferences
 * @param loyalty loyalty program information
 * @param b2bInfo B2B-specific information (null for D2C customers)
 * @param createdAt timestamp when customer was created
 * @param updatedAt timestamp when customer was last updated
 */
public record Customer(
    String customerId,
    int storeNumber,
    String name,
    String email,
    String phone,
    CustomerType type,
    CustomerStatus status,
    List<Address> addresses,
    WalletReference wallet,
    CommunicationPreferences communicationPreferences,
    LoyaltyInfo loyalty,
    B2BInfo b2bInfo,
    Instant createdAt,
    Instant updatedAt) {

  /**
   * Check if this is a B2B (business) customer.
   *
   * @return true if customer type is BUSINESS
   */
  public boolean isB2B() {
    return type == CustomerType.BUSINESS;
  }

  /**
   * Check if this is a D2C (consumer) customer.
   *
   * @return true if customer type is CONSUMER
   */
  public boolean isD2C() {
    return type == CustomerType.CONSUMER;
  }

  /**
   * Get the billing address if available.
   *
   * @return the billing address, or empty if not set
   */
  public Optional<Address> getBillingAddress() {
    if (addresses == null) {
      return Optional.empty();
    }
    return addresses.stream().filter(a -> a.type() == AddressType.BILLING).findFirst();
  }

  /**
   * Get the primary shipping address if available.
   *
   * @return the primary shipping address, or empty if not set
   */
  public Optional<Address> getShippingAddress() {
    if (addresses == null) {
      return Optional.empty();
    }
    return addresses.stream()
        .filter(a -> a.type() == AddressType.SHIPPING && a.isPrimary())
        .findFirst()
        .or(() -> addresses.stream().filter(a -> a.type() == AddressType.SHIPPING).findFirst());
  }

  /**
   * Check if the customer has a specific loyalty benefit.
   *
   * @param benefit the benefit type to check
   * @return true if the customer has the active benefit
   */
  public boolean hasLoyaltyBenefit(BenefitType benefit) {
    return loyalty != null && loyalty.hasBenefit(benefit);
  }

  /**
   * Create a new Customer with updated fields.
   *
   * @param name updated name
   * @param email updated email
   * @param phone updated phone
   * @param status updated status
   * @param addresses updated addresses
   * @param wallet updated wallet
   * @param communicationPreferences updated communication preferences
   * @param loyalty updated loyalty info
   * @param b2bInfo updated B2B info
   * @return a new Customer instance with updated fields
   */
  public Customer withUpdates(
      String name,
      String email,
      String phone,
      CustomerStatus status,
      List<Address> addresses,
      WalletReference wallet,
      CommunicationPreferences communicationPreferences,
      LoyaltyInfo loyalty,
      B2BInfo b2bInfo) {
    return new Customer(
        this.customerId,
        this.storeNumber,
        name != null ? name : this.name,
        email != null ? email : this.email,
        phone != null ? phone : this.phone,
        this.type,
        status != null ? status : this.status,
        addresses != null ? addresses : this.addresses,
        wallet != null ? wallet : this.wallet,
        communicationPreferences != null ? communicationPreferences : this.communicationPreferences,
        loyalty != null ? loyalty : this.loyalty,
        b2bInfo != null ? b2bInfo : this.b2bInfo,
        this.createdAt,
        Instant.now());
  }
}
