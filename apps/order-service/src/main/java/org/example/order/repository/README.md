# repository

## Purpose
Provides reactive data access to orders using R2DBC with PostgreSQL JSONB columns.

## Behavior
Queries and updates orders from the shared `checkoutdb.orders` table using Spring Data R2DBC. Converts between domain models and database entities, serializing denormalized collections (line items, discounts, customer snapshot, fulfillment details) to JSONB. Supports flexible search by store, customer, status, and date range with pagination.

## Quirks
- Read/update only - order creation is handled by checkout-service
- JSONB columns require custom R2DBC converters (JsonValueToJsonConverter, JsonToJsonValueConverter)
- OrderEntity implements Persistable to control INSERT vs UPDATE when IDs are pre-assigned
- Entity-to-domain mapping uses ObjectMapper for JSON deserialization in blocking context
