package org.example.model.customer;

/** Types of loyalty benefits available to customers. */
public enum BenefitType {
  // Discounts
  PERCENTAGE_DISCOUNT,
  FIXED_DISCOUNT,

  // Shipping
  FREE_SHIPPING,
  EXPEDITED_SHIPPING,

  // Points
  POINTS_MULTIPLIER,
  BONUS_POINTS,

  // Access
  EARLY_ACCESS,
  EXCLUSIVE_PRODUCTS,
  PRIORITY_SUPPORT,

  // Special
  FREE_GIFT,
  FREE_RETURNS,
  BIRTHDAY_REWARD,
  ANNIVERSARY_REWARD
}
