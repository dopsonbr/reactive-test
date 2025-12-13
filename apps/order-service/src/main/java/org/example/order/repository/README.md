# repository

## Purpose
Provides reactive data access to orders using R2DBC with PostgreSQL JSONB columns.

## Behavior
Queries, inserts, and updates orders in the `orderdb.orders` table using Spring Data R2DBC. Converts between domain models and database entities, serializing denormalized collections (line items, discounts, customer snapshot, fulfillment details) to JSONB. Supports flexible search by store, customer, status, and date range with pagination. Provides idempotent insert for event-driven order creation.

## Quirks
- Orders are inserted via event consumer from checkout-service `OrderCompleted` events
- Idempotent inserts use `INSERT ... ON CONFLICT DO NOTHING` to handle duplicate events
- JSONB columns require custom R2DBC converters (JsonValueToJsonConverter, JsonToJsonValueConverter)
- OrderEntity implements Persistable to control INSERT vs UPDATE when IDs are pre-assigned
- Entity-to-domain mapping uses ObjectMapper for JSON deserialization in blocking context
