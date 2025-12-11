package org.example.model.payment;

import java.math.BigDecimal;
import java.util.List;

/**
 * Split payment across multiple payment methods.
 *
 * @param amount the total amount (sum of all payments)
 * @param payments the list of individual payment methods
 */
public record SplitPayment(BigDecimal amount, List<PaymentMethod> payments)
    implements PaymentMethod {

  @Override
  public PaymentType type() {
    return PaymentType.SPLIT;
  }

  /**
   * Validate that split payments sum to the total.
   *
   * @return true if payments sum correctly
   */
  public boolean isBalanced() {
    BigDecimal sum =
        payments.stream().map(PaymentMethod::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
    return sum.compareTo(amount) == 0;
  }
}
