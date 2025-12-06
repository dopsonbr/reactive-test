# Checkout Service Contents

## Main Source (src/main/java/org/example/checkout/)

| File | Description |
|------|-------------|
| `CheckoutServiceApplication.java` | Spring Boot application entry point with platform package scanning |

### Client Layer
| File | Description |
|------|-------------|
| `client/CartServiceClient.java` | Cart service integration with Resilience4j patterns |
| `client/DiscountServiceClient.java` | Discount service integration for price calculations |
| `client/FulfillmentServiceClient.java` | Fulfillment service integration for inventory reservation |
| `client/PaymentGatewayClient.java` | External payment gateway integration |

### Configuration
| File | Description |
|------|-------------|
| `config/R2dbcConfiguration.java` | Custom JSONB converters for R2DBC |
| `config/SecurityConfig.java` | OAuth2 resource server with JWT validation |

### Controller Layer
| File | Description |
|------|-------------|
| `controller/CheckoutController.java` | REST endpoints for checkout initiate/complete and order retrieval |

### DTO Layer
| File | Description |
|------|-------------|
| `dto/CheckoutSummaryResponse.java` | Response for checkout initiation with session details |
| `dto/CompleteCheckoutRequest.java` | Request to complete checkout with payment info |
| `dto/InitiateCheckoutRequest.java` | Request to start checkout process |
| `dto/OrderResponse.java` | Order details response |

### Model Layer
| File | Description |
|------|-------------|
| `model/AppliedDiscount.java` | Discount applied to order |
| `model/CustomerSnapshot.java` | Customer details snapshot at checkout time |
| `model/DeliveryAddress.java` | Delivery address for fulfillment |
| `model/FulfillmentDetails.java` | Fulfillment plan and reservation details |
| `model/FulfillmentType.java` | Enum for fulfillment types (DELIVERY, PICKUP) |
| `model/Order.java` | Order domain record with nested collections |
| `model/OrderLineItem.java` | Individual item in an order |
| `model/OrderStatus.java` | Enum for order lifecycle states |
| `model/PaymentStatus.java` | Enum for payment states |

### Repository Layer
| File | Description |
|------|-------------|
| `repository/JsonValue.java` | Wrapper type for JSONB column conversion |
| `repository/OrderEntity.java` | Database entity implementing Persistable<UUID> |
| `repository/OrderEntityRepository.java` | Spring Data R2DBC repository |
| `repository/OrderRepository.java` | Repository interface for order operations |
| `repository/PostgresOrderRepository.java` | PostgreSQL implementation with JSONB handling |

### Service Layer
| File | Description |
|------|-------------|
| `service/CheckoutService.java` | Checkout orchestration with multi-service coordination |

### Validation Layer
| File | Description |
|------|-------------|
| `validation/CartValidator.java` | Validates cart state before checkout |
| `validation/CheckoutRequestValidator.java` | Request validation with error aggregation |

## Resources (src/main/resources/)

| File | Description |
|------|-------------|
| `application.yml` | PostgreSQL, external services, OAuth2, Resilience4j configuration |
| `schema.sql` | PostgreSQL schema with JSONB columns |

## Key Dependencies

| Dependency | Purpose |
|------------|---------|
| platform-logging | Structured JSON logging |
| platform-webflux | Context propagation |
| platform-error | Global error handling |
| platform-resilience | Circuit breaker, retry, timeout |
| platform-security | OAuth2 JWT validation |
| spring-data-r2dbc | Reactive PostgreSQL |
