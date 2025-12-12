# controller

## Purpose

REST controllers for address validation, shipping options, fulfillment operations, and time slot availability.

## Behavior

Exposes endpoints for address validation, shipping method retrieval, fulfillment planning, cost calculation, inventory reservation, and time slot queries. Delegates to FulfillmentService for stub response generation.

## Quirks

- All responses are deterministic stubs for testing
- Address validation always succeeds
- Shipping options are fixed regardless of destination
- Time slots are generated based on fulfillment type without real capacity checks
