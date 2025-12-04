# Validation

## Purpose
Validates incoming cart service requests to ensure data integrity and prevent invalid state before business logic executes.

## Behavior
Collects all validation errors before returning, allowing clients to fix multiple issues in a single iteration. Validates request bodies, path parameters, and required headers against business constraints (store number range, SKU format, quantity limits, UUID format).

## Quirks
- Returns all validation errors at once, not fail-fast
- Validates both DTO fields and HTTP headers together
- Enforces store number range 1-2000 and SKU range 100000-999999999999
