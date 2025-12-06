# graphql

## Purpose
Provides GraphQL API access to order operations with OAuth2 security and reactive responses.

## Behavior
Exposes queries for reading orders (by ID, number, store, customer) and mutations for status updates, fulfillment tracking, cancellations, and notes. Queries require `order:read` scope, mutations require `order:write` scope. All operations return `Mono` or `Flux` for reactive composition. Input validation collects all errors before failing, providing complete feedback in a single response.

## Quirks
- Validation is non-fail-fast: `GraphQLInputValidator` accumulates all errors before returning `ValidationException`
- 404 responses from service layer convert to `null` in GraphQL (standard GraphQL pattern for missing entities)
- Exception resolution maps HTTP status codes and platform exceptions to GraphQL error types
- `addOrderNote` appends to fulfillment instructions rather than maintaining separate note history
