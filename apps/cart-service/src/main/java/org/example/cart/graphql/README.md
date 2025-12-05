# GraphQL

## Purpose
Exposes cart operations via GraphQL API with queries, mutations, and subscriptions.

## Behavior
Provides GraphQL endpoints with parity to REST API, supporting read queries, write mutations, and real-time subscriptions via SSE; delegates validation to GraphQLInputValidator and business logic to CartService.

## Quirks
- Subscriptions use SSE transport by default (no WebSocket configuration needed)
- Exception resolver maps service exceptions to GraphQL error types
- Method-level security via @PreAuthorize annotations
