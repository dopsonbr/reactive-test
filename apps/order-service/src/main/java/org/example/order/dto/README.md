# dto

## Purpose
Provides immutable DTOs for order search REST API endpoints.

## Behavior
Encapsulates search criteria (store, customer, status, date range, pagination) and paginated response (orders, count, hasMore flag). Request applies defaults: page 0, size 20 (max 100).

## Quirks
- Size capped at 100 per page
- Negative page numbers default to 0
- Invalid/missing pagination uses safe defaults
