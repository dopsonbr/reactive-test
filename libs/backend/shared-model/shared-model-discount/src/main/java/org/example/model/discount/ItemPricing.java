package org.example.model.discount;

import java.math.BigDecimal;
import java.util.List;

/**
 * Pricing breakdown for a single item in the cart.
 *
 * @param sku the product SKU
 * @param quantity the quantity of items
 * @param unitPrice the unit price before discounts
 * @param originalTotal the original total (unitPrice * quantity)
 * @param discountedTotal the total after discounts
 * @param itemSavings the amount saved on this item
 * @param appliedDiscountIds list of discount IDs applied to this item
 */
public record ItemPricing(
    Long sku,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal originalTotal,
    BigDecimal discountedTotal,
    BigDecimal itemSavings,
    List<String> appliedDiscountIds) {}
