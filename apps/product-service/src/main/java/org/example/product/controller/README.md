# Controller

## Purpose
Exposes HTTP endpoints for product retrieval, validating request headers and establishing Reactor Context for downstream propagation.

## Behavior
Accepts GET requests with required metadata headers, delegates to service layer, and logs structured request/response data with trace correlation.

## Quirks
- All four metadata headers are required; missing headers result in 400 Bad Request
- Context is established at controller boundary, not extracted from incoming trace headers
- ProductSearchController validates query parameters (zip code format, price range, selling location)
