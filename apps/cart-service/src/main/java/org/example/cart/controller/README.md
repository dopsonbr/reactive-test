# Controller

## Purpose
Exposes HTTP endpoints for shopping cart operations, organized by REST resource boundaries (cart lifecycle, customer carts, products, discounts, fulfillments).

## Behavior
Accepts REST requests with required metadata headers, validates inputs, delegates to service layer, and logs structured request/response data with trace correlation.

## Quirks
- All four metadata headers are required; missing headers result in 400 Bad Request
- Controllers are split by resource type to maintain clear REST boundaries
- Context is established at controller boundary for downstream propagation
