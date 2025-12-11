package org.example.model.payment;

import java.math.BigDecimal;

/**
 * Gift card payment.
 *
 * @param amount the amount to charge to the gift card
 * @param cardNumber the gift card number (may be masked)
 * @param pin the gift card PIN if required
 * @param remainingBalance the balance remaining after this payment
 */
public record GiftCardPayment(
    BigDecimal amount, String cardNumber, String pin, BigDecimal remainingBalance)
    implements PaymentMethod {

  @Override
  public PaymentType type() {
    return PaymentType.GIFT_CARD;
  }
}
