# controller

## Purpose

REST controller for checkout operations and order retrieval.

## Behavior

Exposes endpoints for two-phase checkout (initiate and complete) and order queries. Validates requests, establishes Reactor Context with request metadata, and delegates to CheckoutService for business logic.

## Quirks

- Initiate returns a checkout session ID that must be passed to complete
- Complete endpoint processes payment and may fail with partial state requiring rollback
