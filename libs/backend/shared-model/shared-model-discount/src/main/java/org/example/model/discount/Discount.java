package org.example.model.discount;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Discount definition that can be applied to a cart.
 *
 * @param discountId the unique discount identifier
 * @param code the discount/promo code
 * @param type the type of discount
 * @param value the discount value (percentage or fixed amount)
 * @param description human-readable description of the discount
 * @param expiresAt when the discount expires
 * @param scope the scope of the discount (CART, ITEM, SHIPPING)
 * @param stackable whether this discount can combine with others
 * @param minimumPurchase minimum cart value to apply this discount
 * @param eligibleSkus list of eligible SKUs (empty = all SKUs)
 * @param eligibleStores list of eligible store numbers (empty = all stores)
 * @param autoApply whether to auto-apply without code entry
 */
public record Discount(
    String discountId,
    String code,
    DiscountType type,
    BigDecimal value,
    String description,
    Instant expiresAt,
    DiscountScope scope,
    boolean stackable,
    BigDecimal minimumPurchase,
    List<Long> eligibleSkus,
    List<Integer> eligibleStores,
    boolean autoApply) {

  public boolean isValid() {
    return expiresAt == null || expiresAt.isAfter(Instant.now());
  }

  public boolean appliesTo(int storeNumber) {
    return eligibleStores == null
        || eligibleStores.isEmpty()
        || eligibleStores.contains(storeNumber);
  }

  public boolean appliesToSku(long sku) {
    return eligibleSkus == null || eligibleSkus.isEmpty() || eligibleSkus.contains(sku);
  }
}
