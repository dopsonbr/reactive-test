# controller

## Purpose

REST controllers for address validation, shipping options, and fulfillment operations.

## Behavior

Exposes endpoints for address validation, shipping method retrieval, fulfillment planning, cost calculation, and inventory reservation. Delegates to FulfillmentService for stub response generation.

## Quirks

- All responses are deterministic stubs for testing
- Address validation always succeeds
- Shipping options are fixed regardless of destination
