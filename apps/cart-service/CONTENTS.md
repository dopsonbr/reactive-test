# Cart Service Contents

## Main Source (src/main/java/org/example/cart/)

### Application Entry
- `CartServiceApplication.java` - Spring Boot application entry point

### REST Controller Layer
- `controller/CartController.java` - Cart lifecycle endpoints (create, get, delete)
- `controller/CartProductController.java` - Product management endpoints
- `controller/CartDiscountController.java` - Discount management endpoints
- `controller/CartFulfillmentController.java` - Fulfillment management endpoints
- `controller/CartCustomerController.java` - Customer cart lookup endpoints

### GraphQL Layer
- `graphql/CartQueryController.java` - GraphQL queries (cart, cartsByStore, cartsByCustomer, etc.)
- `graphql/CartMutationController.java` - GraphQL mutations (createCart, addProduct, applyDiscount, etc.)
- `graphql/CartSubscriptionController.java` - Real-time subscriptions via SSE + Redis Pub/Sub
- `graphql/GraphQLExceptionResolver.java` - Error handling for GraphQL operations
- `graphql/input/*.java` - GraphQL input types (CreateCartInput, AddProductInput, etc.)
- `graphql/validation/GraphQLInputValidator.java` - Input validation with error aggregation

### Event Infrastructure (Redis Pub/Sub)
- `event/CartEvent.java` - Cart event model for subscriptions
- `event/CartEventType.java` - Event type enum (CART_CREATED, PRODUCT_ADDED, etc.)
- `pubsub/CartEventPublisher.java` - Publishes events to Redis Pub/Sub
- `pubsub/CartEventSubscriber.java` - Subscribes to cart event channels

### Service Layer
- `service/CartService.java` - Business logic with PostgreSQL persistence and event publishing

### Repository Layer
- `repository/CartRepository.java` - Repository interface
- `repository/PostgresCartRepository.java` - PostgreSQL implementation with JSONB handling
- `repository/CartEntity.java` - Database entity implementing Persistable<UUID>
- `repository/CartEntityRepository.java` - Spring Data R2DBC repository
- `repository/JsonValue.java` - Wrapper type for JSONB column conversion

### Model Layer
- `model/Cart.java` - Cart domain record with nested collections
- `model/CartTotals.java` - Calculated totals record

### DTO Layer
- `dto/CreateCartRequest.java` - REST create cart request
- `dto/AddProductRequest.java` - REST add product request
- `dto/UpdateProductRequest.java` - REST update product request
- `dto/ApplyDiscountRequest.java` - REST apply discount request
- `dto/AddFulfillmentRequest.java` - REST add fulfillment request
- `dto/UpdateFulfillmentRequest.java` - REST update fulfillment request

### Validation Layer
- `validation/CartRequestValidator.java` - REST request validation

### External Service Clients
- `client/ProductServiceClient.java` - Product service integration with Resilience4j
- `client/CustomerServiceClient.java` - Customer service integration
- `client/DiscountServiceClient.java` - Discount service integration
- `client/FulfillmentServiceClient.java` - Fulfillment service integration

### Configuration
- `config/SecurityConfig.java` - OAuth2 resource server with JWT validation
- `config/R2dbcConfiguration.java` - Custom JSONB converters for R2DBC

### Audit
- `audit/AuditEvent.java` - Audit event model
- `audit/AuditEventPublisher.java` - Audit publisher interface
- `audit/NoOpAuditEventPublisher.java` - No-op implementation (logs locally)

## Resources (src/main/resources/)
- `application.yml` - PostgreSQL, Redis, OAuth2, Resilience4j configuration
- `graphql/schema.graphqls` - GraphQL type definitions
- `graphql/operations.graphqls` - GraphQL queries, mutations, subscriptions
- `db/migration/*.sql` - Flyway database migrations

## Test Source (src/test/java/org/example/cart/)

### GraphQL Tests
- `graphql/AbstractGraphQLIntegrationTest.java` - Base test with Testcontainers + Flyway
- `graphql/CartQueryControllerTest.java` - GraphQL query tests
- `graphql/CartMutationControllerTest.java` - GraphQL mutation tests
- `graphql/validation/GraphQLInputValidatorTest.java` - Input validation tests

### Pub/Sub Tests
- `pubsub/CartEventPubSubTest.java` - Redis Pub/Sub integration tests

### Validation Tests
- `validation/CartRequestValidatorTest.java` - REST validation tests

### Application Tests
- `CartServiceApplicationTest.java` - Context load test

## Key Dependencies

| Dependency | Purpose |
|------------|---------|
| platform-logging | Structured JSON logging |
| platform-webflux | Context propagation |
| platform-error | Global error handling |
| platform-resilience | Circuit breaker, retry, timeout |
| platform-security | OAuth2 JWT validation |
| platform-test | Test utilities |
| spring-boot-starter-graphql | GraphQL with SSE subscriptions |
| spring-data-r2dbc | Reactive PostgreSQL |
| spring-data-redis-reactive | Redis Pub/Sub |
| flyway-core | Database migrations |
