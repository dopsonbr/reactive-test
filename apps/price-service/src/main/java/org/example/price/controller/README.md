# org.example.price.controller

## Purpose
Exposes reactive REST API for price retrieval and management.

## Behavior
Handles GET requests for single prices or paginated lists, and PUT requests for price updates. Returns appropriate HTTP status codes including 404 for missing prices.

## Quirks
- PUT endpoint requires PRICING_SPECIALIST role (enforced by platform-security)
- List endpoint defaults to page 0, size 20
