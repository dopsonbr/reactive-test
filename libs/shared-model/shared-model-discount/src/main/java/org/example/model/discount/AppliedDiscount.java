package org.example.model.discount;

import java.math.BigDecimal;
import java.util.List;

/**
 * Discount as applied to a cart with calculated savings.
 *
 * @param discountId the unique discount identifier
 * @param code the discount/promo code
 * @param type the type of discount
 * @param originalValue the original discount value (percentage or fixed amount)
 * @param appliedSavings the actual savings amount calculated for this cart
 * @param applicableSkus list of SKUs this discount applies to (empty = entire cart)
 */
public record AppliedDiscount(
        String discountId,
        String code,
        DiscountType type,
        BigDecimal originalValue,
        BigDecimal appliedSavings,
        List<Long> applicableSkus) {
    /**
     * Create an AppliedDiscount from a Discount with calculated savings.
     *
     * @param discount the source discount
     * @param appliedSavings the calculated savings for this cart
     * @param applicableSkus the SKUs this discount applies to
     * @return a new AppliedDiscount
     */
    public static AppliedDiscount fromDiscount(
            Discount discount, BigDecimal appliedSavings, List<Long> applicableSkus) {
        return new AppliedDiscount(
                discount.discountId(),
                discount.code(),
                discount.type(),
                discount.value(),
                appliedSavings,
                applicableSkus != null ? applicableSkus : List.of());
    }
}
