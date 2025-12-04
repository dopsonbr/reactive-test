# DTO

## Purpose
Defines request payloads for cart mutation operations exposed via REST API.

## Behavior
Contains immutable records representing inbound API requests for creating and modifying shopping carts, products, fulfillment options, discounts, and customer information.

## Quirks
- CreateCartRequest allows null customerId for anonymous carts
- SKU represented as long, not String
