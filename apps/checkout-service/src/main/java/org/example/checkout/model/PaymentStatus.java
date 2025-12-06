package org.example.checkout.model;

/** Payment status for order. */
public enum PaymentStatus {
  /** Payment not yet attempted. */
  PENDING,

  /** Payment is being processed. */
  PROCESSING,

  /** Payment completed successfully. */
  COMPLETED,

  /** Payment failed. */
  FAILED,

  /** Payment was refunded. */
  REFUNDED
}
