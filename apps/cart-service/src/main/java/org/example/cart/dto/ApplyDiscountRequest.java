package org.example.cart.dto;

/**
 * Request to apply a discount to the cart.
 *
 * @param code the discount/promo code
 */
public record ApplyDiscountRequest(String code) {}
