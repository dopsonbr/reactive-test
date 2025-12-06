package org.example.discount.controller.dto;

import java.util.List;

/**
 * Request to calculate best price for a cart.
 *
 * @param cartId the cart ID
 * @param customerId the customer ID (optional)
 * @param userId the user ID (optional)
 * @param storeNumber the store number
 * @param items the cart items
 * @param promoCodes promo codes to apply
 * @param shipping the shipping option
 */
public record PricingRequest(
    String cartId,
    String customerId,
    String userId,
    int storeNumber,
    List<CartItem> items,
    List<String> promoCodes,
    ShippingOption shipping) {}
