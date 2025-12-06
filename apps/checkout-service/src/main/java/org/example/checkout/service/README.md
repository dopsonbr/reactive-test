# service

## Purpose

Business logic for checkout orchestration coordinating multiple external services.

## Behavior

CheckoutService implements two-phase checkout: initiate validates cart, calculates discounts, and creates fulfillment reservation; complete processes payment and persists order. Handles rollback of fulfillment reservation on payment failure.

## Quirks

- Checkout sessions are currently in-memory with expiration
- Payment failure triggers automatic fulfillment cancellation
- Order ID generated before payment to support idempotent retries
