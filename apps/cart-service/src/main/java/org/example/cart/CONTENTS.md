# Contents

| File | Description |
|------|-------------|
| `CartServiceApplication.java` | Spring Boot application entry point with platform package scanning |
| `audit/AuditEvent.java` | Record of cart state change events |
| `audit/AuditEventPublisher.java` | Interface for publishing audit events |
| `audit/NoOpAuditEventPublisher.java` | Default no-op audit publisher implementation |
| `client/CustomerServiceClient.java` | Reactive client for customer-service |
| `client/DiscountServiceClient.java` | Reactive client for discount-service |
| `client/FulfillmentServiceClient.java` | Reactive client for fulfillment-service |
| `client/ProductServiceClient.java` | Reactive client for product-service |
| `config/SecurityConfig.java` | OAuth2 JWT security configuration with scope-based authorization |
| `controller/CartController.java` | REST endpoints for cart lifecycle (create, get, delete) |
| `controller/CartCustomerController.java` | REST endpoint for finding carts by customer ID |
| `controller/CartDiscountController.java` | REST endpoints for applying discounts to carts |
| `controller/CartFulfillmentController.java` | REST endpoints for managing cart fulfillment options |
| `controller/CartProductController.java` | REST endpoints for managing cart products |
| `dto/AddFulfillmentRequest.java` | Request to add fulfillment option to cart |
| `dto/AddProductRequest.java` | Request to add product to cart |
| `dto/ApplyDiscountRequest.java` | Request to apply discount to cart |
| `dto/CreateCartRequest.java` | Request to create new cart |
| `dto/SetCustomerRequest.java` | Request to associate customer with cart |
| `dto/UpdateFulfillmentRequest.java` | Request to update fulfillment option quantity |
| `dto/UpdateProductRequest.java` | Request to update product quantity |
| `model/Cart.java` | Aggregate root containing all cart data |
| `model/CartTotals.java` | Calculated totals (subtotal, discounts, fulfillment, tax, grand total) |
| `repository/CartEntity.java` | JPA entity for cart persistence with JSONB columns |
| `repository/CartEntityRepository.java` | Spring Data R2DBC repository for CartEntity |
| `repository/CartRepository.java` | Domain repository interface for Cart aggregate |
| `repository/PostgresCartRepository.java` | PostgreSQL implementation converting between Cart and CartEntity |
| `service/CartService.java` | Business logic for cart operations and external service orchestration |
| `validation/CartRequestValidator.java` | Request validation collecting all errors before throwing |
