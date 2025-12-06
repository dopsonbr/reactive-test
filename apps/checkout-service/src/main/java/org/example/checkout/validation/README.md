# validation

## Purpose

Request validation for checkout operations with cart state verification.

## Behavior

CheckoutRequestValidator validates request fields including store number, UUIDs, and fulfillment-specific requirements. CartValidator verifies cart state is valid for checkout (has items, valid totals). Both aggregate all errors before throwing ValidationException.
