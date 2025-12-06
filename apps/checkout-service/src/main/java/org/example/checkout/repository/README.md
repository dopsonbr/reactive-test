# repository

## Purpose

Persistence layer for orders using PostgreSQL with R2DBC reactive access.

## Behavior

OrderRepository interface defines domain operations; PostgresOrderRepository implements with R2DBC, mapping between Order domain model and OrderEntity database records. Uses JSONB columns for nested collections (line items, discounts, fulfillment).
