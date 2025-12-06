package org.example.model.discount;

/** Reasons for applying an employee markdown. */
public enum MarkdownReason {
  /** Competitor price match */
  PRICE_MATCH,
  /** Damaged/open box item */
  DAMAGED_ITEM,
  /** Customer satisfaction adjustment */
  CUSTOMER_SERVICE,
  /** Manager approved discount */
  MANAGER_DISCRETION,
  /** Loyalty tier exception */
  LOYALTY_EXCEPTION,
  /** Custom bundle pricing */
  BUNDLE_DEAL
}
