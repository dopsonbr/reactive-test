package org.example.model.discount;

/** Types of discounts that can be applied. */
public enum DiscountType {
  /** Percentage off the total (e.g., 10% off) */
  PERCENTAGE,
  /** Fixed amount off (e.g., $5 off) */
  FIXED_AMOUNT,
  /** Free shipping discount */
  FREE_SHIPPING,
  /** Buy X get Y promotional */
  BUY_X_GET_Y
}
