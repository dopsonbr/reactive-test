# Domain

## Purpose
Defines the core business entities returned by the product lookup API.

## Behavior
Contains immutable records representing aggregated product data from multiple downstream services (merchandise, pricing, inventory).

## Quirks
- Price is stored as String, not BigDecimal
- SKU uses long, not String
