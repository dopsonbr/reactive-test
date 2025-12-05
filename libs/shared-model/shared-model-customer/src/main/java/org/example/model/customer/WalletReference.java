package org.example.model.customer;

/**
 * Reference to an external payment wallet.
 *
 * @param walletId the external wallet identifier
 * @param walletProvider the wallet provider (e.g., "STRIPE", "PAYPAL", "INTERNAL")
 * @param status the current status of the wallet
 */
public record WalletReference(String walletId, String walletProvider, WalletStatus status) {}
