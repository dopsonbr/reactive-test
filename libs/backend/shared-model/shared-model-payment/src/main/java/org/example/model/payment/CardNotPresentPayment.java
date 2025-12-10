package org.example.model.payment;

import java.math.BigDecimal;

/**
 * Card-not-present payment for phone/mail orders or contact center transactions.
 *
 * @param amount the payment amount
 * @param token the tokenized card data
 * @param lastFour the last 4 digits of the card
 * @param brand the card brand
 * @param billingZip the billing ZIP code for verification
 * @param cvvProvided whether CVV was provided (for fraud scoring)
 */
public record CardNotPresentPayment(
    BigDecimal amount,
    String token,
    String lastFour,
    String brand,
    String billingZip,
    boolean cvvProvided)
    implements PaymentMethod {

  @Override
  public PaymentType type() {
    return PaymentType.CARD_NOT_PRESENT;
  }
}
