package org.example.cart.model;

import java.math.BigDecimal;
import java.util.List;
import org.example.model.discount.AppliedDiscount;
import org.example.model.fulfillment.Fulfillment;
import org.example.model.product.CartProduct;

/**
 * Calculated totals for a cart.
 *
 * @param subtotal sum of product line totals
 * @param discountTotal sum of discount savings
 * @param fulfillmentTotal sum of fulfillment costs
 * @param taxTotal calculated tax (placeholder)
 * @param grandTotal final total
 */
public record CartTotals(
        BigDecimal subtotal,
        BigDecimal discountTotal,
        BigDecimal fulfillmentTotal,
        BigDecimal taxTotal,
        BigDecimal grandTotal) {
    /**
     * Calculate totals from cart components.
     *
     * @param products the products in the cart
     * @param discounts the applied discounts
     * @param fulfillments the fulfillment options
     * @return the calculated totals
     */
    public static CartTotals calculate(
            List<CartProduct> products,
            List<AppliedDiscount> discounts,
            List<Fulfillment> fulfillments) {

        // Calculate subtotal from products
        BigDecimal subtotal =
                products.stream()
                        .map(CartProduct::lineTotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate discount total
        BigDecimal discountTotal =
                discounts.stream()
                        .map(AppliedDiscount::appliedSavings)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate fulfillment total
        BigDecimal fulfillmentTotal =
                fulfillments.stream()
                        .map(Fulfillment::cost)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Tax calculation placeholder (0 for now)
        BigDecimal taxTotal = BigDecimal.ZERO;

        // Grand total = subtotal - discounts + fulfillment + tax
        BigDecimal grandTotal =
                subtotal.subtract(discountTotal).add(fulfillmentTotal).add(taxTotal);

        // Ensure grand total is not negative
        if (grandTotal.compareTo(BigDecimal.ZERO) < 0) {
            grandTotal = BigDecimal.ZERO;
        }

        return new CartTotals(subtotal, discountTotal, fulfillmentTotal, taxTotal, grandTotal);
    }

    /**
     * Create empty totals.
     *
     * @return totals with all zeros
     */
    public static CartTotals empty() {
        return new CartTotals(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO);
    }
}
