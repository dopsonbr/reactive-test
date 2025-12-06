package org.example.model.discount;

/** Types of markdowns that employees can apply. */
public enum MarkdownType {
  /** Reduce by percentage */
  PERCENTAGE,
  /** Reduce by fixed dollar amount */
  FIXED_AMOUNT,
  /** Set specific price (admin only) */
  OVERRIDE_PRICE
}
