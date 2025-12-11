package org.example.model.payment;

import java.math.BigDecimal;

/**
 * Sealed interface for polymorphic payment method handling. Each payment type has its own record
 * implementation with type-specific fields.
 */
public sealed interface PaymentMethod
    permits CardPayment,
        CardNotPresentPayment,
        CashPayment,
        GiftCardPayment,
        WalletPayment,
        NetTermsPayment,
        SplitPayment {

  /** The amount for this payment */
  BigDecimal amount();

  /** The payment type discriminator */
  PaymentType type();
}
