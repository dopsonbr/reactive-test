# Inventory Service

## Purpose
Manages stock availability data for SKUs across all locations.

## Behavior
Provides reactive endpoints for checking inventory levels, listing low-stock items, and updating quantities. Service-to-service calls return minimal response data, while merchant portal calls return full entity details.

## Quirks
- Uses R2dbcEntityTemplate.insert() for new records to avoid R2DBC treating non-null IDs as updates
- Flyway runs against blocking JDBC while service uses R2DBC for reactive queries
