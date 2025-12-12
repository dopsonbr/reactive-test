package org.example.checkout.model;

/** Status of a checkout transaction. */
public enum CheckoutTransactionStatus {
  INITIATED,
  PAYMENT_PROCESSING,
  COMPLETED,
  FAILED,
  RETRY_PENDING;

  public boolean isTerminal() {
    return this == COMPLETED || this == FAILED;
  }
}
