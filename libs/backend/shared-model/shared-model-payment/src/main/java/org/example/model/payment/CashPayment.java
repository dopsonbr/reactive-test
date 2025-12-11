package org.example.model.payment;

import java.math.BigDecimal;

/**
 * Cash payment with tendered amount and change calculation.
 *
 * @param amount the payment amount (actual amount applied to order)
 * @param amountTendered the amount of cash given by customer
 * @param changeDue the change to return to customer
 */
public record CashPayment(BigDecimal amount, BigDecimal amountTendered, BigDecimal changeDue)
    implements PaymentMethod {

  @Override
  public PaymentType type() {
    return PaymentType.CASH;
  }

  /**
   * Create a cash payment calculating change automatically.
   *
   * @param orderTotal the order total to pay
   * @param amountTendered the amount given by customer
   * @return CashPayment with calculated change
   */
  public static CashPayment of(BigDecimal orderTotal, BigDecimal amountTendered) {
    BigDecimal change = amountTendered.subtract(orderTotal).max(BigDecimal.ZERO);
    return new CashPayment(orderTotal, amountTendered, change);
  }
}
