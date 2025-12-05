# GraphQL

## Boundaries
Files requiring careful review: CartSubscriptionController.java (Redis Pub/Sub integration)

## Conventions
- All controllers delegate validation to GraphQLInputValidator
- Security enforced via @PreAuthorize with SCOPE_cart:read or SCOPE_cart:write
- Subscriptions require cart:read, admin subscriptions require cart:admin
- Query/mutation operations mirror REST API behavior

## Warnings
- Subscription channel patterns must match CartEventPublisher patterns
- GraphQL error types must align with Spring GraphQL ErrorType enum
