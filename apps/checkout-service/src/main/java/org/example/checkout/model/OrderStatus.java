package org.example.checkout.model;

/** Order status for checkout workflow. */
public enum OrderStatus {
  /** Order created but not yet paid. */
  CREATED,

  /** Payment is being processed. */
  PAYMENT_PENDING,

  /** Payment completed successfully. */
  PAID,

  /** Order is being fulfilled. */
  FULFILLING,

  /** Order has been completed and fulfilled. */
  COMPLETED,

  /** Order was cancelled. */
  CANCELLED,

  /** Order failed during processing. */
  FAILED
}
