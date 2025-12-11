package org.example.model.payment;

import java.math.BigDecimal;

/**
 * Card-present payment (swipe, dip, or tap).
 *
 * @param amount the payment amount
 * @param token the tokenized card data from the payment terminal
 * @param lastFour the last 4 digits of the card
 * @param brand the card brand (VISA, MASTERCARD, AMEX, etc.)
 * @param entryMode how the card was read (SWIPE, DIP, TAP)
 */
public record CardPayment(
    BigDecimal amount, String token, String lastFour, String brand, CardEntryMode entryMode)
    implements PaymentMethod {

  @Override
  public PaymentType type() {
    return PaymentType.CARD;
  }

  public enum CardEntryMode {
    SWIPE,
    DIP,
    TAP
  }
}
