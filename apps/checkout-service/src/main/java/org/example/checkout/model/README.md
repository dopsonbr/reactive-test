# model

## Purpose

Domain models representing orders, line items, fulfillment, and payment state.

## Behavior

Provides immutable records and enums for order lifecycle. Order aggregates line items, discounts, fulfillment details, and customer snapshot. Enums define valid states for order status, payment status, and fulfillment type.

## Quirks

- CustomerSnapshot captures customer state at checkout time, not live reference
- FulfillmentDetails includes reservation ID for rollback scenarios
