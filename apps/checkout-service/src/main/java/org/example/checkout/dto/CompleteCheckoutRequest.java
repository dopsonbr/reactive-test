package org.example.checkout.dto;

/**
 * Request to complete checkout with payment.
 *
 * @param checkoutSessionId the checkout session ID from initiate
 * @param paymentMethod the payment method (e.g., CARD, CASH, STORE_CREDIT)
 * @param paymentDetails payment method-specific details
 */
public record CompleteCheckoutRequest(
    String checkoutSessionId,
    String paymentMethod,
    PaymentDetails paymentDetails) {

  /** Payment method-specific details. */
  public record PaymentDetails(
      String cardLast4,
      String cardBrand,
      String cardToken,
      String billingZip) {}
}
