package org.example.model.payment;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * B2B net terms payment (invoice billing).
 *
 * @param amount the invoice amount
 * @param customerId the B2B customer ID
 * @param terms the payment terms (NET_30, NET_60, NET_90)
 * @param purchaseOrderNumber the customer's PO number
 * @param dueDate the calculated due date based on terms
 */
public record NetTermsPayment(
    BigDecimal amount,
    String customerId,
    PaymentTerms terms,
    String purchaseOrderNumber,
    LocalDate dueDate)
    implements PaymentMethod {

  @Override
  public PaymentType type() {
    return PaymentType.NET_TERMS;
  }

  public enum PaymentTerms {
    NET_30(30),
    NET_60(60),
    NET_90(90);

    private final int days;

    PaymentTerms(int days) {
      this.days = days;
    }

    public int getDays() {
      return days;
    }

    public LocalDate calculateDueDate(LocalDate invoiceDate) {
      return invoiceDate.plusDays(days);
    }
  }
}
