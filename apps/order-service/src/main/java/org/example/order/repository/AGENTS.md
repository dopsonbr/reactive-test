# repository

## Boundaries
Files that require careful review before changes:
- `OrderEntity.java` - Shares schema with checkout-service
- `JsonValue.java` - Custom converter dependency in R2dbcConfiguration

## Conventions
- All repository methods return Mono/Flux for reactive access
- JSONB columns use JsonValue wrapper with custom R2DBC converters
- Entity-to-domain mapping uses ObjectMapper in Mono.fromCallable
- OrderEntity.existing() factory marks entities for UPDATE operations
- No INSERT operations - order-service is read/update only

## Warnings
- Never add insert/save methods - checkout-service owns order creation
- JSONB column changes require matching R2dbcConfiguration converters
- Schema changes must coordinate with checkout-service (shared table)
- ObjectMapper deserialization failures throw RuntimeException - consider error handling
