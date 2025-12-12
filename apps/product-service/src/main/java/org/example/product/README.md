# org.example.product

## Purpose
Aggregates product data from merchandise, price, and inventory services into unified product representations for consumer applications.

## Behavior
Accepts REST requests for individual product lookups and product searches, validates inputs, orchestrates parallel service calls with resilience patterns, applies cache-aside strategies, and returns enriched product responses with OAuth2 security.

## Quirks
- All endpoints require OAuth2 JWT with `product:read` scope
- Search queries are optional (allows category browsing without text search)
- Actuator endpoints vary by profile (dev exposes all, prod restricts to health/metrics)
