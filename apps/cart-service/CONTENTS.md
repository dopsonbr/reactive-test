# Cart Service Contents

## Main Source (src/main/java/org/example/cart/)

### Application Entry
- `CartServiceApplication.java` - Spring Boot application entry point

### Controller Layer
- `controller/CartController.java` - REST endpoints for cart operations
  - `POST /carts` - Create new cart
  - `GET /carts/{cartId}` - Get cart by ID
  - `PUT /carts/{cartId}/items` - Add/update item
  - `DELETE /carts/{cartId}/items/{sku}` - Remove item
  - `GET /carts/{cartId}/summary` - Get cart summary

### Service Layer
- `service/CartService.java` - Business logic with Redis operations

### Domain Layer
- `domain/Cart.java` - Cart record with items and computed totals
- `domain/CartItem.java` - Cart item record (sku, quantity, price)

## Resources (src/main/resources/)
- `application.yml` - Redis connection and server configuration

## Test Source (src/test/java/org/example/cart/)

Currently minimal. Should include:
- `CartServiceApplicationTest.java` - Context load test
- `CartServiceIntegrationTest.java` - Integration test with Redis
- `ArchitectureTest.java` - ArchUnit enforcement

## Key Dependencies

| Dependency | Purpose |
|------------|---------|
| platform-logging | Structured JSON logging |
| platform-webflux | Context propagation |
| platform-error | Global error handling |
| platform-test | Test utilities |
| spring-data-redis | Reactive Redis operations |

## Missing Dependencies (Compared to Product Service)

| Dependency | Reason |
|------------|--------|
| platform-resilience | No external HTTP calls |
| platform-cache | Uses Redis directly |
| platform-security | OAuth2 not yet implemented |
