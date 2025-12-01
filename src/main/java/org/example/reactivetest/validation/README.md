# Validation

## Purpose
Validates incoming request parameters and headers to ensure they meet business constraints before processing.

## Behavior
Accepts SKU path parameters and request headers (store number, order number, user ID, session ID), applies format and range checks, and returns validation errors as a reactive Mono that fails if constraints are violated.

## Quirks
- SKU must be 6-12 digits (100,000 to 999,999,999,999)
- Store number restricted to 1-2000 range
- Order number and session ID must be valid UUIDs
- User ID must be exactly 6 alphanumeric characters
- All validation errors are collected and returned together, not fail-fast
