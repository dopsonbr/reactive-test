# service

## Purpose

Business logic for discount validation, markdown authorization, and comprehensive cart pricing.

## Behavior

DiscountService validates promo codes and retrieves active discounts. MarkdownService authorizes and manages employee markdowns with 4-hour expiration. PricingService orchestrates multi-source pricing calculation with optimal discount stacking.

## Quirks

- Stackable discounts sum; non-stackable uses best single; never both
- Loyalty tier discounts apply before promo codes
- Markdowns expire 4 hours after appliedAt timestamp
