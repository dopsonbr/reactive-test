# Validation

## Purpose
Validates incoming request parameters and headers to ensure they meet business constraints before processing.

## Behavior
ProductRequestValidator checks SKU and metadata headers; SearchRequestValidator validates search queries, price ranges, availability filters, zip codes, and selling locations. Returns validation errors as reactive Mono failures when constraints are violated.

## Quirks
- User ID accepts 1-50 alphanumeric chars (hyphens/underscores allowed) for service accounts
- Session ID can be UUID or kiosk-style identifier (e.g., KIOSK-001)
- Search query is optional (allows category browsing without text)
- All validation errors collected and returned together, not fail-fast
