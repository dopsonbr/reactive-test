# controller

## Purpose

REST controllers for discount validation, employee markdown management, and comprehensive cart pricing.

## Behavior

Exposes three endpoint groups: DiscountController for promo code operations, MarkdownController for employee-only markdown authorization, and PricingController for best-price calculation. Returns Mono/Flux responses with structured error handling.

## Quirks

- DiscountController accepts storeNumber as query param (defaults to 1)
- MarkdownController requires x-userid header for all write operations
- PricingController handles complex multi-source data aggregation
