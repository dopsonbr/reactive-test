# service

## Purpose

Stub business logic for fulfillment operations.

## Behavior

FulfillmentService provides hardcoded responses for all fulfillment operations. Address validation always succeeds, shipping costs are fixed, and reservations are acknowledged without persistence.

## Quirks

- All responses are deterministic stubs
- No actual inventory tracking or warehouse integration
- Generated IDs are UUIDs for plan and reservation references
