# graphql

## Boundaries
Files requiring careful review: `GraphQLInputValidator.java` (validation rules must stay synchronized with REST layer), `GraphQLExceptionResolver.java` (error mappings must align with Spring GraphQL conventions)

## Conventions
- All query/mutation methods return `Mono` or `Flux` for reactive composition
- Queries annotated with `@QueryMapping` and `@PreAuthorize("hasAuthority('SCOPE_order:read')")`
- Mutations annotated with `@MutationMapping` and `@PreAuthorize("hasAuthority('SCOPE_order:write')")`
- Validation uses non-fail-fast pattern: collect all errors in `List<ValidationError>` before throwing `ValidationException`
- Input records live in `input/` subpackage and provide default value methods where applicable
- 404 from service layer converts to `null` return (GraphQL standard), other errors map to appropriate `ErrorType`

## Warnings
- Validation logic duplicates rules from REST validators - keep synchronized
- GraphQL nullable handling differs from REST: missing entities return `null`, not 404 responses
- Exception resolver must handle both reactive exceptions and traditional exceptions
- Changes to `OrderStatus` enum or `FulfillmentDetails` structure require corresponding schema updates
