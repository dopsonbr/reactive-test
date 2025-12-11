package org.example.model.payment;

import java.math.BigDecimal;

/**
 * Payment using a saved payment method from customer's wallet.
 *
 * @param amount the payment amount
 * @param customerId the customer ID
 * @param walletCardId the ID of the saved card in the wallet
 * @param lastFour the last 4 digits of the saved card
 * @param brand the card brand
 */
public record WalletPayment(
    BigDecimal amount, String customerId, String walletCardId, String lastFour, String brand)
    implements PaymentMethod {

  @Override
  public PaymentType type() {
    return PaymentType.WALLET;
  }
}
